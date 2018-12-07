/* global proto */

import PropTypes from 'prop-types';
import React from 'react';
import {NavLink} from 'react-router-dom';

import CancelationFees from 'cancelation-fees';
import {dateFormat, hourMinuteFormat, PLNshort} from 'formatting';
import Model from 'model';

export default class GamesSection extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.state = {};
  }

  get _model() {
    return this.context.model;
  }

  _getUser() {
    return this.context.model.getUser();
  }

  render() {
    return (
      <section id="games">
        <h3>Upcoming games</h3>
        {this._renderGamesTable(this._model.getUpcomingGames(), 'upcoming')}
        <h3>Past games</h3>
        {this._renderGamesTable(
          this._model.getPastGames().slice(0).reverse(), 'past')}
      </section>
    );
  }

  _renderGamesTable(games, upcomingOrPast) {
    return (
      <table>
        <thead>
          <tr>
            <th>Date &amp; Time</th>
            <th>Location</th>
            <th>Facebook event</th>
            <th>Price</th>
            <th className="players">Players</th>
            {upcomingOrPast == 'upcoming' &&
             <th className="actions">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {games.map(game => {
            return (
              <tr key={game.id}>
                <td>
                  {dateFormat.format(game.getStartTime())}<br/>
                  {hourMinuteFormat.format(game.getStartTime())}{' - '}
                  {hourMinuteFormat.format(game.getEndTime())}
                </td>
                <td>{game.location}</td>
                <td>{game.hasFacebookEventUrl && 
                     <a href={game.facebookEventUrl}>Facebook event</a>}</td>
                <td>{PLNshort.format(game.pricePln)}</td>
                <td className="players">
                  <div className="playing">
                    <span>
                      playing{' '}
                      ({game.signedUpPlayers.length} / {game.maxSignedUpPlayers})
                    </span>
                    {game.signedUpPlayers.map(player => (
                       <Player player={player} key={player.facebookId} />))}
                  </div>
                  {game.hasMaxSignedUpPlayers &&
                   <div className="waiting_list">
                     <span>waiting list ({game.waitingPlayers.length})</span>
                     {game.waitingPlayers.map(player => (
                       <Player player={player} key={player.facebookId} />))}
                   </div>}
                </td>
                {upcomingOrPast == 'upcoming' &&
                 <td className="actions">{this._renderGameActions(game)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  _renderGameActions(game) {
    let actions;
    const user = this._getUser();
    if (!game.isPlayerSignedUpOrWaiting(user)) {
      // TODO: Remove code duplication. Abstract modal code.
      const stateKey = `signup-${game.id}`;
      actions = [
        <input type="button" value={'Sign up'}
               onClick={() => this.setState({[stateKey]: true})} />,
        this.state[stateKey] &&
          <SignUpConfirmation game={game} onClose={() => this.setState({[stateKey]: false})} />
      ];
      if (game.hasMaxSignedUpPlayers) {
        actions.push(this._renderNotifyIfPlaceFree(game, user));
      }
    } else {
      // TODO: Remove code duplication. Abstract modal code.
      const stateKey = `cancel-${game.id}`;
      actions = [
        <input type="button" value={'Cancel'}
               onClick={() => this.setState({[stateKey]: true})} />,
        this.state[stateKey] &&
          <CancelConfirmation game={game} onClose={() => this.setState({[stateKey]: false})} />
      ];
    }
    return actions;
  }

  _renderNotifyIfPlaceFree(game, user) {
    const id = `notify_if_free-${game.id}`;
    let shouldNotify = game.getNotifyIfPlaceFree(user);
    return (
      <p>
        <input id={id} type="checkbox" checked={shouldNotify} onChange={() => {
          shouldNotify = !shouldNotify;
          if (shouldNotify && !user.hasEmail) {
            window.alert('Set your email address first');
            this.props.history.push('/profile');
          } else {
            game.setNotifyIfPlaceFree(user, shouldNotify);
          }
        }} />
        <label htmlFor={id}>
          Email me if there is a free place
        </label>
      </p>
    );
  }
}

GamesSection.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};


class Player extends React.Component {

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


class SignUpConfirmation extends React.Component {

  get _game() {
    return this.props.game;
  }

  get _onClose() {
    return this.props.onClose;
  }

  _getUser() {
    return this.context.model.getUser();
  }

  render() {
    const user = this._getUser();
    const missingBalancePln =
      Math.max(this._game.pricePln - user.freeBalancePln, 0);
    const isWaitingList = this._game.hasMaxSignedUpPlayers;
    const action = 'Sign up'
      + (isWaitingList ? ' automatically' : '')
      + (missingBalancePln ? '  &  Deposit money now' : '');
    return (
      <dialog>
        <h3>Sign-up confirmation</h3>
        <p>
          You are about to sign up for {this._game.getShortDescription()}.
        </p>
        {!!missingBalancePln &&
         <div className="important">
           <p>
             <span className="important">Note:</span>{' '}
             You do not have enough money in your account.<br/>
             You can still sign up and pay right after.
           </p>
         </div>}
        {isWaitingList &&
         <div className="important">
           <p>
             <span className="important">Note:</span>{' '}
             There are no places left. You are joining the waiting list.<br/>
             You will be signed up <span className="important">automatically</span> if:
             <ul>
               <li>A place is free (a signed-up player cancels), and</li>
               <li>You are first on the waiting list.</li>
             </ul>
           </p>
         </div>}
        <p>
          You agree that{isWaitingList && ', in case you are automatically signed up'}:
          <ul>
            <li>You participate in the game.</li>
            <li>You pay {PLNshort.format(this._game.pricePln)} from your account.<br/>
              <span className="smaller">
               (your free balance:{' '}
                <span className={!missingBalancePln ? 'positive_balance' : 'negative_balance'}>
                  {PLNshort.format(user.freeBalancePln)}
                </span>)
              </span>
            </li>
            {!!missingBalancePln &&
             <li>You deposit the missing {PLNshort.format(missingBalancePln)}{' '}
                 in your account now.<br/>
               <span className="smaller">
                 (<NavLink to="/instructions#deposits">instructions</NavLink>)
               </span>
             </li>}
            <li>In case you need to cancel, a cancelation fee is deducted<br/>
                from the money returned to your account:
               <CancelationFees game={this._game} />
            </li>
          </ul>
        </p>
        {isWaitingList &&
         <p>
           While you are on the waiting list:
           <ul>
             <li>{PLNshort.format(this._game.pricePln)} is blocked in your account.</li>
             <li>You can cancel freely, without a cancelation fee.</li>
           </ul>
         </p>
        } 
        <input type="button" value={action} onClick={() => this._handleSignUp()}/>
        <input type="button" value="No" onClick={this._onClose} />
      </dialog>
    );
  }
  
  componentDidMount() {
    const dialog = document.getElementsByTagName('dialog')[0];  // TODO
    dialog.addEventListener('close', this._onClose);
    dialog.addEventListener('cancel', this._onClose);
    dialog.showModal();
  }

  _handleSignUp() {
    this._game.setPlayerSignedUp(this._getUser(), true /* isSignedUp */)
    .then(this._onClose);
  }
}

SignUpConfirmation.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};


class CancelConfirmation extends React.Component {

  get _game() {
    return this.props.game;
  }

  get _onClose() {
    return this.props.onClose;
  }

  _getUser() {
    return this.context.model.getUser();
  }

  render() {
    const fee = this._game.getCancelationFee();
    return (
      <dialog>
        <h3>Cancelation confirmation</h3>
        <p>
          You are about to cancel your participation in{' '}
          {this._game.getShortDescription()}.
        </p>
        <p>
          Out of {PLNshort.format(this._game.pricePln)} you paid for the game:
          <ul>
            <li>{PLNshort.format(this._game.pricePln - fee)}{' '}
                 will be returned your account.</li>
            {!!fee &&
             <li>{PLNshort.format(fee)} cancelation fee will not be returned.</li>}
          </ul>
        </p>
        <p>
          Reminder: The cancelation fee is:
          <CancelationFees game={this._game} />
        </p>
        <input type="button" value="Cancel" onClick={() => this._handleCancel()}/>
        <input type="button" value="No" onClick={this._onClose} />
      </dialog>
    );
  }
  
  componentDidMount() {
    const dialog = document.getElementsByTagName('dialog')[0];  // TODO
    dialog.addEventListener('close', this._onClose);
    dialog.addEventListener('cancel', this._onClose);
    dialog.showModal();
  }

  _handleCancel() {
    this._game.setPlayerSignedUp(this._getUser(), false /* isSignedUp */)
    .then(this._onClose);
  }
}

CancelConfirmation.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};
