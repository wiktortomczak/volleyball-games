/* global goog */
/* global proto */

import 'goog:goog.array';
import 'goog:goog.asserts';

import Arrays from 'base/js/arrays';
import Iterators from 'base/js/iterators';
import Observable from 'base/js/observable';
import {Dates, dateFromTimestamp, dateToTimestamp} from 'base/js/time';

import 'goog:proto.CancelationFee';
import 'goog:proto.Game.State';
import 'goog:proto.GameAddRequest';
import 'goog:proto.GameCancelRequest';
import 'goog:proto.GameRef';
import 'goog:proto.GameSetNotifyPlayerIfPlaceFreeRequest';
import 'goog:proto.GameSetPlayerSignedUpRequest';
import 'goog:proto.GameUpdateRequest';
import 'goog:proto.GamesPromiseClient';
import 'goog:proto.PlayerAddOrTouchRequest';
import 'goog:proto.PlayerTransactionAddRequest';
import 'goog:proto.PlayerUpdateRequest';
import 'goog:proto.StreamDataRequest';
import 'goog:proto.Transaction.Type';

import config from 'config';
import {FacebookAuth, FacebookUtil} from 'fe/facebook';
import feConfig from 'fe/fe-config.js';


/**
 * Model part of volleyball Games JS web app:
 *  - View of backend (API) data. Read-only, automatically sync'ed in real time.
 *  - API calls, for changing API data
 *  - JS web app state
 */
export default class Model extends Observable {
  
  static create() {
    return new this(FacebookAuth.create(), this._createGamesClient.bind(this));
  }

  constructor(auth, createGamesClientFunc) {
    super();
    this._auth = auth;
    this._createGamesClientFunc = createGamesClientFunc;

    this._players = new Map();
    this._games = new Map();

    this._notifications = [];
    this._waitingForServerDataWarning = null;
    this._waitingForServerDataTimeout = null;

    this._gamesClient = null;
    this._hasGamesData = false;

    this._isAdminMode = false;

    this._setGamesClientFromUserCredentials(auth.userCredentials);
    auth.onChange(() => {
      this._setGamesClientFromUserCredentials(auth.userCredentials);
      this._notifyChanged();
    });
  }

  get auth() {
    return this._auth;
  }

  get hasGamesData() {
    return this._hasGamesData;
  }

  get isAdminMode() {
    return this._isAdminMode;
  }

  getUser(opt_allowNull) {
    if (this._hasGamesData) {
      return this._players.get(this._auth.userCredentials.facebookId);
    } else {
      goog.asserts.assert(opt_allowNull);
      return null;
    }
  }

  get players() {
    return this._players;
  }

  getUpcomingGames() {
    return Game.sortByTimeAscending(Iterators.toArray(
      Iterators.filter(this._games.values(), game => game.isUpcoming)));
  }

  getLastGame() {
    return goog.array.last(this.getUpcomingGames());
  }
  
  getEndedGames() {
    return Game.sortByTimeAscending(Iterators.toArray(
      Iterators.filter(this._games.values(), game => game.isEnded)));
  }

  get notifications() {
    return this._notifications;
  }

  setIsAdminMode(isAdminMode) {
    this._isAdminMode = isAdminMode;
    this._notifyChanged();
  }

  addGame(opt_startTime, opt_endTime, opt_location, opt_facebookEventUrl,
         opt_pricePln, opt_maxSignedUpPlayers) {
    const request = new proto.GameAddRequest;
    if (opt_startTime) {
      request.setStartTime(dateToTimestamp(opt_startTime));
    }
    if (opt_endTime) {
      request.setEndTime(dateToTimestamp(opt_endTime));
    }
    if (goog.isDefAndNotNull(opt_location)) {
      request.setLocation(opt_location);
    }
    if (goog.isDefAndNotNull(opt_facebookEventUrl)) {
      request.setFacebookEventUrl(opt_facebookEventUrl);
    }
    if (goog.isDefAndNotNull(opt_pricePln)) {
      request.setPricePln(opt_pricePln);
    }
    if (goog.isDefAndNotNull(opt_maxSignedUpPlayers)) {
      request.setMaxSignedUp(opt_maxSignedUpPlayers);
    }
    return this._catchUserVisibleException(
      this._gamesClient.gameAdd(request));
  }

  addSuccess(text, opt_isSticky) {
    const notification = Notification.success(text, opt_isSticky);
    this._notifications.push(notification);
    this._notifyChanged();
    return notification;
  }

  addError(text, opt_isSticky) {
    const notification = Notification.error(text, opt_isSticky);
    this._notifications.push(notification);
    this._notifyChanged();
    return notification;
  }

  addWarning(text, opt_isSticky) {
    const notification = Notification.warning(text, opt_isSticky);
    this._notifications.push(notification);
    this._notifyChanged();
    return notification;
  }

  removeNotification(notification) {
    this._notifications = Arrays.remove(this._notifications, notification);
    this._notifyChanged();
  }
  
  _setGamesClientFromUserCredentials(userCredentials) {
    if (userCredentials) {
      this._connectToGamesService(userCredentials);
    } else {
      // TODO: Cancel active gamesClient RPCs.
      this._gamesClient = null;
      this._hasGamesData = false;
      this._players.clear();
      this._games.clear();
    }
  }

  _connectToGamesService(userCredentials) {
    this._gamesClient = this._createGamesClientFunc(userCredentials);

    this._gamesClient.playerAddOrTouch(
      proto.PlayerAddOrTouchRequest.fromObject({
        facebookId: userCredentials.facebookId,
        name: userCredentials.name}))
      .then(() => this._streamDataFromGamesService(userCredentials));
  }

  _streamDataFromGamesService(userCredentials) {
    const gamesDataStream = this._gamesClient.streamData(
      proto.StreamDataRequest.fromObject({
        facebookId: userCredentials.facebookId}));
    this._addWaitingForServerDataWarning();
    let hasData = false;  // TODO: Redundant with this._hasGamesData?
    gamesDataStream.on('data', gamesData => {
      hasData = true;
      this._removeWaitingForServerDataWarning();
      this._updateFromGamesData(gamesData);
    });
    gamesDataStream.on('error', error => {
      if (error.code == 14 && hasData) {
        // Likely a termination of an idle HTTP keep-alive request.
        this._streamDataFromGamesService(userCredentials);
      } else {
        console.log('StreamData error');
        console.log(error);
      }
    });
  }

  static _createGamesClient(userCredentials) {
    // TODO: Use userCredentials.
    return new proto.GamesPromiseClient(feConfig.uri);
  }

  _updateFromGamesData(gamesData) {
    this._players.clear();
    this._games.clear();
    gamesData.getGameList().forEach(gameProto => {
      const game = new Game(gameProto, this);
      this._games.set(game.id, game);
    });
    gamesData.getPlayerList().forEach(playerProto => {
      const player = Player.create(playerProto, this._games, this._gamesClient);
      this._players.set(player.facebookId, player);
    });
    this._games.forEach(game => game._resolvePlayerRefs(this._players));
    this._hasGamesData = true;
    this._notifyChanged();
  }

  _addWaitingForServerDataWarning() {
    this._waitingForServerDataTimeout = window.setTimeout(() => {
      if (!this._waitingForServerDataWarning) {
        this._waitingForServerDataWarning =
          this.addWarning('Waiting for server data...', true /* isSticky */);
      }
    }, 1000);
  }

  _removeWaitingForServerDataWarning() {
    if (this._waitingForServerDataWarning) {
      this.removeNotification(this._waitingForServerDataWarning);
      this._waitingForServerDataWarning = null;
    }
    window.clearTimeout(this._waitingForServerDataTimeout);
    this._waitingForServerDataTimeout = null;
  }

  _catchUserVisibleException(promise) {
    return promise.catch(error => {
      if (error.message) {
        const index = error.message.indexOf('UserVisibleException: ');
        if (index != -1) {
          const userVisibleError = error.message.substr(
            index + 'UserVisibleException: '.length);
          this.addError(userVisibleError);
        }
      }
      throw error;
    });
  }
}

export class Player {

  static create(proto, games, gamesClient) {
    const transactions = proto.getPayments().getTransactionList().map(
      transactionProto => Transaction.create(transactionProto, games));
    transactions.sort((a, b) => (
      a.getTimestamp().getTime() - b.getTimestamp().getTime()));
    return new this(proto, transactions, gamesClient);
  }
  
  constructor(proto, transactions, gamesClient) {
    this._proto = proto;
    this._transactions = transactions;
    this._gamesClient = gamesClient;
  }

  get facebookId() {
    return this._proto.getFacebookId();
  }

  get name() {
    return this._proto.getName();
  }

  getProfilePictureUrl() {
    return FacebookUtil.getUserProfilePictureUrl(this.facebookId);
  }

  get email() {
    return this._proto.getEmail();
  }

  get hasEmail() {
    return this._proto.hasEmail();
  }

  get isAdmin() {
    return this._proto.getIsAdmin();
  }

  getLastTouch() {
    return this._proto.hasLastTouch()
      ? dateFromTimestamp(this._proto.getLastTouch()) : null;
  }

  get bankTransferId() {
    return this._proto.getBankTransferId();
  }

  get notifyIfNewGame() {
    return this._proto.getNotifyIfNewGame();
  }

  get balancePln() {
    return this._proto.getPayments().getBalancePln();
  }
  
  get freeBalancePln() {
    return this._proto.getPayments().getFreeBalancePln();
  }

  get totalDepositedPln() {
    return this._proto.getPayments().getTotalDepositedPln();
  }

  get totalPaidPln() {
    return this._proto.getPayments().getTotalPaidPln();
  }

  get totalBlockedPln() {
    return this._proto.getPayments().getTotalBlockedPln();
  }

  get IBAN() {
    return this._proto.getIban();
  }

  get transactions() {
    return this._transactions;
  }

  update({email, notifyIfNewGame, iban}) {
    const request = proto.PlayerUpdateRequest.fromObject({
      player: {facebookId: this.facebookId}});
    if (goog.isDef(email)) {
      request.setEmail(email);
    }
    if (goog.isDef(notifyIfNewGame)) {
      request.setNotifyIfNewGame(notifyIfNewGame);
    }
    if (goog.isDef(iban)) {
      request.setIban(iban);
    }
    return this._gamesClient.playerUpdate(request);
  }

  deposit(amountPln, source) {
    return this.addTransaction(
      proto.Transaction.Type.UPCOMING, amountPln, null, source);
  }

  addTransaction(type, amountPln, opt_game, opt_depositSource) {
    goog.asserts.assert(!!opt_game != !!opt_depositSource);
    const request = proto.PlayerTransactionAddRequest.fromObject({
      player: {facebookId: this.facebookId},
      type,
      amountPln});
    if (goog.isDefAndNotNull(opt_game)) {
      request.setGame(proto.GameRef.fromObject({id: opt_game.id}));
    }
    if (goog.isDefAndNotNull(opt_depositSource)) {
      request.setDepositSource(opt_depositSource);
    }
    return this._gamesClient.playerTransactionAdd(request);
  }
}

export class Transaction {

  static create(proto, games) {
    const game = proto.hasGame()
      ? games.get(proto.getGame().getId()) : null;
    return new this(proto, game);
  }

  constructor(proto, game) {
    this._proto = proto;
    this._game = game;
    goog.asserts.assert(proto.hasGame() == !!game);
  }

  getTimestamp() {
    return dateFromTimestamp(this._proto.getTimestamp());
  }

  get type() {
    return this._proto.getType();
  }

  get amountPln() {
    return this._proto.getAmountPln();
  }

  get details() {
    if (this._game) {
      return this._game;
    } else if (this._proto.hasDepositSource()) {
      return this._proto.getDepositSource();
    } else if (this._proto.hasWithdrawalIban()) {
      return this._proto.getWithdrawalIban();
    } else {
      goog.asserts.fail();
    }
  }
}

export class Game {

  constructor(proto, model) {
    this._proto = proto;
    this._model = model;
    goog.asserts.assert(
      this._proto.getSignedUpList().length >= this.maxSignedUpPlayers
      || !this._proto.getWaitingList().length);
    // Set in _resolvePlayerRefs().
    this._signedUpPlayers = null;
    this._waitingPlayers = null;
    this._playersToNotifyIfPlaceFree = null;
  }

  _resolvePlayerRefs(players) {
    this._signedUpPlayers = this._proto.getSignedUpList().map(playerRef => (
      players.get(playerRef.getFacebookId())));
    this._waitingPlayers = this._proto.getWaitingList().map(playerRef => (
      players.get(playerRef.getFacebookId())));
    this._playersToNotifyIfPlaceFree = this._proto.getToNotifyIfPlaceFreeList()
      .map(playerRef => players.get(playerRef.getFacebookId()));
  }

  get id() {
    return this._proto.getId();
  }

  getStartTime() {
    return dateFromTimestamp(this._proto.getStartTime());
  }

  getEndTime() {
    return dateFromTimestamp(this._proto.getEndTime());
  }
  
  get location() {
    return this._proto.getLocation();
  }

  get hasFacebookEventUrl() {
    return this._proto.hasFacebookEventUrl();
  }

  get facebookEventUrl() {
    return this._proto.getFacebookEventUrl();
  }

  get pricePln() {
    return this._proto.getPricePln();
  }

  static get defaultPricePln() {
    return 18;
  }

  get isUpcoming() {
    return this._proto.getState() == proto.Game.State.UPCOMING;
  }

  get isEnded() {
    return this._proto.getState() == proto.Game.State.ENDED;
  }

  get isCanceled() {
    return this._proto.getState() == proto.Game.State.CANCELED;
  } 
  
  get maxSignedUpPlayers() {
    return this._proto.getMaxSignedUp();
  }

  static get defaultMaxSignedUpPlayers() {
    return 12;
  }

  isPlayerSignedUpOrWaiting(player) {
    return this._signedUpPlayers.includes(player)
      || this._waitingPlayers.includes(player);
  }

  isPlayerWaiting(player) {
    return this._waitingPlayers.includes(player);
  }

  get signedUpPlayers() {
    return this._signedUpPlayers;
  }

  get waitingPlayers() {
    return this._waitingPlayers;
  }

  get hasMaxSignedUpPlayers() {
    return this.signedUpPlayers.length >= this.maxSignedUpPlayers;
  }

  getNotifyIfPlaceFree(player) {
    return this._playersToNotifyIfPlaceFree.includes(player);
  }

  getCancelationFee() {
    const daysLeft = Math.max(Math.floor(
      (this.getStartTime() - window.now()) / _NUM_MILLISECONDS_IN_DAY), 0);
    for (let fee of this.getCancelationFees()) {
      if (fee.getMinDays() <= daysLeft &&
          (!fee.hasMaxDays() || daysLeft < fee.getMaxDays())) {
        return fee.getFeePln();
      }
    }
  }

  getCancelationFees() {
    return this.constructor.cancelationFeeRules.map(rule => (
      proto.CancelationFee.fromObject({
        minDays: rule.getMinDays(),
        maxDays: rule.hasMaxDays() ? rule.getMaxDays() : undefined,
        feePln: Math.round(rule.getFraction() * this.pricePln)
      })));
  }

  static get cancelationFeeRules() {
    return config.getCancelationFeeRuleList();
  }

  static sortByTimeAscending(games) {
    return games.sort((a, b) => (
      a.getStartTime().getTime() - b.getStartTime().getTime()));
  }

  update(opt_startTime, opt_endTime, opt_location, opt_facebookEventUrl,
         opt_pricePln, opt_maxSignedUpPlayers) {
    const request = proto.GameUpdateRequest.fromObject({game: {id: this.id}});
    if (opt_startTime) {
      request.setStartTime(dateToTimestamp(opt_startTime));
    }
    if (opt_endTime) {
      request.setEndTime(dateToTimestamp(opt_endTime));
    }
    if (goog.isDefAndNotNull(opt_location)) {
      request.setLocation(opt_location);
    }
    if (goog.isDefAndNotNull(opt_facebookEventUrl)) {
      request.setFacebookEventUrl(opt_facebookEventUrl);
    }
    if (goog.isDefAndNotNull(opt_pricePln)) {
      request.setPricePln(opt_pricePln);
    }
    if (goog.isDefAndNotNull(opt_maxSignedUpPlayers)) {
      request.setMaxSignedUp(opt_maxSignedUpPlayers);
    }
    return this._model._catchUserVisibleException(
      this._model._gamesClient.gameUpdate(request));
  }

  cancel() {
    return this._model._gamesClient.gameCancel(
      proto.GameCancelRequest.fromObject({
        game: {id: this.id}
      }));
  }

  setPlayerSignedUp(player, isSignedUp) {
    return this._model._gamesClient.gameSetPlayerSignedUp(
      proto.GameSetPlayerSignedUpRequest.fromObject({
        game: {id: this.id},
        player: {facebookId: player.facebookId},
        isSignedUp: isSignedUp
      }));
  }
  
  setNotifyIfPlaceFree(player, shouldNotify) {
    return this._model._gamesClient.gameSetNotifyPlayerIfPlaceFree(
      proto.GameSetNotifyPlayerIfPlaceFreeRequest.fromObject({
        game: {id: this.id},
        player: {facebookId: player.facebookId},
        shouldNotify: shouldNotify
      }));
  }
}

export class GameBuilder {

  constructor(opt_game, opt_model) {
    goog.asserts.assert(!!opt_game != !!opt_model);
    this._game = opt_game;
    this._model = opt_model;
    this._date = opt_game ? opt_game.getStartTime() : null;
    this._startTime = opt_game ? opt_game.getStartTime() : null;
    this._endTime = opt_game ? opt_game.getEndTime() : null;
    this._location = opt_game ? opt_game.location : null;
    this._facebookEventUrl = opt_game && opt_game.hasFacebookEventUrl
      ? opt_game.facebookEventUrl : null;
    this._pricePln = opt_game ? opt_game.pricePln : Game.defaultPricePln;
    this._signedUpPlayers = opt_game ? opt_game.signedUpPlayers : null;
    this._maxSignedUpPlayers = opt_game
      ? opt_game.maxSignedUpPlayers : Game.defaultMaxSignedUpPlayers;
  }

  get isNewGame() {
    return !this._game;
  }

  get id() {
    return this._game ? this._game.id : null;
  }

  getDateStr() {
    return this._date ? Dates.format(this._date, 'DD.MM.YYYY') : null;
  }

  getStartTimeStr() {
    return this._startTime ? Dates.format(this._startTime, 'HH:mm') : null;
  }

  getEndTimeStr() {
    return this._endTime ? Dates.format(this._endTime, 'HH:mm') : null;
  }

  get location() {
    return this._location;
  }

  get facebookEventUrl() {
    return this._facebookEventUrl;
  }

  get pricePln() {
    return this._pricePln;
  }

  get signedUpPlayers() {
    return this._signedUpPlayers;
  }

  get maxSignedUpPlayers() {
    return this._maxSignedUpPlayers;
  }
 
  setDate(dateStr) {
    const date = Dates.fromString(dateStr, 'DD.MM.YYYY');
    this._date = Dates.isValid(date) ? date : null;
  }
  
  setStartTime(timeStr) {
    const time = Dates.fromString(timeStr, 'HH:mm');
    this._startTime = Dates.isValid(time) ? time : null;
  }

  setEndTime(timeStr) {
    const time = Dates.fromString(timeStr, 'HH:mm');
    this._endTime = Dates.isValid(time) ? time : null;
  }

  setLocation(location) {
    this._location = location;
  }

  setFacebookEventUrl(url) {
    this._facebookEventUrl = url;
  }

  setPricePln(pricePln) {
    this._pricePln = pricePln;
  }

  setMaxSignedUpPlayers(maxSignedUpPlayers) {
    this._maxSignedUpPlayers = maxSignedUpPlayers;
  }

  addOrUpdate() {
    const addOrUpdateFunc = this._game
      ? this._game.update.bind(this._game)
      : this._model.addGame.bind(this._model);
    return addOrUpdateFunc(
      this._mergeDateTime(this._startTime),
      this._mergeDateTime(this._endTime),
      this._location,
      this._facebookEventUrl,
      this._pricePln,
      this._maxSignedUpPlayers);
  }

  _mergeDateTime(time) {
    return this._date & time
      ? new Date(
        this._date.getFullYear(),
        this._date.getMonth(),
        this._date.getDate(),
        time.getHours(),
        time.getMinutes())
      : null;
  }
}

export class Notification {

  static success(text, opt_isSticky) {
    return new this('success', text, opt_isSticky);
  }

  static error(text, opt_isSticky) {
    return new this('error', text, opt_isSticky);
  }

  static warning(text, opt_isSticky) {
    return new this('warning', text, opt_isSticky);
  }

  constructor(type, text, opt_isSticky) {
    this.type = type;
    this.text = text;
    this.isSticky = opt_isSticky;
  }
}

const _NUM_MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
