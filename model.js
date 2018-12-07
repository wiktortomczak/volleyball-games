/* global goog */
/* global proto */

import 'goog:goog.asserts';
import 'goog:proto.Game.State';
import 'goog:proto.GameSetNotifyPlayerIfPlaceFreeRequest';
import 'goog:proto.GameSetPlayerSignedUpRequest';
import 'goog:proto.GamesPromiseClient';
import 'goog:proto.PlayerAddRequest';
import 'goog:proto.PlayerUpdateRequest';
import 'goog:proto.StreamDataRequest';
import Iterators from 'base/js/iterators';
import Observable from 'base/js/observable';
import {dateFromTimestamp} from 'base/js/time';
import {FacebookAuth, FacebookUtil} from 'facebook';
import {dateFormat} from 'formatting';


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

  getUser() {
    goog.asserts.assert(this._hasGamesData);
    return this._players.get(this._auth.userCredentials.facebookId);
  }

  getUpcomingGames() {
    return Game.sortByTimeAscending(Iterators.toArray(
      Iterators.filter(this._games.values(), game => game.isUpcoming)));
  }

  getPastGames() {
    return Game.sortByTimeAscending(Iterators.toArray(
      Iterators.filter(this._games.values(), game => !game.isUpcoming)));
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

    this._gamesClient.playerAdd(
      proto.PlayerAddRequest.fromObject({
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
    return new proto.GamesPromiseClient('https://localhost:8080');
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

  getShortDescription() {
    return 'the game on ' + dateFormat.format(this.getStartTime());
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
  
  get maxSignedUpPlayers() {
    return this._proto.getMaxSignedUp();
  }

  isPlayerSignedUpOrWaiting(player) {
    return this._signedUpPlayers.includes(player)
      || this._waitingPlayers.includes(player);
  }

  get maxSignedUp() {
    return this._proto.getMaxSignedUp();
  }

  get signedUpPlayers() {
    return this._signedUpPlayers;
  }

  get waitingPlayers() {
    return this._waitingPlayers;
  }

  get hasMaxSignedUpPlayers() {
    return this.signedUpPlayers.length >= this.maxSignedUp;
  }

  getNotifyIfPlaceFree(player) {
    return this._playersToNotifyIfPlaceFree.includes(player);
  }
  
  getCancelationFee() {
    const daysLeft = 1;  // TODO
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
