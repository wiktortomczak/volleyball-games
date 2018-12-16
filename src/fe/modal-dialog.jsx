
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import dialogPolyfill from 'dialog-polyfill';


export default class ModalDialog extends React.Component {

  componentDidMount() {
    this._dialog = ReactDOM.findDOMNode(this);
    dialogPolyfill.registerDialog(this._dialog);
    this._dialog.addEventListener('close', this._onClose);
    this._dialog.addEventListener('cancel', this._onClose);
    this._dialog.showModal();
  }

  componentWillUnmount() {
    delete this._dialog;
  }

  _close() {
    this.context.closeModal(this.element);
  }
}

ModalDialog.contextTypes = {
  closeModal: PropTypes.func.isRequired
};
