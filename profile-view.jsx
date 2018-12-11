/* global proto */

import 'goog:proto.Transaction.Type';

import PropTypes from 'prop-types';
import React from 'react';

import ProtoEnum from 'base/js/proto/enum';

import CommitableInput from 'commitable-input';
import {GameDescription} from 'game';
import {dateTimeFormat, PLN} from 'formatting';
import Model, {Game} from 'model';


export default class ProfileSection extends React.Component {

  _getPlayer(opt_props, opt_context) {
    const props = opt_props || this.props;
    const context = opt_context || this.context;
    return props.player || context.model.getUser();
  }

  render() {
    const player = this._getPlayer();
    return (
      <section id="profile">
        <h3>{!!this.props.player && this.props.player.name + '\'s '}Profile</h3>
        <CommitableInput
           type="email" label="E-mail" size="40"
           value={(props, context) => this._getPlayer(props, context).email}
           onCommit={email => this._getPlayer().update({email})} />
        <p>
          <input id="notify_if_new_game" type="checkbox"
                 disabled={!player.hasEmail} checked={player.notifyIfNewGame}
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
        <ul>
          <li>Balance:{' '}
            <span>{PLN.format(player.balancePln)}</span><br/>
            (Free: <span>{PLN.format(player.freeBalancePln)}</span>)
          </li>
          <li>Total deposited:{' '}
            <span>{PLN.format(player.totalDepositedPln)}</span>
          </li>
          <li>Total paid:{' '}
            <span>{PLN.format(player.totalPaidPln)}</span>
          </li>
          <li>Total blocked:{' '}
            <span>{PLN.format(player.totalBlockedPln)}</span>
          </li>
        </ul>
        <input type="button" value="Withdraw money"
               onClick={this._handleWithdraw.bind(this)} />{' '}
        <CommitableInput
          type="text" label="IBAN" title="Provide 26-digit IBAN"
          size="30" minLength="26" maxLength="26" pattern="[0-9]{26}"
          value={(props, context) => this._getPlayer(props, context).IBAN}
          onCommit={iban => this._getPlayer().update({iban})} />

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
                ? <GameDescription game={transaction.details} type={'item'} />
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
