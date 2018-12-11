/* global goog */
/* global proto */

import PropTypes from 'prop-types';
import React from 'react';
import {HashLink} from 'third_party/react-router-hash-link@1.2.1/index.js';
import dialogPolyfill from 'dialog-polyfill'

import {Dates} from 'base/js/time';

import CancelationFees from 'fe/cancelation-fees';
import {dateFormat, hourMinuteFormat, PLNshort} from 'fe/formatting';
import {GameDescription} from 'fe/game';
import Model, {Game, GameBuilder} from 'fe/model';
import {PlayerImage} from 'fe/players-view';


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
    // TODO: This should be in getDerivedStateFromProps
    // if it could read next context.
    if (!this._model.isAdminMode && this.state.gameBuilder) {
      this.setState({gameBuilder: null});
    }
    return (
      <section id="games">
        <h3>Upcoming games</h3>
        {this._renderGamesTable(this._model.getUpcomingGames(), 'upcoming')}
        <h3>Past games</h3>
        {this._renderGamesTable(
          this._model.getEndedGames().slice(0).reverse(), 'ended')}
      </section>
    );
  }

  _renderGamesTable(games, upcomingOrEnded) {
    if (this.state.gameBuilder) {
      games = games.map(game => (
        game.id == this.state.gameBuilder.id
        ? this.state.gameBuilder : game));
      if (upcomingOrEnded == 'upcoming' && this.state.gameBuilder.isNewGame) {
        games.push(this.state.gameBuilder);
      }
    }
    return (
      <table>
        <thead>
          <tr>
            <th>Date &amp; Time</th>
            <th>Location</th>
            <th>Facebook event</th>
            <th>Price</th>
            <th className="players">Players</th>
            {upcomingOrEnded == 'upcoming' &&
             <th className="actions">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {games.map(game => (
            game instanceof Game ? this._renderGame(game, upcomingOrEnded) :
            game instanceof GameBuilder ? this._renderGameBuilder(game) :
            _throw(Error('Internal error'))))}
          {upcomingOrEnded == 'upcoming' &&
           this._model.isAdminMode && !this.state.gameBuilder &&
           <tr>
             <td colSpan="5" className="no_border" />
             <td className="no_border">
              <input type="button" value={'Add game'}
                     onClick={() => this._handleAddUpcomingGame()}></input>
             </td>
           </tr>
          }
        </tbody>
      </table>
    );
  }

  _renderGame(game, upcomingOrEnded) {
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
               <PlayerImage player={player} key={player.facebookId} />))}
          </div>
          {game.hasMaxSignedUpPlayers &&
           <div className="waiting_list">
             <span>waiting list ({game.waitingPlayers.length})</span>
             {game.waitingPlayers.map(player => (
               <PlayerImage player={player} key={player.facebookId} />))}
           </div>}
        </td>
        {upcomingOrEnded == 'upcoming' &&
         <td className="actions">{this._renderGameActions(game)}</td>}
      </tr>
    );
  }

  _renderGameBuilder(gameBuilder) {
    const lastGame = this._model.getLastGame() || {
      getStartTime: () => new Date(2000, 0, 0, 12),
      getEndTime: () => new Date(2000, 0, 0, 14)
    };
    return (
      <tr key={gameBuilder.id}>
        <td>
          <input type="text" className="date" defaultValue={gameBuilder.getDateStr()}
                 placeholder={dateFormat.format(Dates.now())}
                 onChange={e => gameBuilder.setDate(e.target.value)} 
                 onBlur={e => {e.target.value = gameBuilder.getDateStr();}} /><br/>
          <input type="text" className="time" defaultValue={gameBuilder.getStartTimeStr()}
                 placeholder={hourMinuteFormat.format(lastGame.getStartTime())}
                 onChange={e => gameBuilder.setStartTime(e.target.value)}
                 onBlur={e => {e.target.value = gameBuilder.getStartTimeStr();}} />{' - '}
          <input type="text" className="time" defaultValue={gameBuilder.getEndTimeStr()}
                 placeholder={hourMinuteFormat.format(lastGame.getEndTime())}
                 onChange={e => gameBuilder.setEndTime(e.target.value)}
                 onBlur={e => {e.target.value = gameBuilder.getEndTimeStr();}} />
        </td>
        <td>
          <input type="text" defaultValue={gameBuilder.location}
                 onChange={e => gameBuilder.setLocation(e.target.value)} />
        </td>
        <td>
          <input type="url" defaultValue={gameBuilder.facebookEventUrl}
                 onChange={e => gameBuilder.setFacebookEventUrl(e.target.value)} />
        </td>
        <td>
          <input type="number" defaultValue={gameBuilder.pricePln}
                 onChange={e => gameBuilder.setPricePln(e.target.value)} /> PLN
        </td>
        <td className="players">
          <div className="playing">
            <span>
              playing{' '}
              ({(gameBuilder.signedUpPlayers || []).length} /{' '}
               <input type="number" size="1"
                      defaultValue={gameBuilder.maxSignedUpPlayers} 
                      onChange={e => gameBuilder.setMaxSignedUpPlayers(e.target.value)} />)
            </span>
          </div>
        </td>
        <td className="actions">
          <input type="button" value="Save changes"
                 onClick={() => gameBuilder.addOrUpdate().then(() => {
                   this.setState({gameBuilder: null});
                   const action = gameBuilder.isNewGame ? 'created' : 'updated';
                   this._model.addSuccess(`You have ${action} the game`);
                 })} />
          <input type="button" value="Discard changes"
                 onClick={() => this.setState({gameBuilder: null})} />
        </td>
      </tr>
    );
  }

  _renderGameActions(game) {
    const user = this._getUser();
    if (!this._model.isAdminMode) {
      if (!game.isPlayerSignedUpOrWaiting(user)) {
        // TODO: Remove code duplication. Abstract modal code.
        const stateKey = `signup-${game.id}`;
        const actions = [
          <input type="button" value="Sign up"
                 onClick={() => this.setState({[stateKey]: true})} />,
          this.state[stateKey] &&
            <SignUpConfirmation game={game} onClose={() => this.setState({[stateKey]: false})} />
        ];
        if (game.hasMaxSignedUpPlayers) {
          actions.push(this._renderNotifyIfPlaceFree(game, user));
        }
        return actions;
      } else {
        // TODO: Remove code duplication. Abstract modal code.
        const stateKey = `cancel-${game.id}`;
        return [
          <input type="button" value="Cancel"
                 onClick={() => this.setState({[stateKey]: true})} />,
          this.state[stateKey] &&
            <CancelConfirmation game={game} onClose={() => this.setState({[stateKey]: false})} />
        ];
      }
    } else {  // isAdminMode
      return [
        <input type="button" value="Edit game"
               onClick={() => this._editGame(game)} />,
        <input type="button" value="Remove game"
               onClick={() => game.cancel().then(() => (
                 this._model.addSuccess('You have removed the game'))) } />
      ];
    }
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

  _handleAddUpcomingGame() {
    this.setState({gameBuilder: new GameBuilder(null, this._model)});
  }

  _editGame(game) {
    this.setState({gameBuilder: new GameBuilder(game)});
  }
}

GamesSection.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};


class SignUpConfirmation extends React.Component {

  get _game() {
    return this.props.game;
  }

  get _onClose() {
    return this.props.onClose;
  }

  get _model() {
    return this.context.model;
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
          You are about to sign up for <GameDescription game={this._game} type={'text'} />.
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
                 (<HashLink to="/instructions#deposits">instructions</HashLink>)
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
        <input type="button" value={action} onClick={() => this._handleSignUp()} />
        <input type="button" value="No" onClick={this._onClose} />
      </dialog>
    );
  }
  
  componentDidMount() {
    const dialog = document.getElementsByTagName('dialog')[0];  // TODO
    dialogPolyfill.registerDialog(dialog);
    dialog.addEventListener('close', this._onClose);
    dialog.addEventListener('cancel', this._onClose);
    dialog.showModal();
  }

  _handleSignUp() {
    this._game.setPlayerSignedUp(this._getUser(), true /* isSignedUp */)
      .then(() => {
        this._onClose();
        this._model.addSuccess('You have signed up for the game');
      });
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

  get _model() {
    return this.context.model;
  }

  render() {
    const isWaitingList = this._game.isPlayerWaiting(this._getUser());
    const fee = !isWaitingList ?  this._game.getCancelationFee() : null;
    return (
      <dialog>
        <h3>Cancelation confirmation</h3>
        <p>
          {!isWaitingList
           ? 'You are about to cancel your participation in'
           : 'You are about to leave the waiting list for'}{' '}
          <GameDescription game={this._game} type='text' />.
        </p>
        {!isWaitingList
         ? [
          <p>
            Out of {PLNshort.format(this._game.pricePln)} you paid for the game:
            <ul>
              <li>{PLNshort.format(this._game.pricePln - fee)}{' '}
                   will be returned your account.</li>
              {!!fee &&
               <li>{PLNshort.format(fee)} cancelation fee will not be returned.</li>}
            </ul>
          </p>,
          <p>
            Reminder: The cancelation fee is:
            <CancelationFees game={this._game} />
          </p>
        ] : <ul>
              <li>{PLNshort.format(this._game.pricePln)} previously blocked in
                  your account will be unblocked.</li>
            </ul>}
        <input type="button" value="Cancel" onClick={() => this._handleCancel()} />
        <input type="button" value="No" onClick={this._onClose} />
      </dialog>
    );
  }
  
  componentDidMount() {
    const dialog = document.getElementsByTagName('dialog')[0];  // TODO
    dialogPolyfill.registerDialog(dialog);
    dialog.addEventListener('close', this._onClose);
    dialog.addEventListener('cancel', this._onClose);
    dialog.showModal();
  }

  _handleCancel() {
    this._game.setPlayerSignedUp(this._getUser(), false /* isSignedUp */)
      .then(() => {
        this._onClose();
        this._model.addSuccess('You have canceled your participation in the game');
      });
  }
}

CancelConfirmation.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};

function _throw(e) {
  throw e;
}
