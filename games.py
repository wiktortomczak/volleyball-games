
import collections
import threading

import gflags
from base import list_util
from base import time_util
from base.proto import empty_message_pb2
from base.proto import persistent_proto
from base.proto.sync import observable

import vbreg_pb2
import vbreg_pb2_grpc


gflags.DEFINE_string('games_data', None, 'TODO')
FLAGS = gflags.FLAGS


class Games(vbreg_pb2_grpc.GamesServicer):

  @classmethod
  def Create(cls):
    games_data = persistent_proto.PersistentProto.Open(
      vbreg_pb2.GamesData, FLAGS.games_data, create=True)
    return cls(games_data)

  def __init__(self, games_data):
    self._games_data = games_data
    self._games_data_lock = threading.Lock()
    self._players = {}
    self._games = {}

    for player_proto in games_data.player:
      self._AddPlayer(_Player(player_proto), link_to_games_data=False)
    for game_proto in games_data.game:
      game = _Game.FromProto(game_proto, self._players)
      self._AddGame(game, link_to_games_data=False)

  def StreamData(self, request, context):
    print '### StreamData %s' % request,
    try:
      yield self._games_data._message
      # TODO: Do not block.
      for update in self._games_data.IterUpdates():
        # TODO: Fix race condition.
        yield self._games_data._message
    finally:
      print '### StreamData end'

  def PlayerAdd(self, request, context):
    print '### PlayerAdd %s' % request,
    with self._games_data_lock:
      player = self._players.get(request.facebook_id)
      if not player:
        self._AddPlayer(_Player.FromRequest(request, self))
      elif request.error_if_exists:
        raise Exception('%s already exists' % player)
    return empty_message_pb2.EmptyMessage()

  def PlayerUpdate(self, request, context):
    print '### PlayerUpdate %s' % request,
    player = self._players[request.player.facebook_id]
    with self._games_data.HoldUpdates():
      with self._games_data_lock:
        player.Update(request)
    return empty_message_pb2.EmptyMessage()

  def GameSetPlayerSignedUp(self, request, context):
    print '### GameSetPlayerSignedUp %s' % request,
    player = self._players[request.player.facebook_id]
    game = self._games[request.game.id]
    with self._games_data.HoldUpdates():
      with self._games_data_lock:
        game.SetPlayerSignedUp(player, request.is_signed_up)
    return empty_message_pb2.EmptyMessage()

  def GameSetNotifyPlayerIfPlaceFree(self, request, context):
    print '### GameSetNotifyPlayerIfPlaceFree %s' % request,
    player = self._players[request.player.facebook_id]
    game = self._games[request.game.id]
    with self._games_data.HoldUpdates():
      with self._games_data_lock:
        game.SetNotifyPlayerIfPlaceFree(player, request.should_notify)
    return empty_message_pb2.EmptyMessage()

  def _AddPlayer(self, player, link_to_games_data=True):
    self._players[player.facebook_id] = player
    if link_to_games_data:
      self._games_data.player.add().Link(player.proto)

  def _AddGame(self, game, link_to_games_data=True):
    self._games[game.id] = game
    if link_to_games_data:
      self._games_data.game.add().Link(game.proto)


class _Player(object):

  @classmethod
  def FromRequest(cls, request, games):
    proto = vbreg_pb2.Player(
      facebook_id=request.facebook_id,
      name=request.name,
      notify_if_new_game=True,
      bank_transfer_id=cls._GenerateBankTransferId(request.name, games))
    proto.payments.balance_pln = 0
    proto.payments.free_balance_pln = 0
    proto.payments.total_deposited_pln = 0
    proto.payments.total_paid_pln = 0
    proto.payments.total_blocked_pln = 0
    proto.payments.total_withdrawn_pln = 0
    return cls(observable.Create(proto, with_delta=False))

  def __init__(self, proto):
    assert proto.HasField('bank_transfer_id')
    assert proto.HasField('payments')
    assert proto.payments.HasField('balance_pln')
    assert proto.payments.HasField('free_balance_pln')
    assert proto.payments.HasField('total_deposited_pln')
    assert proto.payments.HasField('total_paid_pln')     
    assert proto.payments.HasField('total_blocked_pln')  
    assert proto.payments.HasField('total_withdrawn_pln')
    self._proto = proto

  def __str__(self):
    return 'player facebook_id=%s' % self.facebook_id

  @property
  def proto(self):
    return self._proto

  @property
  def facebook_id(self):
    return self._proto.facebook_id

  def Update(self, request):
    if request.HasField('email'):
      if request.email:
        self._proto.email = request.email
      else:
        self._proto.ClearField('email')

    if request.HasField('notify_if_new_game'):
      self._proto.notify_if_new_game = request.notify_if_new_game

    if request.HasField('iban'):
      if request.iban:
        self._proto.iban = request.iban
      else:
        self._proto.ClearField('iban')

  def Pay(self, amount_pln, game):
    self._proto.payments.balance_pln -= amount_pln
    self._proto.payments.free_balance_pln -= amount_pln
    self._proto.payments.total_paid_pln += amount_pln
    self._proto.payments.transaction.add(
      timestamp=time_util.DateTimeToTimestampProto(time_util.now()),
      type=vbreg_pb2.Transaction.PAY,
      amount_pln=amount_pln,
      game={'id': game.id})

  def Return(self, amount_pln, game):
    self._proto.payments.balance_pln += amount_pln
    self._proto.payments.free_balance_pln += amount_pln
    self._proto.payments.total_paid_pln -= amount_pln
    self._proto.payments.transaction.add(
      timestamp=time_util.DateTimeToTimestampProto(time_util.now()),
      type=vbreg_pb2.Transaction.RETURN,
      amount_pln=amount_pln,
      game={'id': game.id})

  def Block(self, amount_pln, game):
    self._proto.payments.free_balance_pln -= amount_pln
    self._proto.payments.total_blocked_pln += amount_pln
    self._proto.payments.transaction.add(
      timestamp=time_util.DateTimeToTimestampProto(time_util.now()),
      type=vbreg_pb2.Transaction.BLOCK,
      amount_pln=amount_pln,
      game={'id': game.id})

  def Unblock(self, amount_pln, game):
    self._proto.payments.free_balance_pln += amount_pln
    self._proto.payments.total_blocked_pln -= amount_pln
    self._proto.payments.transaction.add(
      timestamp=time_util.DateTimeToTimestampProto(time_util.now()),
      type=vbreg_pb2.Transaction.UNBLOCK,
      amount_pln=amount_pln,
      game={'id': game.id})

  @classmethod
  def _GenerateBankTransferId(cls, name, games):
    acronyms = [s[0] for s in name.split()]
    if all(_IsAsciiLetter(acronym) for acronym in acronyms):
      acronyms = ''.join(acronyms)
    else:
      acronyms = ''
    player_acronyms_last_seq_num = (
      games._games_data.player_acronyms_last_seq_num)
    print acronyms
    if acronyms not in player_acronyms_last_seq_num:
      player_acronyms_last_seq_num[acronyms] = 0
    player_acronyms_last_seq_num[acronyms] += 1
    return '%s%d' % (acronyms, player_acronyms_last_seq_num[acronyms])


def _IsAsciiLetter(c):
  return ord('A') <= ord(c) <= ord('Z') or ord('a') <= ord(c) <= ord('z')


class _Game(object):

  @classmethod
  def FromProto(cls, proto, players):
    signed_up_players = [players[pr.facebook_id] for pr in proto.signed_up]
    waiting_players = [players[pr.facebook_id] for pr in proto.waiting]
    players_to_notify_if_place_free = [
      players[pr.facebook_id] for pr in proto.to_notify_if_place_free]
    return cls(proto, signed_up_players, waiting_players,
               players_to_notify_if_place_free)

  def __init__(self, proto, signed_up_players, waiting_players,
               players_to_notify_if_place_free):
    assert proto.HasField('price_pln')
    assert proto.HasField('state')
    assert proto.HasField('max_signed_up')
    self._proto = proto
    self._signed_up_players = signed_up_players
    self._waiting_players = waiting_players
    self._players_to_notify_if_place_free = players_to_notify_if_place_free

  @property
  def proto(self):
    return self._proto

  @property
  def id(self):
    return self._proto.id

  def GetStartTime(self):
    return time_util.DateTimeFromTimestampProto(self._proto.start_time)

  @property
  def price_pln(self):
    return self._proto.price_pln

  @property
  def is_upcoming(self):
    return self._proto.state == vbreg_pb2.Game.UPCOMING

  @property
  def max_signed_up(self):
    return self._proto.max_signed_up

  def GetCancelationFee(self):
    num_days_before_game = int(
      max((self.GetStartTime() - time_util.now()).total_seconds(), 0) /
      _NUM_SECONDS_IN_DAY)
    fee = list_util.GetOnlyOneByPredicate(
      self._CANCELATION_FEES, lambda fee: (
        fee.num_days_lower_bound <= num_days_before_game and
        (fee.num_days_upper_bound is None or
         num_days_before_game < fee.num_days_upper_bound)))
    return fee.fraction_fee * self.price_pln

  _CancelationFee = collections.namedtuple('_CancelationFee', [
    'num_days_lower_bound', 'num_days_upper_bound', 'fraction_fee'])

  _CANCELATION_FEES = [
    _CancelationFee(7, None, 0),
    _CancelationFee(3, 7, 1./6),
    _CancelationFee(1, 3, 0.5),
    _CancelationFee(0, 1, 1)]

  def SetPlayerSignedUp(self, player, is_signed_up):
    assert self.is_upcoming
    is_player_signed_up = player in self._signed_up_players
    is_player_waiting = player in self._waiting_players

    if is_signed_up:
      assert not (is_player_signed_up or is_player_waiting)
      if len(self._signed_up_players) < self.max_signed_up:
        self._signed_up_players.append(player)
        self._proto.signed_up.add(facebook_id=player.facebook_id)
        player.Pay(self.price_pln, self)
      else:
        self._waiting_players.append(player)
        self._proto.waiting.add(facebook_id=player.facebook_id)
        player.Block(self.price_pln, self)

    else:  # not is_signed_up
      assert is_player_signed_up or is_player_waiting
      if is_player_signed_up:
        self._signed_up_players.remove(player)
        self._PlayerRefListPop(self._proto.signed_up, player)
        player.Return(self.price_pln - self.GetCancelationFee(), self)
        if self._waiting_players:
          waiting_player = self._waiting_players.pop(0)
          waiting_player_ref = self._proto.waiting.pop(0)
          self._signed_up_players.append(waiting_player)
          self._proto.signed_up.add().MergeFrom(waiting_player_ref._message)
          waiting_player.Unblock(self.price_pln, self)
          waiting_player.Pay(self.price_pln, self)
          # TODO: notify waiting_player
        else:
          pass  # TODO: notify to_notify_if_place_free if they are not signed up
      else:  # is_player_waiting
        self._waiting_players.remove(player)
        self._PlayerRefListPop(self._proto.waiting, player)
        player.Unblock(self.price_pln, self)

  def SetNotifyPlayerIfPlaceFree(self, player, should_notify):
    if should_notify:
      assert player not in self._players_to_notify_if_place_free
      self._players_to_notify_if_place_free.append(player)
      self._proto.to_notify_if_place_free.add(facebook_id=player.facebook_id)
    else:
      assert player in self._players_to_notify_if_place_free
      self._players_to_notify_if_place_free.remove(player)
      self._PlayerRefListPop(self._proto.to_notify_if_place_free, player)

  @staticmethod
  def _PlayerRefListPop(player_ref_list, player):
    for i, player_ref in enumerate(player_ref_list):
      if player_ref.facebook_id == player.facebook_id:
        try:
          player_ref_list.pop(i)
        except:
          print '### i', i
          print player_ref_list._container._values
          raise
        return
    raise ValueError('%s not found' % player)


observable.GenerateObservableClass(vbreg_pb2.GamesData, None)


_NUM_SECONDS_IN_DAY = 60 * 60 * 24