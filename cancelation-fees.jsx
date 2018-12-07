
import React from 'react';

import {PLNshort, percentShort} from 'formatting';
import {Game} from 'model';


export default class CancelationFees extends React.Component {

  get _game() {
    return this.props.game;
  }

  render() {
    const cancelationFees = this._game
      ? this._game.getCancelationFees() : Game.cancelationFees;
    const formatAmountFunc = this._game
      ? PLNshort.format.bind(PLNshort)
      : percentShort.format.bind(percentShort);
    const returnedFunc = this._game
      ? fee => this._game.pricePln - fee
      : fee => 1 - fee;
    return (
      <table className="light smaller">
        <tr>
          <th>Days before the game</th>
          <th>Cancelation fee</th>
          <th>Money returned</th>
        </tr>
        {cancelationFees.map(([days, fee]) => {
          return (
            <tr>
              <td>{this._formatDays(days)}</td>
              <td className="number">{formatAmountFunc(fee)}</td>
              <td className="number">{formatAmountFunc(returnedFunc(fee))}</td>
            </tr>
          );
        })}
      </table>
    );
  }

  _formatDays([lowerBound, upperBound]) {
    if (!upperBound) {
      return `${lowerBound}+ days`;
    } else if (lowerBound == 0 && upperBound == 1) {
      return 'day of the game';
    } else {
      return `${lowerBound}-${upperBound} days`;
    }
  }
}
