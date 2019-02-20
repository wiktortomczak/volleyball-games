/* global goog */

import Observable from 'base/js/observable';

import {FacebookCredentials} from 'fe/facebook';

/**
 * @implements {Auth}
 */
export default class MockAuth extends Observable {

  constructor() {
    super();
    // TODO: Start with undefined, change to null after a few secs?
    // To simulate delays in checking remote login status.
    this._userCredentials = null;
  }

  /** @override */
  login() {
    this._userCredentials = new FacebookCredentials('123', 'John Doe', 'token');
    this._notifyChanged(this._userCredentials);
  }

  /** @override */
  logout() {
    this._userCredentials = null;
    this._notifyChanged(this._userCredentials);
  }

  /** @override */
  get userCredentials() {
    return this._userCredentials;
  }
}
