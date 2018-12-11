
import React from 'react';

import {PLNshort, percentShort} from 'formatting';
import {Game} from 'model';


export default class CancelationFees extends React.Component {

  get _game() {
    return this.props.game;
  }

  render() {
    const cancelationFees = this._game
      ? this._game.getCancelationFees() : Game.cancelationFeeRules;
    const formatAmountFunc = this._game
      ? PLNshort.format.bind(PLNshort)
      : percentShort.format.bind(percentShort);
    return [
      <table className="light smaller">
        <tr>
          <th>Days before the game</th>
          <th>Cancelation fee</th>
          <th>Money returned</th>
        </tr>
        {cancelationFees.map(feeProto => {
          let fee, returned;
          if (this._game) {
            fee = feeProto.getFeePln();
            returned = this._game.pricePln - fee;
          } else {
            fee = feeProto.getFraction();
            returned = 1 - fee;
          }
          return (
            <tr>
              <td>{this._formatDays(feeProto.getMinDays(), feeProto.getMaxDays())}</td>
              <td className="number">{formatAmountFunc(fee)}</td>
              <td className="number">{formatAmountFunc(returned)}</td>
            </tr>
          );
        })}
      </table>,
      !this._game &&
        <p>Fees are rounded to the nearest 1 PLN,
      eg. 3,4 PLN &rarr; 3 PLN, 3,5 PLN &rarr; 4 PLN.
      </p>
    ];
  }

  _formatDays(minDays, opt_maxDays) {
    if (!opt_maxDays) {
      return `${minDays}+ days`;
    } else if (minDays == 0 && opt_maxDays == 1) {
      return 'day of the game';
    } else {
      return `${minDays}-${opt_maxDays} days`;
    }
  }
}
