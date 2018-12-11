/* global goog */

import 'goog:goog.object';
import PropTypes from 'prop-types';
import React from 'react';

import Model from 'fe/model';


export default class CommitableInput extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.state = {value: this.props.value(props, context)};
    this._id = 'commitable_input_' + (++this.constructor._lastId);
  }

  componentWillReceiveProps(nextProps, nextContext)  {
    const value = this.props.value(this.props, this.context);
    const nextValue = this.props.value(nextProps, nextContext);
    if (nextValue != value) {
      this.setState({value: nextValue});
    }    
  }

  render() {
    return (
      <form className="commitable_input"
            onSubmit={e => {this._handleSubmit(); e.preventDefault();}}>
        <label htmlFor={this._id}>{this.props.label}</label>{' '}
        <input id={this._id} value={this.state.value || ''} {...this._getExtraProps()}
               onChange={e => this.setState({value: e.target.value})}
               onBlur={(e) => this._handleBlur(e)} />
      </form>
    );
  }

  _getExtraProps() {
    return goog.object.filter(this.props, (value, key) => (
      !(key in this.constructor._propNames)));
  }

  _handleBlur(e) {
    if (!this._preventHandleBlur) {
      e.target.value = this.props.value(this.props, this.context);
    }
  }

  _handleSubmit() {
    this.props.onCommit(this.state.value);

    this._preventHandleBlur = true;
    try {
      document.getElementById(this._id).blur();
    } finally {
      delete this._preventHandleBlur;
    }
  }
}

CommitableInput.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};

CommitableInput._propNames = {value: true, onCommit: true, label: true};

CommitableInput._lastId = 0;
