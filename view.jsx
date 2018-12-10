
import FB from 'fb';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter, NavLink, Redirect, Route, Switch} from 'react-router-dom';

import GamesSection from 'games-view';
import IntroSection from 'intro-view';
import InstructionsSection from 'instructions-view';
import ProfileSection from 'profile-view';
import {FacebookAuthButtonFactory} from 'facebook-view';
import Model from 'model';


export default class View extends React.Component {

  static createAndRender(model, opt_authButtonFactory) {
    const authButtonFactory =
      opt_authButtonFactory || FacebookAuthButtonFactory;
    return ReactDOM.render(
      <View model={model} authButtonFactory={authButtonFactory} />,
      document.getElementById('view'));
  }

  constructor(props) {
    super(props);
    this._model = props.model;
    this._authButtonFactory = props.authButtonFactory;

    this._model.onChange(() => this.forceUpdate());
  }

  getChildContext() {
    return {
      model: this._model
    };
  }

  render() {
    const user = this._model.hasGamesData ? this._model.getUser() : null;
    return (
      // TODO: Remove <div> from inside <BrowserRouter>.
      <BrowserRouter><div>
        <nav>
          <img src="volleyball-100x140.png" width="100" height="140" />
          {this._model.auth.userCredentials && [
            <NavLink to="/" exact activeClassName='active'>
              Intro
            </NavLink>,
            <NavLink to="/instructions" exact activeClassName='active'>
              Instructions
            </NavLink>,
            <NavLink to="/games" exact activeClassName='active'>
              Games
            </NavLink>,
            <NavLink to="/players" exact activeClassName='active'>
              Players
            </NavLink>,
            <NavLink to="/profile" exact activeClassName='active'>
              Profile &<br/>Payments
            </NavLink>,
          ]}
        </nav>
        <main>
          <header>
            {/* TODO: Render the logout button only if logged in. */}
            {this._authButtonFactory.createLogoutButton(this._model.auth)}
            {user && user.isAdmin &&
             <div>
               <input id="admin_mode" type="checkbox"
                      value={this._model.isAdminMode}
                      onChange={() => this._model.setIsAdminMode(!this._model.isAdminMode)} />
               <label htmlFor="admin_mode">Admin mode</label>
             </div>
            }
            {this._model.auth.userCredentials &&
             <div><NavLink to="/profile">
               {this._model.auth.userCredentials.name}
             </NavLink></div>}
            <h2>Volleyball in Warsaw: game registration</h2>
          </header>
          {this._renderSection()}
        </main>
        <footer>
Contact:
          <span>
            <img src="volleyball-20x20.png" width="20" height="20" />{' '}
            volleyball: Boris <a href="#">messenger</a> | <a href="#">email</a>
          </span>
          <span>
            <img src="coding-40x20.gif" width="40" height="20" />{' '}
            website: Wiktor <a href="#">messenger</a> | <a href="#">email</a>
          </span>
          <div id="version">v. 0.1</div>
        </footer>
      </div></BrowserRouter>
    );
  }

  _renderSection() {
    if (!this._model.auth.userCredentials) {
      return (
        <section id="login">
          {this._authButtonFactory.createLoginButton(this._model.auth)}
        </section>
      );
    } else if (!this._model.hasGamesData) {
      return (
        <section id="status">Loading data...</section>
      );
    } else {
      return (
        <Switch>
           <Route exact path='/' component={IntroSection} />
           <Route exact path='/instructions' component={InstructionsSection} />
           <Route exact path='/games' component={GamesSection} />
           <Route exact path='/players' component={PlayersSection} />
           <Route exact path='/profile' component={ProfileSection} />
           <Route><Redirect to='/' /></Route>
         </Switch>
      );
    }
  }
}

View.childContextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};

function PlayersSection() { return ''; }
