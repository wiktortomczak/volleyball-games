
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import dialogPolyfill from 'dialog-polyfill';


/**
 * Renders a modal dialog, a <dialog> element. The <dialog> is rendered *and*
 * shown (via {@code showModal()}) when the component is mounted.
 * 
 * Applies dialog-polyfill for cross-browser compatibility.
 * Base class.
 */
export default class ModalDialog extends React.Component {

  componentDidMount() {
    this._dialog = ReactDOM.findDOMNode(this);
    dialogPolyfill.registerDialog(this._dialog);
    this._dialog.addEventListener('close', this._onClose);
    this._dialog.addEventListener('cancel', this._onClose);
    this._dialog.showModal();
  }

  componentWillUnmount() {
    // TODO: Undo showModal() ?
    delete this._dialog;
  }

  _close() {
    this.context.closeModal(this.element);
  }
}

ModalDialog.contextTypes = {
  closeModal: PropTypes.func.isRequired
};
