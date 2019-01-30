// Facebook-related code.

import FB from 'fb';
import Observable from 'base/js/observable';

import feConfig from 'fe/fe-config.js';


/**
 * Authenticates users using Facebook login.
 * @implements {Auth}
 */
export class FacebookAuth extends Observable {

  static create() {
    const auth = new this;

    FB.init({
      appId: feConfig.facebookAppId,
      version: 'v3.2',
      cookie: true,
      oauth: true,
      status: true
    });
    FB.getLoginStatus(response => (
      auth._setUserCredentialsFromFacebookResponse(response)));
    FB.Event.subscribe('auth.authResponseChange', response => (
      auth._setUserCredentialsFromFacebookResponse(response)));

    return auth;
  }

  constructor() {
    super();
    this._userCredentials = undefined;
  }

  /** @override */
  login() {
    FB.login();  // Triggers authResponseChange.
  }

  /** @override */
  logout() {
    // This does not work on localhost: stackoverflow.com/a/46730648/2131969
    FB.logout();  // Triggers authResponseChange.
  }

  /** @override */
  get userCredentials() {
    return this._userCredentials;
  }

  _setUserCredentials(userCredentials) {
    if (!goog.isDef(this._userCredentials)
        || (!!this._userCredentials != !!userCredentials)
        || (this._userCredentials
            && !this._userCredentials.equals(userCredentials))) {
      this._userCredentials = userCredentials;
      this._notifyChanged();
    }
  }

  _setUserCredentialsFromFacebookResponse(response) {
    // TODO: debug log.
    if (response['status'] == 'connected') {
      FacebookCredentials.fromAuthResponse(response['authResponse'])
        .then(userCredentials => this._setUserCredentials(userCredentials))
        .catch((error) => {console.log(error); this._setUserCredentials(null);});
    } else {
      this._setUserCredentials(null);
    }
  }
}


/**
 * Identity of a user logged in via Facebook login.
 * Includes Facebook access token for accessing Facebook on user's behalf.
 */
export class FacebookCredentials {

  static fromAuthResponse(authResponse) {
    const facebookId = authResponse['userID'];
    return FacebookUtil.getUserName(facebookId).then(name => (
      new this(facebookId, name, authResponse['accessToken'])));
  }

  constructor(facebookId, name, accessToken) {
    this.facebookId = facebookId;
    this.name = name;
    this.accessToken = accessToken;
  }

  equals(other) {
    return this.facebookId == other.facebookId
      && this.accessToken == other.accessToken;
  }

  toString() {
    return `facebookId=${this.facebookId} accessToken=${this.accessToken}`;
  }
}


/**
 * Facebook-related helpers.
 */ 
export class FacebookUtil {

  static getUserName(facebookId) {
    return new Promise((resolve, reject) => {
      FB.api('/' + facebookId, {fields: 'name'}, response => {
        if (!('error' in response)) {
          resolve(response['name']);
        } else {
          reject(response['error']);
        }
      });
    });
  }

  static getUserProfilePictureUrl(facebookId) {
    return `https://graph.facebook.com/${facebookId}/picture?type=square`;
  }
}
