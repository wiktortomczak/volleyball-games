
import React from 'react';

export class FacebookAuthButtonFactory {

  static createLoginButton(auth) {
    return <FacebookLoginLogoutButton size={'large'} />;
  }

  static createLogoutButton(auth) {
    return <FacebookLoginLogoutButton size={'small'} />;
  }
}

class FacebookLoginLogoutButton extends React.Component {

  constructor(props) {
    super(props);
    this._size = props.size;
  }

  render() {
    return (
      <div className="fb-login-button"
        data-max-rows="1"
        data-size={this._size}
        data-button-type="login_with"
        data-show-faces="false"
        data-auto-logout-link="true"
        data-use-continue-as="false">
      </div>
    );
  }
}
