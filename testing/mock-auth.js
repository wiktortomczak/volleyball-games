
import {FacebookCredentials} from 'facebook';

/**
 * @implements {Auth}
 */
export default class MockAuth {

  constructor() {
    this._userCredentials = new FacebookCredentials('123', 'John Doe', 'token');
  }

  get userCredentials() {
    return this._userCredentials;
  }

  onChange(callback) {}
}
