/* global goog */
/* global proto */

import 'goog:proto.Game.State';
import 'goog:proto.GamesData';
import 'goog:proto.Transaction';
import {WritableStream} from 'base/js/stream';


export default class MockGamesClient {

  constructor() {
    this._gamesData = proto.GamesData.fromObject({
      playerList: [
        {
          facebookId: '123',
          name: 'John Doe',
          bankTransferId: 'JD1',
          payments: {
            balancePln: 32,
            freeBalancePln: 32,
            totalDepositedPln: 50,
            totalPaidPln: 18,
            totalWithdrawnPln: 0,
            transactionList: [
              {
                timestamp: {secondsSinceEpoch: 1542890700},  // 2018-11-22 13:45
                type: proto.Transaction.Type.PAYMENT,
                amountPln: 18,
                game: {id: '9'}
              },
              {
                timestamp: {secondsSinceEpoch: 1542870600},  // 2018-11-22 08:10
                type: proto.Transaction.Type.DEPOSIT,
                amountPln: 50,
                depositSource: 'volleyball JD1'
              },
            ]
          }
        },
        {
          facebookId: '101',
          name: 'Aaa Aaa',
          payments: {}
        },
        {
          facebookId: '102',
          name: 'Bbb Bbb',
          payments: {}
        },
        {
          facebookId: '103',
          name: 'Ccc Ccc',
          payments: {}
        },
        {
          facebookId: '104',
          name: 'Ddd Ddd',
          payments: {}
        },
        {
          facebookId: '105',
          name: 'Eee Eee',
          payments: {}
        },
        {
          facebookId: '106',
          name: 'Fff Fff',
          payments: {}
        },
        {
          facebookId: '107',
          name: 'Ggg Ggg',
          payments: {}
        },
        {
          facebookId: '108',
          name: 'Hhh Hhh',
          payments: {}
        },
        {
          facebookId: '109',
          name: 'Iii Iii',
          payments: {}
        },
        {
          facebookId: '110',
          name: 'Jjj Jjj',
          payments: {}
        },
        {
          facebookId: '111',
          name: 'Kkk Kkk',
          payments: {}
        },
        {
          facebookId: '112',
          name: 'Lll Lll',
          payments: {}
        },
        {
          facebookId: '113',
          name: 'Mmm Mmm',
          payments: {}
        },
      ],
      gameList: [
        {
          id: '7',
          startTime: {secondsSinceEpoch: 1541865600},  // 2018-11-10 17:00
          endTime: {secondsSinceEpoch: 1541872800},    // 2018-11-10 19:00
          location: 'Bobrowiecka 9',
          facebookEventUrl: '#',
          pricePln: 18,
          state: proto.Game.State.SETTLED,
          maxSignedUp: 12
        },
        {
          id: '8',
          startTime: {secondsSinceEpoch: 1542470400},  // 2018-11-17 17:00
          endTime: {secondsSinceEpoch: 1542477600},    // 2018-11-17 19:00
          location: 'Bobrowiecka 9',
          facebookEventUrl: '#',
          pricePln: 18,
          state: proto.Game.State.ENDED,
          maxSignedUp: 12
        },
        {
          id: '9',
          startTime: {secondsSinceEpoch: 1543075200},  // 2018-11-24 17:00
          endTime: {secondsSinceEpoch: 1543082400},    // 2018-11-24 19:00
          location: 'Bobrowiecka 9',
          facebookEventUrl: '#',
          pricePln: 18,
          state: proto.Game.State.UPCOMING,
          maxSignedUp: 12,
          signedUpList: [
            {facebookId: '101'},
            {facebookId: '102'},
            {facebookId: '103'},
            {facebookId: '104'},
            {facebookId: '105'},
            {facebookId: '106'},
            {facebookId: '107'},
            {facebookId: '108'},
            {facebookId: '109'},
            {facebookId: '110'},
            {facebookId: '111'},
            {facebookId: '123'}
          ],
          waitingList: [
            {facebookId: '112'},
            {facebookId: '113'}
          ]
        },
        {
          id: '10',
          startTime: {secondsSinceEpoch: 1543680000},  // 2018-12-01 17:00
          endTime: {secondsSinceEpoch: 1543687200},    // 2018-12-01 19:00
          location: 'Bobrowiecka 9',
          facebookEventUrl: '#',
          pricePln: 18,
          state: proto.Game.State.UPCOMING,
          maxSignedUp: 12,
          signedUpList: [
            {facebookId: '101'},
            {facebookId: '102'},
            {facebookId: '103'},
          ]
        }
      ]
    });
    this._gamesDataStream = null;  // Set in streamData().
  }
  
  /**
   * @return {!grpc.web.ClientReadableStream}
   */ 
  streamData(request, metadata) {
    this._gamesDataStream = new ClientWritableStream();
    this._gamesDataStream.put(this._gamesData);
    return this._gamesDataStream;
  }
  
  /**
   * @return {!Promise}
   */ 
  playerAdd(request, metadata) {
    return Promise.resolve(null);
  }

  playerUpdate(request, metadata) {
    const player = this._gamesData.getPlayerList()[0];
    goog.asserts.assert(player.getFacebookId() ==
                        request.getPlayer().getFacebookId());
    if (request.hasEmail()) {
      if (request.getEmail()) {
        const hadEmail = player.hasEmail();
        player.setEmail(request.getEmail());
        if (!hadEmail) {
          player.setNotifyIfNewGame(true);
        }
      } else {
        player.clearEmail();
      }     
    }
    if (request.hasNotifyIfNewGame()) {
      player.setNotifyIfNewGame(request.getNotifyIfNewGame());
    }
    if (request.hasIban()) {
      if (request.getIban()) {
        player.setIban(request.getIban());
      } else {
        player.clearIban();
      }     
    }
    this._gamesDataStream.put(this._gamesData);
    return Promise.resolve(null);
  }

  gameSetPlayerSignedUp(request, metadata) {
    if (request.getIsSignedUp()) {
      const game = this._gamesData.getGameList()[3];
      goog.asserts.assert(game.getId() == request.getGame().getId());
      game.addSignedUp(request.getPlayer());
      const player = this._gamesData.getPlayerList()[0];
      goog.asserts.assert(player.getFacebookId() ==
                          request.getPlayer().getFacebookId());
      player.getPayments().setBalancePln(
        player.getPayments().getBalancePln() - game.getPricePln());
      player.getPayments().setTotalPaidPln(
        player.getPayments().getTotalPaidPln() + game.getPricePln());
      player.getPayments().addTransaction(proto.Transaction.fromObject({
        timestamp: {secondsSinceEpoch: 1543575600},  // 2018-11-30 12:00
        type: proto.Transaction.Type.PAYMENT,
        amountPln: game.getPricePln(),
        game: {id: game.getId()}
      }));
    } else {
      const game = this._gamesData.getGameList()[2];
      goog.asserts.assert(game.getId() == request.getGame().getId());
      const player = this._gamesData.getPlayerList()[0];
      goog.asserts.assert(player.getFacebookId() ==
                          request.getPlayer().getFacebookId());
      game.setSignedUpList(
        game.getSignedUpList().filter(
          p => p.getFacebookId() != player.getFacebookId())
        .concat([game.getWaitingList()[0]]));
      game.setWaitingList(game.getWaitingList().slice(1));
      const fee = 9;
      const returned = game.getPricePln() - fee;
      player.getPayments().setBalancePln(
        player.getPayments().getBalancePln() + returned);
      player.getPayments().setTotalPaidPln(
        player.getPayments().getTotalPaidPln() - returned);
      player.getPayments().addTransaction(proto.Transaction.fromObject({
        timestamp: {secondsSinceEpoch: 1543575600},  // 2018-11-30 12:00
        type: proto.Transaction.Type.RETURN,
        amountPln: game.getPricePln(),
        game: {id: game.getId()}
      }));
      player.getPayments().addTransaction(proto.Transaction.fromObject({
        timestamp: {secondsSinceEpoch: 1543575600},  // 2018-11-30 12:00
        type: proto.Transaction.Type.CANCELATION_FEE,
        amountPln: fee,
        game: {id: game.getId()}
      }));
    }
    this._gamesDataStream.put(this._gamesData);
    return Promise.resolve(null);    
  }

  gameSetNotifyPlayerIfPlaceFree(request, metadata) {
    const game = this._gamesData.getGameList()[2];
    goog.asserts.assert(game.getId() == request.getGame().getId());
    const player = this._gamesData.getPlayerList()[0];
    goog.asserts.assert(player.getFacebookId() ==
                        request.getPlayer().getFacebookId());
    game.addToNotifyIfPlaceFree(request.getPlayer());
    this._gamesDataStream.put(this._gamesData);
    return Promise.resolve(null);    
  }
}

/**
 * @implements {grpc.web.ClientReadableStream}
 */
class ClientWritableStream extends WritableStream {

  on(eventType, callback) {
    if (eventType == 'data') {
      this.onData(callback);
    } else {
      throw Error('Not implemented');
    }
  }
}
