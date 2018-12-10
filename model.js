/* global goog */
/* global proto */

import 'goog:goog.asserts';
import 'goog:goog.Uri';
import 'goog:proto.Game.State';
import 'goog:proto.GameAddRequest';
import 'goog:proto.GameCancelRequest';
import 'goog:proto.GameUpdateRequest';
import 'goog:proto.GameSetNotifyPlayerIfPlaceFreeRequest';
import 'goog:proto.GameSetPlayerSignedUpRequest';
import 'goog:proto.GamesPromiseClient';
import 'goog:proto.PlayerAddOrTouchRequest';
import 'goog:proto.PlayerUpdateRequest';
import 'goog:proto.StreamDataRequest';
import Iterators from 'base/js/iterators';
import Observable from 'base/js/observable';
import {Dates, dateFromTimestamp, dateToTimestamp} from 'base/js/time';
import {FacebookAuth, FacebookUtil} from 'facebook';


export default class Model extends Observable {
  
  static create() {
    return new this(FacebookAuth.create(), this._createGamesClient);
  }

  constructor(auth, createGamesClientFunc) {
    super();
    this._auth = auth;
    this._createGamesClientFunc = createGamesClientFunc;

    this._players = new Map();
    this._games = new Map();

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

  getUser() {
    goog.asserts.assert(this._hasGamesData);
    return this._players.get(this._auth.userCredentials.facebookId);
  }

  getUpcomingGames() {
    return Game.sortByTimeAscending(Iterators.toArray(
      Iterators.filter(this._games.values(), game => game.isUpcoming)));
  }

  getEndedGames() {
    return Game.sortByTimeAscending(Iterators.toArray(
      Iterators.filter(this._games.values(), game => game.isEnded)));
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
    return this._gamesClient.gameAdd(request);
  }
  
  _setGamesClientFromUserCredentials(userCredentials) {
    if (userCredentials) {
      this._connectToGamesService(userCredentials);
    } else {
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
      .then(() => {
        const gamesDataStream = this._gamesClient.streamData(
          proto.StreamDataRequest.fromObject({
            facebookId: userCredentials.facebookId}));
        gamesDataStream.on('data', gamesData => (
          this._updateFromGamesData(gamesData)));
      });
  }

  static _createGamesClient(userCredentials) {
    // TODO: Use userCredentials.
    return new proto.GamesPromiseClient(_getLocationSchemeHostPort());
  }

  _updateFromGamesData(gamesData) {
    this._players.clear();
    this._games.clear();
    gamesData.getGameList().forEach(gameProto => {
      const game = new Game(gameProto, this._gamesClient);
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

  get totalWithdrawnPln() {
    return this._proto.getPayments().getTotalWithdrawnPln();
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

  constructor(proto, gamesClient) {
    this._proto = proto;
    goog.asserts.assert(
      this._proto.getSignedUpList().length >= this.maxSignedUpPlayers
      || !this._proto.getWaitingList().length);
    // Set in _resolvePlayerRefs().
    this._signedUpPlayers = null;
    this._waitingPlayers = null;
    this._playersToNotifyIfPlaceFree = null;
    this._gamesClient = gamesClient;
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
    for (let [[lowerBound, upperBound], fee] of this.getCancelationFees()) {
      if (lowerBound <= daysLeft && (!upperBound || daysLeft < upperBound)) {
        return fee;
      }
    }
  }

  getCancelationFees() {
    return this.constructor.cancelationFees.map(
      ([days, fraction]) => [days, this.pricePln * fraction]);
  }

  static get cancelationFees() {
    return [
      [[7, null], 0],
      [[3, 7], 1/6],
      [[1, 3], 0.5],
      [[0, 1], 1]
    ];
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
    return this._gamesClient.gameUpdate(request);
  }

  cancel() {
    return this._gamesClient.gameCancel(
      proto.GameCancelRequest.fromObject({
        game: {id: this.id}
      }));
  }

  setPlayerSignedUp(player, isSignedUp) {
    return this._gamesClient.gameSetPlayerSignedUp(
      proto.GameSetPlayerSignedUpRequest.fromObject({
        game: {id: this.id},
        player: {facebookId: player.facebookId},
        isSignedUp: isSignedUp
      }));
  }
  
  setNotifyIfPlaceFree(player, shouldNotify) {
    return this._gamesClient.gameSetNotifyPlayerIfPlaceFree(
      proto.GameSetNotifyPlayerIfPlaceFreeRequest.fromObject({
        game: {id: this.id},
        player: {facebookId: player.facebookId},
        shouldNotify: shouldNotify
      }));
  }
}

export class GameBuilder {

  constructor(opt_game, opt_model) {
    super();
    goog.asserts.assert(!!opt_game != !!opt_model);
    this._game = opt_game;
    this._model = opt_model;
    this._date = opt_game ? opt_game.getStartTime() : null;
    this._startTime = opt_game ? opt_game.getStartTime() : null;
    this._endTime = opt_game ? opt_game.getEndTime() : null;
    this._location = opt_game ? opt_game.location : null;
    this._facebookEventUrl = opt_game && opt_game.hasFacebookEventUrl
      ? opt_game.facebookEventUrl : null;
    this._pricePln = opt_game ? opt_game.pricePln : null;
    this._signedUpPlayers = opt_game ? opt_game.signedUpPlayers : null;
    this._maxSignedUpPlayers = opt_game ? opt_game.maxSignedUpPlayers : null;
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

function _getLocationSchemeHostPort() {
  const uri = goog.Uri.parse(window.location.href);
  return (
    (uri.hasScheme() ? (uri.getScheme() + '://') : '')
    + uri.getDomain()
    + (uri.hasPort() ? ':' + uri.getPort() : ''));
}

const _NUM_MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
