/* global proto */

import 'goog:proto.Transaction.Type';

import PropTypes from 'prop-types';
import React from 'react';

import ProtoEnum from 'base/js/proto/enum';

import CommitableInput from 'fe/commitable-input';
import {dateTimeFormat, PLN} from 'fe/formatting';
import {GameDescription} from 'fe/game';
import Model, {Game} from 'fe/model';


export default class ProfileSection extends React.Component {

  _getPlayer(opt_props, opt_context) {
    const props = opt_props || this.props;
    const context = opt_context || this.context;
    return props.player || context.model.getUser();
  }

  get _model() {
    return this.context.model;
  }

  render() {
    const player = this._getPlayer();
    return (
      <section id="profile">
        <h3>{!!this.props.player && this.props.player.name + '\'s '}Profile</h3>
        <CommitableInput
           type="email" label="E-mail" size="30"
           value={(props, context) => this._getPlayer(props, context).email}
           onCommit={email => {
             if (email != this._getPlayer().email) {
               this._getPlayer().update({email}).then(() => (
                 this._model.addSuccess(
                   'E-mail has been ' + (email ? 'set' : 'cleared'))));
             }
           }} />
        <p>
          <input id="notify_if_new_game" type="checkbox"
                 disabled={!player.hasEmail}
                 checked={player.hasEmail && player.notifyIfNewGame}
                 onChange={() => player.update({notifyIfNewGame: !player.notifyIfNewGame})}
          />
          <label htmlFor="notify_if_new_game">
            Email me when a new game is open for sign-up
          </label>
        </p>
        <p>
          <input id="notify_if_auto_sign_up" type="checkbox"
                 disabled="disabled" checked={player.hasEmail} />
          <label htmlFor="notify_if_auto_sign_up">
            Email me when I am automatically signed up for a game
          </label>
        </p>
     
        <h3>Payments</h3>
        <table id="payments">
          <tr>
            <th>Balance</th>
            <td className="number">{PLN.format(player.balancePln)}</td>
            <th>Free</th>
            <td className="number">{PLN.format(player.freeBalancePln)}</td>
          </tr>
          <tr>
            <th>Total deposited</th>
            <td className="number">{PLN.format(player.totalDepositedPln)}</td>
          </tr>
          <tr>
            <th>Total paid</th>
            <td className="number">{PLN.format(player.totalPaidPln)}</td>
          </tr>
          <tr>
            <th>Total blocked</th>
            <td className="number">{PLN.format(player.totalBlockedPln)}</td>
          </tr>
        </table>
        <input type="button" value="Withdraw money"
               onClick={this._handleWithdraw.bind(this)} />{' '}
        <CommitableInput
          type="text" label="IBAN" title="Provide 26-digit IBAN"
          size="30" minLength="26" maxLength="26" pattern="[0-9]{26}"
          value={(props, context) => this._getPlayer(props, context).IBAN}
          onCommit={iban => {
            if (iban != this._getPlayer().IBAN) {
              this._getPlayer().update({iban}).then(() => (
                this._model.addSuccess(
                  'IBAN has been ' + (iban ? 'set' : 'cleared'))));
            }
          }} />

        <h4>Transaction history</h4>
        <table>
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Transaction</th>
              <th>Amount</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {player.transactions.slice(0).reverse().map(transaction => {
              const details = (transaction.details instanceof Game)
                ? <GameDescription game={transaction.details} type={'link'} />
                : transaction.details;
              return (
                <tr>
                  <td>{dateTimeFormat.format(transaction.getTimestamp())}</td>
                  <td>{TransactionType.getName(transaction.type)}</td>
                  <td className="number">{PLN.format(transaction.amountPln)}</td>
                  <td>{details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    );
  }

  _handleWithdraw() {
    window.alert('Not implemented');
  }
}

ProfileSection.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};


const TransactionType = new ProtoEnum(proto.Transaction.Type);
