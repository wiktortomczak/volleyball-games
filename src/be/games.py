
import Queue
import threading

import gflags

from base import list_util
from base import time_util
from base.proto import empty_message_pb2
from base.proto import persistent_proto
from base.proto.sync import observable

from src import vbreg_pb2
from src import vbreg_pb2_grpc
from src.be import config
from src.be import email
CONFIG = config.CONFIG

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
      game = _Game.FromObservableProto(game_proto, self._players)
      self._AddGame(game, link_to_games_data=False)

  def StreamData(self, request, context):
    print '### StreamData %s' % request,
    queue = Queue.Queue()
    context.add_callback(lambda: queue.put(None))
    handle = self._games_data.ListenUpdates(
      # TODO: Fix race condition. Put current games_data.
      lambda *args: queue.put(True),
      permanent=False, initial_set_update=True)
    try:
      while True:
        if queue.get():
          yield self._games_data._message
        else:
          break
    finally:
      print '### StreamData end'

  def PlayerAddOrTouch(self, request, context):
    print '### PlayerAddOrTouch\n', request
    with self._games_data.HoldUpdates():
      with self._games_data_lock:
        player = self._players.get(request.facebook_id)
        if not player:
          self._AddPlayer(_Player.FromRequest(request, self))
        else:
          player.UpdateLastTouch()
    return empty_message_pb2.EmptyMessage()

  def PlayerUpdate(self, request, context):
    print '### PlayerUpdate\n', request
    player = self._players[request.player.facebook_id]
    with self._games_data.HoldUpdates():
      with self._games_data_lock:
        player.Update(request)
    return empty_message_pb2.EmptyMessage()

  def PlayerTransactionAdd(self, request, context):
    print '### PlayerTransactionAdd\n', request
    player = self._players[request.player.facebook_id]
    if request.HasField('game'):
      game = self._game[request.game.id]
    else:
      game = None
    with self._games_data.HoldUpdates():
      with self._games_data_lock:
        player.AddTransaction(request, game)
    return empty_message_pb2.EmptyMessage()

  def GameSetPlayerSignedUp(self, request, context):
    print '### GameSetPlayerSignedUp\n', request
    player = self._players[request.player.facebook_id]
    game = self._games[request.game.id]
    with self._games_data.HoldUpdates():
      with self._games_data_lock:
        game.SetPlayerSignedUp(player, request.is_signed_up)
    return empty_message_pb2.EmptyMessage()

  def GameSetNotifyPlayerIfPlaceFree(self, request, context):
    print '### GameSetNotifyPlayerIfPlaceFree\n', request
    player = self._players[request.player.facebook_id]
    game = self._games[request.game.id]
    with self._games_data.HoldUpdates():
      with self._games_data_lock:
        game.SetNotifyPlayerIfPlaceFree(player, request.should_notify)
    return empty_message_pb2.EmptyMessage()

  def GameAdd(self, request, context):
    print '### GameAdd\n', request
    with self._games_data.HoldUpdates():
      with self._games_data_lock:
        game = _Game.FromRequest(request, self)
        self._AddGame(game)
      for player in self._players.values():
        if player.has_email and player.notify_if_new_game:
          player.SendEmail_NewGame(game)
    return empty_message_pb2.EmptyMessage()

  def GameUpdate(self, request, context):
    print '### GameUpdate\n', request
    with self._games_data.HoldUpdates():
      with self._games_data_lock:
        game = self._games[request.game.id]
        game.Update(request)
    return empty_message_pb2.EmptyMessage()

  def GameCancel(self, request, context):
    print '### GameCancel\n', request
    with self._games_data.HoldUpdates():
      with self._games_data_lock:
        game = self._games[request.game.id]
        game.Cancel()        
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
      bank_transfer_id=cls._GenerateBankTransferId(request.name, games),
      last_touch=time_util.DateTimeToTimestampProto(time_util.now()))
    proto.payments.balance_pln = 0
    proto.payments.free_balance_pln = 0
    proto.payments.total_deposited_pln = 0
    proto.payments.total_paid_pln = 0
    proto.payments.total_blocked_pln = 0
    return cls(observable.Create(proto, with_delta=False))

  def __init__(self, proto):
    assert proto.HasField('bank_transfer_id')
    assert proto.HasField('payments')
    assert proto.payments.HasField('balance_pln')
    assert proto.payments.HasField('free_balance_pln')
    assert proto.payments.HasField('total_deposited_pln')
    assert proto.payments.HasField('total_paid_pln')     
    assert proto.payments.HasField('total_blocked_pln')  
    self._proto = proto

  def __str__(self):
    return 'player facebook_id=%s' % self.facebook_id

  @property
  def proto(self):
    return self._proto

  @property
  def facebook_id(self):
    return self._proto.facebook_id

  @property
  def notify_if_new_game(self):
    return self._proto.notify_if_new_game

  def Update(self, request):
    if request.HasField('email'):
      if request.email:
        self._proto.email = request.email
      else:
        self._proto.ClearField('email')

    if request.HasField('notify_if_new_game'):
      if request.notify_if_new_game and self.has_email or (
          not request.notify_if_new_game):
        self._proto.notify_if_new_game = request.notify_if_new_game

    if request.HasField('iban'):
      if request.iban:
        self._proto.iban = request.iban
      else:
        self._proto.ClearField('iban')

  @property
  def has_email(self):
    return self._proto.HasField('email')

  @property
  def email(self):
    assert self._proto.HasField('email')
    return self._proto.email

  def UpdateLastTouch(self):
    time_util.DateTimeToTimestampProto(time_util.now(), self._proto.last_touch)

  def AddTransaction(self, request, game):
    if request.type == vbreg_pb2.Transaction.DEPOSIT:
      return self.Deposit(request.amount_pln, request.deposit_source)
    else:
      raise NotImplementedError

  def Deposit(self, amount_pln, deposit_source):
    self._proto.payments.balance_pln += amount_pln
    self._proto.payments.free_balance_pln += amount_pln
    self._proto.payments.total_deposited_pln += amount_pln
    self._proto.payments.transaction.add(
      timestamp=time_util.DateTimeToTimestampProto(time_util.now()),
      type=vbreg_pb2.Transaction.DEPOSIT,
      amount_pln=amount_pln,
      deposit_source=deposit_source)

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

  def SendEmail_NewGame(self, game):
    subject = 'Game on %s is open for sign up' % (
      _FormatDate(game.GetStartTime()))
    content = 'Details and sign up: ' + game.GetUrlHTML()
    email.SendEmailAsync(self.email, subject, content, 'text/html')

  def SendEmail_AutoSignedUp(self, game):
    subject = 'You have been signed up for the game on %s' % (
      _FormatDate(game.GetStartTime()))
    content = 'Details: ' + game.GetUrlHTML()
    email.SendEmailAsync(self.email, subject, content)

  def SendEmail_PlaceFree(self, game):
    subject = 'The game on %s has a free place' % (
      _FormatDate(game.GetStartTime()))
    content = 'Details and sign up: ' + game.GetUrlHTML()
    email.SendEmailAsync(self.email, subject, content)

  @classmethod
  def _GenerateBankTransferId(cls, name, games):
    acronyms = [s[0] for s in name.split()]
    if all(_IsAsciiLetter(acronym) for acronym in acronyms):
      acronyms = ''.join(acronyms)
    else:
      acronyms = ''
    player_acronyms_last_seq_num = (
      games._games_data.player_acronyms_last_seq_num)
    if acronyms not in player_acronyms_last_seq_num:
      player_acronyms_last_seq_num[acronyms] = 0
    player_acronyms_last_seq_num[acronyms] += 1
    return '%s%d' % (acronyms, player_acronyms_last_seq_num[acronyms])


def _IsAsciiLetter(c):
  return ord('A') <= ord(c) <= ord('Z') or ord('a') <= ord(c) <= ord('z')


class _Game(object):

  @classmethod
  def FromObservableProto(cls, proto, players):
    signed_up_players = [players[pr.facebook_id] for pr in proto.signed_up]
    waiting_players = [players[pr.facebook_id] for pr in proto.waiting]
    players_to_notify_if_place_free = [
      players[pr.facebook_id] for pr in proto.to_notify_if_place_free]
    return cls(proto, signed_up_players, waiting_players,
               players_to_notify_if_place_free)

  @classmethod
  def FromRequest(cls, request, games):
    if (not request.HasField('start_time')
        or not request.HasField('end_time')
        or not request.HasField('location')
        or not request.HasField('price_pln')
        or not request.HasField('max_signed_up')):
      raise UserVisibleException(
        'All of start time, end time, location, price, '
        'number of signed up places are required')
    cls._AssertStartTimeEndTimeValid(request)

    facebook_event_url = (request.facebook_event_url
                          if request.HasField('facebook_event_url') else None)
    proto = vbreg_pb2.Game(
      id=cls._GenerateGameId(games),
      start_time=request.start_time,
      end_time=request.end_time,
      location=request.location,
      facebook_event_url=facebook_event_url,
      price_pln=request.price_pln,
      state=vbreg_pb2.Game.UPCOMING,
      max_signed_up=request.max_signed_up)
    return cls(observable.Create(proto, with_delta=False), [], [], [])

  def __init__(self, proto, signed_up_players, waiting_players,
               players_to_notify_if_place_free):
    assert proto.HasField('start_time')
    assert proto.HasField('end_time')
    assert proto.HasField('location')
    assert proto.HasField('price_pln')
    assert proto.HasField('state')
    assert proto.HasField('max_signed_up')
    self._proto = proto
    self._signed_up_players = signed_up_players
    self._waiting_players = waiting_players
    self._players_to_notify_if_place_free = players_to_notify_if_place_free

  def __str__(self):
    return 'game id=%d' % self.id

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

  @property
  def has_free_place(self):
    return len(self._signed_up_players) < self._proto.max_signed_up

  @property
  def url(self):
    return '%s/games#%s' % (CONFIG.site_url, self.id)

  def GetUrlHTML(self):
    return '<a href="%s">%s</a>' % (self.url, self.url)

  def GetCancelationFee(self):
    num_days_before_game = int(
      max((self.GetStartTime() - time_util.now()).total_seconds(), 0) /
      _NUM_SECONDS_IN_DAY)
    rule = list_util.GetOnlyOneByPredicate(
      CONFIG.cancelation_fee_rule, lambda rule: (
        rule.min_days <= num_days_before_game and
        (not rule.HasField('max_days') or
         num_days_before_game < rule.max_days)))
    return round(rule.fraction * self.price_pln)

  def Update(self, request):
    is_start_time_changed = request.HasField('start_time') and (
      self._proto.start_time != request.start_time)
    is_end_time_changed = request.HasField('end_time') and (
      self._proto.end_time != request.end_time)
    is_location_changed = request.HasField('location') and (
      self._proto.location != request.location)
    is_price_pln_changed = request.HasField('price_pln') and (
      self._proto.price_pln != request.price_pln)

    if is_start_time_changed or is_end_time_changed:
      self._AssertStartTimeEndTimeValid(request, self._proto)

    if self._signed_up_players:
      if (is_start_time_changed or is_end_time_changed
          or is_location_changed or is_price_pln_changed):
        raise UserVisibleException(
          'Can not change any of start time, end time, location, price '
          'because there are signed-up players')
      if request.HasField('max_signed_up') and (
          request.max_signed_up < len(self._signed_up_players)):
        raise UserVisibleException(
          'Can not reduce the number of signed up places '
          'because there are players signed up for these places')
    
    if is_start_time_changed:
      self._proto.start_time.MergeFrom(request.start_time)
    if is_end_time_changed:
      self._proto.end_time.MergeFrom(request.end_time)
    if is_location_changed:
      self._proto.location = request.location
    if request.HasField('facebook_event_url'):
      if request.facebook_event_url:
        self._proto.facebook_event_url = request.facebook_event_url
      else:
        self._proto.ClearField('facebook_event_url')
    if is_price_pln_changed:
      self._proto.price_pln = request.price_pln
    if request.HasField('max_signed_up'):
      had_free_place = self.has_free_place
      self._proto.max_signed_up = request.max_signed_up
      self._HandleFreePlacesIfAny(had_free_place)

  def Cancel(self):
    for player in self._signed_up_players:
      player.Return(self.price_pln, self)
    del self._signed_up_players[:]
    del self._proto.signed_up[:]

    for waiting_player in self._waiting_players:
      waiting_player.Unblock(self.price_pln, self)
    del self._waiting_players[:]
    del self._proto.waiting[:]

    self._proto.state = vbreg_pb2.Game.CANCELED

  def SetPlayerSignedUp(self, player, is_signed_up):
    assert self.is_upcoming
    is_player_signed_up = player in self._signed_up_players
    is_player_waiting = player in self._waiting_players
    has_free_place = self.has_free_place

    if is_signed_up:
      assert not (is_player_signed_up or is_player_waiting)
      if has_free_place:
        self._signed_up_players.append(player)
        self._proto.signed_up.add(facebook_id=player.facebook_id)
        player.Pay(self.price_pln, self)
      else:
        self._waiting_players.append(player)
        self._proto.waiting.add(facebook_id=player.facebook_id)
        player.Block(self.price_pln, self)
      if player in self._players_to_notify_if_place_free:
        self._players_to_notify_if_place_free.remove(player)
        self._PlayerRefListPop(self._proto.to_notify_if_place_free, player)

    else:  # not is_signed_up
      assert is_player_signed_up or is_player_waiting
      if is_player_signed_up:
        self._signed_up_players.remove(player)
        self._PlayerRefListPop(self._proto.signed_up, player)
        player.Return(self.price_pln - self.GetCancelationFee(), self)
        self._HandleFreePlacesIfAny(has_free_place)
      else:  # is_player_waiting
        self._waiting_players.remove(player)
        self._PlayerRefListPop(self._proto.waiting, player)
        player.Unblock(self.price_pln, self)

  def _HandleFreePlacesIfAny(self, had_free_place):
    while self.has_free_place and self._waiting_players:
      self._SignUpNextWaitingPlayer()
    if self.has_free_place and not had_free_place:
      for player_to_notify in self._players_to_notify_if_place_free:
        player_to_notify.SendEmail_PlaceFree(self)      

  def _SignUpNextWaitingPlayer(self):
    waiting_player = self._waiting_players.pop(0)
    waiting_player_ref = self._proto.waiting.pop(0)
    self._signed_up_players.append(waiting_player)
    self._proto.signed_up.add().MergeFrom(waiting_player_ref._message)
    waiting_player.Unblock(self.price_pln, self)
    waiting_player.Pay(self.price_pln, self)
    if waiting_player.has_email:
      waiting_player.SendEmail_AutoSignedUp(self)

  def SetNotifyPlayerIfPlaceFree(self, player, should_notify):
    if should_notify:
      assert player not in self._players_to_notify_if_place_free
      self._players_to_notify_if_place_free.append(player)
      self._proto.to_notify_if_place_free.add(facebook_id=player.facebook_id)
    else:
      assert player in self._players_to_notify_if_place_free
      self._players_to_notify_if_place_free.remove(player)
      self._PlayerRefListPop(self._proto.to_notify_if_place_free, player)

  @classmethod
  def _AssertStartTimeEndTimeValid(cls, request, proto=None):
    start_time = time_util.DateTimeFromTimestampProto(
      request.start_time if request.HasField('start_time')
      else proto.start_time)
    end_time = time_util.DateTimeFromTimestampProto(
      request.end_time if request.HasField('end_time')
      else proto.end_time)
    if start_time < time_util.now():
      raise UserVisibleException('Start time must be in the future')
    if end_time <= start_time:
      raise UserVisibleException('End time must be later than start time')

  @staticmethod
  def _GenerateGameId(games):
    game_id = games._games_data.last_game_id + 1
    games._games_data.last_game_id = game_id
    return game_id

  @staticmethod
  def _PlayerRefListPop(player_ref_list, player):
    for i, player_ref in enumerate(player_ref_list):
      if player_ref.facebook_id == player.facebook_id:
        player_ref_list.pop(i)
        return
    raise ValueError('%s not found' % player)


class UserVisibleException(Exception):

  def __init__(self, user_message):
    Exception.__init__(self, 'UserVisibleException: ' + user_message)
    self.user_message = user_message



def _FormatDate(dt):
  # TODO: Locale-specific.
  return time_util.DateTimeToFormatStr(dt, '%d.%m.%Y')


_NUM_SECONDS_IN_DAY = 60 * 60 * 24


observable.GenerateObservableClass(vbreg_pb2.GamesData, None)

