
import FB from 'fb';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter, NavLink, Redirect, Route, Switch} from 'react-router-dom';

import GamesSection from 'fe/games-view';
import {FacebookAuthButtonFactory} from 'fe/facebook-view';
import InstructionsSection from 'fe/instructions-view';
import IntroSection from 'fe/intro-view';
import Model from 'fe/model';
import PlayersSection from 'fe/players-view';
import ProfileSection from 'fe/profile-view';


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
    this._model.onChange(() => this.forceUpdate());
    this.state = {notifications: []};
  }

  get _model() {
    return this.props.model;
  }

  get _authButtonFactory() {
    return this.props.authButtonFactory;
  }

  componentWillUpdate(nextProps) {
    nextProps.model.consumeNotifications().forEach(notification => {
      this._addNotification(notification);
      if (notification.type != 'error') {
        window.setTimeout(() => this._removeNotification(notification), 2000);
      }
    });
  }

  _addNotification(notification) {
    this.setState(state => (
      {notifications: state.notifications.concat(notification)}));
  }

  _removeNotification(notification) {
    this.setState(state => (
      {notifications: state.notifications.filter(
        n => !Object.is(n, notification))}));
  }

  render() {
    return (
      // TODO: Remove <div> from inside <BrowserRouter>.
      <BrowserRouter><div>
        {this._renderNav()}
        {this._renderHeader()}
        {this._renderSection()}
        {this._renderFooter()}
        {this._renderNotifications()}
      </div></BrowserRouter>
    );
  }

  _renderNav() {
    return (
      <nav>
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
          <hr />
        ]}
        <a href="/privacy">Privacy policy</a>
      </nav>
    );
  }

  _renderHeader() {
    const user = this._model.hasGamesData ? this._model.getUser() : null;
    return (
      <header>
        <img src="volleyball-100x140.png" width="100" height="140" />
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
        <a href="https://facebook.com/groups/307483076649700/">
          <img src="facebook-20x20.png" width="20" heigth="20" />
        </a>
      </header>
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
           {this._model.isAdminMode  &&
            <Route path='/profile/:id' render={({match}) => (
              <ProfileSection player={this._model.players.get(match.params.id)} />
             )} />
           }
           <Route><Redirect to='/' /></Route>
         </Switch>
      );
    }
  }

  _renderFooter() {
    return (
      <footer>
        <label>Contact:</label>
        <span>
          <img src="volleyball-20x20.png" width="20" height="20" />{' '}
          volleyball: Boris <a href="#">messenger</a> | <a href="#">email</a>
        </span>
        <span>
          <img src="coding-40x20.gif" width="40" height="20" />{' '}
          website: Wiktor{' '}
          <a href="https://www.messenger.com/t/wiktor.tomczak.10">messenger</a>{' | '}
          <a href={'mailto:wiktor.tomczak' + '@gmail.com'}>email</a>
        </span>
        <span id="version">v. 0.2</span>
      </footer>
    );
  }
  
  _renderNotifications() {
    return this.state.notifications.map((notification, i) => (
      <dialog open className={notification.type}
              style={{top: (20 + i * 60) + 'px'}}>
        <img className="icon" src={notification.type + '-20x20.png'}
             width="20" height="20" />
        <span>{notification.text}</span>
        <img className="close" src="close-6x6.png"
             width="6" height="6"
             onClick={() => this._removeNotification(notification)} />
      </dialog>
    ));
  }

  getChildContext() {
    return {
      model: this._model
    };
  }
}

View.childContextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};
