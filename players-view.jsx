
import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';

import Iterators from 'base/js/iterators';

import {dateTimeFormat, PLNshort} from 'formatting';
import Model, {Game} from 'model';


export default class PlayerSection extends React.Component {

  get _model() {
    return this.context.model;
  }

  render() {
    return (
      <section id="players">
        <h3>Players</h3>
        <table>
          <tr>
            <th className="player">Player</th>
            {this._model.isAdminMode && [
             <th>Balance</th>,
             <th>Action</th>,
             <th>Last login</th>
            ]}
          </tr>
          {Iterators.map(this._model.players.values(), player => (
            <PlayerRow player={player} key={player.facebookId} />
          ))}
        </table>
      </section>
    );
  }
}

PlayerSection.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};


class PlayerRow extends React.Component {

  constructor(props, context) {
    super(props, context);
    const lastGame = this._model.getLastGame();
    this.state = {
      amountPln: lastGame ? lastGame.pricePln : Game.defaultPricePln,
      source: ''
    };
  }

  get _model() {
    return this.context.model;
  }

  render() {
    const player = this.props.player;
    const isAdminMode = this._model.isAdminMode;
    const lastTouch = player.getLastTouch();
    return (
      <tr>
        <td className="player">
          <PlayerImage player={player} />
        {!isAdminMode
          ? player.name
          : <Link to={'/profile/' + player.facebookId}>{player.name}</Link>}
        </td>
        {isAdminMode && [
         <td className="number">
           <Balance balancePln={player.balancePln} />
         </td>,
         <td>
           <input type="number" value={this.state.amountPln}
                  onChange={e => this.setState({amountPln: e.target.value})} /> PLN{' '}
           <input type="text" value={this.state.source} placeholder="describe source"
                  onChange={e => this.setState({source: e.target.value})} />
           <input type="button" value="Deposit" onClick={() => (
             this.state.amountPln && this.state.source &&
               player.deposit(this.state.amountPln, this.state.source))} />
         </td>,
         <td>
           {lastTouch && dateTimeFormat.format(lastTouch)}
         </td>
        ]}
      </tr>
    );
  }
}

PlayerRow.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};




export class PlayerImage extends React.Component {

  get _player() {
    return this.props.player;
  }

  render() {
    let finalSrc = false;
    return (
      <img src="profile_blank-50x50.jpg" width="50" height="50"
           alt={this._player.name} title={this._player.name}
           onLoad={e => {
             if (!finalSrc) {
               e.target.src = this._player.getProfilePictureUrl();
               finalSrc = true;
             }
           }}
           onError={e => {
             e.target.src = 'profile_blank-50x50.jpg';
           }}
      />
    );
  }
}



export class Balance extends React.Component {

  render() {
    const balancePln = this.props.balancePln;
    return (
      <span className={balancePln >= 0 ? 'positive_balance' : 'negative_balance'}>
        {PLNshort.format(balancePln)}
      </span>
    );
  }
}
