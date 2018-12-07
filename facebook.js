
import FB from 'fb';
import Observable from 'base/js/observable';


/**
 * @implements {Auth}
 */
export class FacebookAuth extends Observable {

  static create() {
    const auth = new this;
    FB.getLoginStatus(response => (
      auth._setUserCredentialsFromFacebookResponse(response)));
    FB.Event.subscribe('auth.statusChange', response => (
      auth._setUserCredentialsFromFacebookResponse(response)));
    // FB.Event.subscribe('auth.logout', this.onLogout.bind(this));
    return auth;
  }

  constructor() {
    super();
    this._userCredentials = null;
  }

  /** @override */
  get userCredentials() {
    return this._userCredentials;
  }

  _setUserCredentials(userCredentials) {
    if ((!!this._userCredentials != !!userCredentials)
        || (this._userCredentials
            && !this._userCredentials.equals(userCredentials))) {
      this._userCredentials = userCredentials;
      this._notifyChanged();
    }
  }

  _setUserCredentialsFromFacebookResponse(response) {
    console.log('response=' + JSON.stringify(response));

    if (response['status'] == 'connected') {
      FacebookCredentials.fromAuthResponse(response['authResponse']).then(
        userCredentials => this._setUserCredentials(userCredentials));
    } else {
      this._setUserCredentials(null);
    }
  }
}


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
