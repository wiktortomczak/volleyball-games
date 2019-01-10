// Rendering of a Game entity.

import React from 'react';
import {Link} from 'react-router-dom';

import {dateFormat} from 'fe/formatting';


/**
 * Short game description, a text item.
 */
export class GameDescription extends React.Component {

  get _game() {
    return this.props.game;
  }

  get _type() {
    return this.props.type;
  }

  render() {
    const linkOrTextFunc = this['_' + this._type].bind(this);
    return !this._game.isCanceled
      ? linkOrTextFunc(
        `the game on ${dateFormat.format(this._game.getStartTime())}`)
      : `the canceled game on ${dateFormat.format(this._game.getStartTime())}`;
  }

  _link(text) {
    return <Link to={`/games#${this._game.id}`}>{text}</Link>;
  }

  _text(text) {
    return text;
  }
}
