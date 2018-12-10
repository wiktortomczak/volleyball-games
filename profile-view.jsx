/* global proto */

import 'goog:proto.Transaction.Type';

import PropTypes from 'prop-types';
import React from 'react';

import ProtoEnum from 'base/js/proto/enum';

import {GameDescription} from 'game';
import {dateTimeFormat, PLN} from 'formatting';
import Model, {Game} from 'model';


export default class ProfileSection extends React.Component {

  _getUser() {
    return this.context.model.getUser();
  }

  render() {
    const user = this._getUser();
    console.log(`render email=${user.email}`);
    return (
      <section id="profile">
        <h3>Profile</h3>
        <form onSubmit={e => this._handleEmail(e)}>
          <label htmlFor="email">E-mail</label>{' '}
          <input type="email" id="email" value={user.email} onChange={() => {}}
                 size="40"
                 onBlur={e => { e.target.value = user.email; }} />
        </form>
        <p>
          <input id="notify_if_new_game" type="checkbox"
                 disabled={!user.hasEmail} checked={user.notifyIfNewGame}
                 onChange={() => user.update({notifyIfNewGame: !user.notifyIfNewGame})}
          />
          <label htmlFor="notify_if_new_game">
            Email me when a new game is available
          </label>
        </p>
        <p>
          <input id="notify_if_auto_sign_up" type="checkbox"
                 disabled="disabled" checked={user.hasEmail} />
          <label htmlFor="notify_if_auto_sign_up">
            Email me when I am automatically signed up for a game
          </label>
        </p>
     
        <h3>Payments</h3>
        <ul>
          <li>Balance:{' '}
            <span>{PLN.format(user.balancePln)}</span><br/>
            (Free: <span>{PLN.format(user.freeBalancePln)}</span>)
          </li>
          <li>Total deposited:{' '}
            <span>{PLN.format(user.totalDepositedPln)}</span>
          </li>
          <li>Total paid:{' '}
            <span>{PLN.format(user.totalPaidPln)}</span>
          </li>
          <li>Total blocked:{' '}
            <span>{PLN.format(user.totalBlockedPln)}</span>
          </li>
          <li>Total withdrawn:{' '}
            <span>{PLN.format(user.totalWithdrawnPln)}</span>
          </li>
        </ul>
        <form onSubmit={e => this._handleIBAN(e)}>
          <input type="button" value="Withdraw money"
               onClick={this._handleWithdraw.bind(this)} />{' '}
          <label htmlFor="iban">IBAN</label>{' '}
          <input type="text" id="iban" defaultValue={user.IBAN}
                 size="30" minLength="26" maxLength="26" pattern="[0-9]{26}"
                 title="Provide 26-digit IBAN"
                 onBlur={e => { e.target.value = user.IBAN; }} />
        </form>

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
            {user.transactions.slice(0).reverse().map(transaction => {
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

  _handleEmail(event) {
    const emailInput = document.getElementById('email');
    const email = emailInput.value;
    this._getUser().update({email}).then(() => emailInput.blur());
    event.preventDefault();
  }

  _handleIBAN(event) {
    const ibanInput = document.getElementById('iban');
    const iban = ibanInput.value;
    this._getUser().update({iban}).then(() => ibanInput.blur());
    event.preventDefault();
  }
}

ProfileSection.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};


const TransactionType = new ProtoEnum(proto.Transaction.Type);
