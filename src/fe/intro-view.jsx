/* global goog */

import PropTypes from 'prop-types';
import React from 'react';

import Model from 'fe/model';


/**
 * Renders intro (landing) page.
 *
 * Intro view of the Volleyball Games JS web app. 
 */
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
            <img src="facebook-20x20.png" width="20" height="20" />
            Volleyball in Warsaw<br/>
          </a> Check it out for latest news.
        </p>
        <p>
          {this._auth.userCredentials
             ? this.context.authButtonFactory.renderLogoutButton(
                 this._auth, {size: 'large'})
             : goog.isDef(this._auth.userCredentials)
               ? this.context.authButtonFactory.renderLoginButton(
                   this._auth, {size: 'large'})
               : 'Checking if logged in...'}
        </p>
        <p>
          <span className="important">Note:</span> This is work in progress.
        </p>
        <p>
          Not all web browsers are supported:
          <ul>
            <li>Desktop: use Chrome 63+ or Firefox 52+</li>
            <li>Mobile: &nbsp;use Chrome 50+ or TODO</li>
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
