/* global goog */

import 'goog:goog.object';
import PropTypes from 'prop-types';
import React from 'react';


/**
 * Renders an <input> that requires the user to explicitly commit changed value
 * by submitting the enclosing <form>, by pressing enter. Otherwise, the value in
 * the <input> is reset to the underlying data source's value when the <input>
 * is blurred.
 */
export default class CommitableInput extends React.Component {

  constructor(props) {
    super(props);
    // Value displayed in the <input>. Possibly different from the underlying
    // data source's value while uncommitted (while the user is eg. typing in
    // the input and has not submitted the form nor blurred the input).
    this.state = {value: this.props.value(props)};
    // Unique <input> element id.
    this._id = 'commitable_input_' + (++this.constructor._lastId);
  }

  /**
   * Updates {@code state.value} if props change.
   *
   * @override
   */ 
  componentWillReceiveProps(nextProps)  {
    const value = this.props.value(this.props);
    const nextValue = this.props.value(nextProps);
    if (nextValue != value) {
      this.setState({value: nextValue});
    }    
  }

  /**
   * @override
   */
  render() {
    return (
      <form className="commitable_input"
            onSubmit={e => {this._handleSubmit(); e.preventDefault();}}>
        <label htmlFor={this._id}>{this.props.label}</label>{' '}
        <input id={this._id} value={this.state.value || ''}
               onChange={e => this.setState({value: e.target.value})}
               onBlur={(e) => this._handleBlur(e)}
               {...this._getInputAttributes()} />
      </form>
    );
  }

  /**
   * @return {!Object<!string, !string>} Arbitrary key=value attributes to set
   *   in the <input> element.
   */
  _getInputAttributes() {
    return goog.object.filter(this.props, (value, key) => (
      !(key in this.constructor._propNames)));
  }

  /**
   * Resets value in the <input> to data source's value.
   */
  _handleBlur(e) {
    if (!this._preventHandleBlur) {
      // TODO: This should be setState({value: ...}) probably.
      e.target.value = this.props.value(this.props);
    }
  }

  /**
   * Commits the value in the <input> to underlying data source.
   */
  _handleSubmit() {
    this.props.onCommit(this.state.value);

    // Temporarily prevent handleBlur() from triggering to avoid infinite loop.
    this._preventHandleBlur = true;
    try {
      document.getElementById(this._id).blur();
    } finally {
      delete this._preventHandleBlur;
    }
  }
}

// Names of pre-defined CommitableInput properties, to distinguish from extra
// props.
CommitableInput._propNames = {
  value: true,
  onCommit: true,
  label: true};

// For generating unique ._id.
CommitableInput._lastId = 0;
