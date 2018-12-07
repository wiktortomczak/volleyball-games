class GamePage extends React.Component {

  constructor(props, context) {
    super(props, context);
    this._game = context.model._getGame(props.match.params.gameId);
    this._model = context.model;
  }

  render() {
    let playerId = 0;
    const players = (
      this._game.signedUpPlayers.map(player => (
        this._renderSignedUpPlayer(player, ++playerId)))
      + this._game.waitingList.map(player => (
        this._renderWaitingListPlayer(player, ++playerId))));
    while (playerId < this._game.maxSignedUp) {
      players.push(this._renderMissingPlayer(playerId));
    }
    return (
      <div>
        {players}
      </div>
    );
  }

  _renderSignedUpPlayer(player, playerId) {
    return (
      <div>
        #{playerId} <a href="">{player.name}</a>
      </div>
    );
  }

  _renderWaitingListPlayer(player, playerId) {
    return (
      <div>
        #{playerId} <a href="">{player.name}</a> (waiting list)
      </div>
    );
  }

  _renderMissingPlayer(playerId) {
    return (
      <div>
        #{playerId}
      </div>
    );
  }
}

GamePage.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};
