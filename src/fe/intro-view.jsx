
import PropTypes from 'prop-types';
import React from 'react';

import Model from 'fe/model';


export default class IntroSection extends React.Component {

  get _auth() {
    return this.context.model.auth;
  }

  render() {
    return (
      <section id="intro" className="text">
        <p>
          Welcome!
        </p>
        <p>
          TODO: Description.
        </p>
        <p>
          <a href="https://facebook.com/groups/307483076649700/">
            <img src="facebook-20x20.png" width="20" heigth="20" />
            Volleyball in Warsaw<br/>
          </a> Check it out for latest news.
        </p>
        <p>
          {this.context.authButtonFactory.renderLoginButton(
             this._auth, {size: 'large'})}
        </p>
        <p>
          <span className="important">Note:</span> This is work in progress.
        </p>
        <p>
          The following does not work yet:
          <ul>
            <li>Email notifications.</li>
            <li>Support for any web browser.
              <ul>
                <li>Desktop: use Chrome 63+ or Firefox 52+</li>
                <li>Mobile: &nbsp;use Chrome 50+ or TODO</li>
              </ul>
            </li>
          </ul>
          If you notice any technical problems, please let Wiktor know.<br/>
          (contact details at the bottom)
        </p>
      </section>
    );
  }
}

IntroSection.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired,
  authButtonFactory: PropTypes.instanceOf(Object).isRequired
};

