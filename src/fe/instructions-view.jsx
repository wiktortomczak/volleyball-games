
import PropTypes from 'prop-types';
import React from 'react';
import {Link} from 'react-router-dom';
import {HashLink} from 'third_party/react-router-hash-link@1.2.1/index.js';

import CancelationFees from 'fe/cancelation-fees';
import Model from 'fe/model';


/**
 * Renders website (app) instructions for the user.
 *
 * Instructions view of the Volleyball Games JS web app. 
 */
export default class InstructionsSection extends React.Component {

  _getUser() {
    return this.context.model.getUser();
  }

  render() {
    const user = this._getUser();
    return (
      <section id="instructions" className="text">
        <h2>Instructions</h2>

        <h3>Games</h3>

        <h4>Sign-up</h4>
        <p>
In order to play in a game, you need to sign up for game first. You can sign up
for any <Link to="/games">upcoming games</Link>. Click on the{' '}
<input type="button" value="Sign up" readOnly /> button next to the game and confirm.
        </p>
        <p>
Please keep in mind that this is binding: by signing up you declare to
participate in the game and you pay. You can still{' '}
<HashLink to="#cancelation">cancel</HashLink> if you need to.
        </p>

        <h5>No free places</h5>
        <p>
If there are no places left for a game, you can still try to join the game
in two ways, hoping that a place becomes free:
        </p>
        <ol>
          <li>
You can sign up for the waiting list and be automatically signed up for the game.
Click on the <input type="button" value="Sign up" readOnly /> button next to the game
with no free places and confirm. You are automatically signed up for the game if
a place becomes free and you are first on the waiting list. The list is ordered by
sign-up time.
            <p>
This is binding. The moment you are automatically signed up, it is just like
regular sign-up. You declare to participate in the game and you pay. You can
still <HashLink to="#cancelation">cancel</HashLink> if you need to.
            </p>
            <p>
While on the waiting list and not signed up for the game yet, you can cancel
freely. Also, you do not pay yet; instead, money is blocked in your account.
            </p>
          </li>
          <li>
You can be notified by email when a place becomes free. Check the
<span className="sans_serif" style={{display: 'inline-block'}}>
<input type="checkbox" readOnly /> Email me</span> checkbox next the the game
with no free places.
            <p>
This is not binding. However, please be aware that you might miss the place.
For one, the waiting list takes precedence. You are only notified if the list
is empty. Also, another notified player might sign up for the place before you.
            </p>
          </li>
        </ol>

        <h4 id="cancelation">Cancelation</h4>
        <p>
If you need to cancel, the amount you paid for the game is returned to your{' '}
<HashLink to="#payments">account</HashLink>. However, a cancelation fee might
be deducted, depending on how many days before the game you cancel:
        </p>
        <p>
          <CancelationFees />
        </p>
        
        <h4>No-show</h4>
        <p>
If you do not come to the game you signed up for, it is considered a last-minute
cancelation.
        </p>
        
        <h4>New games</h4>
        <p>
New games are added to <Link to="/games">upcoming games</Link> by Boris.

You can be notified by email. Check the appropriate checkbox in{' '}
<Link to="/profile">your profile settings</Link>.
        </p>

        <h4>Canceled games</h4>
        <p>
TODO
        </p>

        <h3 id="payments">Payments</h3>
        <p>
Payments are integrated in your profile and are automated. Part of your profile
is your dedicated payments account, that is, money that you deposit in the account
and that is automatically managed to pay for your games.
        </p>
        <p>
You need to periodically <HashLink to="#deposits">deposit money</HashLink> in your account.
The rest is taken care of for you.
        </p>
        <p>
You can find your current balance and a full record of transactions in your account
in <Link to="/profile">your profile</Link>.
        </p>

        <h4>Transactions</h4>
        <p>
A transaction can be any of the following:
        </p>
        <table id="transactions">
          <tr>
            <th>DEPOSIT</th>
            <td>
When you <HashLink to="#deposits">deposit money</HashLink>, the money is added to
your account.
            </td>
          </tr>
          <tr>
            <th>PAY</th>
            <td>
When you sign up for a game, you pay. The game's price (participation cost) is taken
from your account.
            </td>
          </tr>
          <tr>
            <th>RETURN</th>
            <td>
When you cancel a game, the game's price is returned to your account.
A <HashLink to="#cancelation">cancelation fee</HashLink>{' '} might be deducted.
            </td>
          </tr>
          <tr>
            <th>BLOCK</th>
            <td>
When you sign up for a game's waiting list, the game's price is blocked in your
account, to cover the eventual <span className="definition">PAYMENT</span>.
            </td>
          </tr>
          <tr>
            <th>UNBLOCK</th>
            <td>
              TODO
            </td>
          </tr>
          <tr>
            <th>WITHDRAW</th>
            <td>
When you withdraw money, the money is removed from your account and sent back to
a bank account that you specify in <Link to="/profile">your profile settings</Link>.
            </td>
          </tr>
        </table>
        
        <h4>Negative balance</h4>
        <p>
You can sign up for a game and pay even if you do not have enough money (enough
positive balance) in your account. The game's price is still deducted from your
account as well as any cancelation fee. This creates a debt (negative balance)
in your account that you should cover as soon as possible, by depositing money.
        </p>

        <h4 id="deposits">Deposits</h4>
        <p>
          To deposit money in your account, make a bank transfer to:
          <ul>
            <li>beneficiary: Boris Anisimov</li>
            <li>bank account (IBAN): 82 1160 2202 0000 0003 3172 8367</li>
            <li>title: volleyball {user.bankTransferId}</li>
          </ul>
        </p>
        <p>
<span className="important">Note:</span>{' '}
Please make sure that the title of your bank transfer starts exactly with these
two words: "volleyball {user.bankTransferId}".
        </p>
        <p>
The transferred amount is added to your account:
          <ul>
            <li>at most 1h after it was received in Boris' bank account,
                if the transfer title is correct</li>
            <li>after Boris' manual fix-up, if the transfer title is incorrect</li>
          </ul>
        </p>

        <h4>Withdrawals</h4>
        <p>
You can withdraw some or all money from your account to your bank account at
any time. In <Link to="/profile">your profile</Link>, click on the{' '}
<input type="button" value="Withdraw money" readOnly /> button. You need to
specify your bank account number (IBAN) first. The money is sent via a bank
transfer.
        </p>
      </section>
    );
  }
}

InstructionsSection.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};
