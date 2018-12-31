/* global goog */

import React from 'react';


/**
 * Renders 'Log in with Facebook' and 'Log out' buttons with Facebook styling.
 * Injectable factory of {@code ReactElement}s.
 */
export class FacebookAuthButtonFactory {

  /**
   * @param {!Auth} auth Authentication provider.
   * @param {!Object} props {@code FacebookLoginLogoutButton} component props.
   * @return {!ReactElement}
   */
  static renderLoginButton(auth, props) {
    return <FacebookLoginLogoutButton auth={auth} {...props} />;
  }

  /**
   * @param {!Auth} auth Authentication provider.
   * @param {!Object} props {@code FacebookLoginLogoutButton} component props.
   * @return {!ReactElement}
   */
  static renderLogoutButton(auth, props) {
    return <FacebookLoginLogoutButton auth={auth} {...props} />;
  }
}

/**
 * Either of 'Log in with Facebook' and 'Log out' buttons with Facebook styling.
 */ 
class FacebookLoginLogoutButton extends React.Component {

  constructor(props) {
    super(props);
  }

  get _auth() {
    return this.props.auth;
  }

  get _size() {
    return this.props.size;
  }
  
  render() {
    if (!goog.isDef(this._auth.userCredentials)) {
      return this._size == 'large' ? 'Checking if logged in...' : null;
    } else {
      const action = !this._auth.userCredentials
       ? (this._size == 'large' ? 'Log in with Facebook' : 'Log in' )
       : 'Log out';
      const handleClick = !this._auth.userCredentials
        ? this._auth.login.bind(this._auth)
        : this._auth.logout.bind(this._auth);
      return (
        <button className={'login_fb ' + this._size} onClick={handleClick}>
          {action}
        </button>
      );
    }
  }
}
