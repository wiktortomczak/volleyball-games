
import React from 'react';

import {dateFormat} from 'formatting';


export class GameDescription extends React.Component {

  get _game() {
    return this.props.game;
  }

  get _type() {
    return this.props.type;
  }

  render() {
    return (
      ((this._type == 'text') ? 'the ' : '')
      + ((this._game.isCanceled) ? 'canceled ' : '')
      + 'game on ' + dateFormat.format(this._game.getStartTime()));
  }
}
