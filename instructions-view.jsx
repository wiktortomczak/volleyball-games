
import PropTypes from 'prop-types';
import React from 'react';
import {NavLink} from 'react-router-dom';

import CancelationFees from 'cancelation-fees';
import Model from 'model';


export default class InstructionsSection extends React.Component {

  _getUser() {
    return this.context.model.getUser();
  }

  render() {
    const user = this._getUser();
    return (
      <section id="instructions">        
        <h2>Instructions</h2>

        <h3>Games</h3>

        <h4>Sign-up</h4>
        <p>
In order to play in a game, you need to sign up for game first. You can sign up
for any <NavLink to="/games">upcoming games</NavLink>. Click on the{' '}
<input type="button" value="Sign up" readOnly /> button next to he game and confirm.
        </p>
        <p>
Please keep in mind that this is binding: by signing up you declare to
participate in the game and you pay. You can still{' '}
<NavLink to="#cancelation">cancel</NavLink> if you need to.
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
still <NavLink to="#cancelation">cancel</NavLink> if you need to.
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

        <a name="cancelation" />
        <h4>Cancelation</h4>
        <p>
If you need to cancel, the amount you paid for the game is returned to your{' '}
<NavLink to="#payments">account</NavLink>. However, a cancelation fee might
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
New games are added to <NavLink to="/games">upcoming games</NavLink> by Boris.

You can be notified by email. Check the appropriate checkbox in{' '}
<NavLink to="/profile">your profile settings</NavLink>.
        </p>

        <h4>Canceled games</h4>
        <p>
TODO
        </p>

        <h3>Payments</h3>
        <p>
Payments are integrated in your profile and are automated. Part of your profile
is your dedicated payments account, that is, money that you deposit in the account
and that is automatically managed to pay for your games.
        </p>
        <p>
You need to periodically <NavLink to="#deposits">deposit money</NavLink> in your account.
The rest is taken care of for you.
        </p>
        <p>
You can find your current balance and a full record of transactions in your account
in <NavLink to="/profile">your profile</NavLink>.
        </p>

        <h4>Transactions</h4>
        <p>
A transaction can be any of the following:
        </p>
        <table id="transactions">
          <tr>
            <th>DEPOSIT</th>
            <td>
When you <NavLink to="#deposits">deposit money</NavLink>, the money is added to
your account.
            </td>
          </tr>
          <tr>
            <th>PAYMENT</th>
            <td>
When you sign up for a game, you pay. The game's price (participation cost) is taken
from your account.
            </td>
          </tr>
          <tr>
            <th>RETURN</th>
            <td>
When you cancel a game, the game's price is returned to your account.
            </td>
          </tr>
          <tr>
            <th>CANCELATION FEE</th>
            <td>
When you cancel a game, a <NavLink to="#cancelation">cancelation fee</NavLink>{' '}
might be deducted.
            </td>
          </tr>
          <tr>
            <th>WITHDRAWAL</th>
            <td>
When you withdraw money, the money is removed from your account and sent back to
a bank account that you specify in <NavLink to="/profile">your profile settings</NavLink>.
            </td>
          </tr>
          <tr>
            <th>BLOCKADE</th>
            <td>
When you sign up for a game's waiting list, the game's price is blocked in your
account, to cover the eventual <span className="definition">PAYMENT</span>.
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

        <a name="deposits" />
        <h4>Deposits</h4>
        <p>
          To deposit money in your account, make a bank transfer to:
          <ul>
            <li>beneficiary: Boris Anisimov</li>
            <li>bank account (IBAN): 11 2222 3333 4444 5555 6666 7777</li>
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
      </section>
    );
  }
}

InstructionsSection.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};
