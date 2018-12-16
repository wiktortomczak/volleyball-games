
import FB from 'fb';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter, NavLink, Redirect, Route, Switch, withRouter} from 'react-router-dom';

import Arrays from 'base/js/arrays';

import config from 'config';
import GamesSection from 'fe/games-view';
import {FacebookAuthButtonFactory} from 'fe/facebook-view';
import InstructionsSection from 'fe/instructions-view';
import IntroSection from 'fe/intro-view';
import Model from 'fe/model';
import PlayersSection from 'fe/players-view';
import ProfileSection from 'fe/profile-view';


class _View extends React.Component {

  static createAndRender(model, opt_authButtonFactory) {
    const authButtonFactory =
      opt_authButtonFactory || FacebookAuthButtonFactory;
    return ReactDOM.render(
      <BrowserRouter>
        <View model={model} authButtonFactory={authButtonFactory} />
      </BrowserRouter>,
      document.getElementById('view'));
  }

  constructor(props) {
    super(props);
    this.state = {
      modals: [],
      hasUserCredentials: !!this._model.auth.userCredentials
    };
  }

  get _model() {
    return this.props.model;
  }

  get _authButtonFactory() {
    return this.props.authButtonFactory;
  }

  _createAndShowModal(modalComponentClass, props) {
    props.ref = function(modalComponent) {
      if (modalComponent) {
        modalComponent.element = modalElement;
      }
    };
    const modalElement = React.createElement(modalComponentClass, props);
    this.setState(state => (
      {modals: state.modals.concat(modalElement)}));
  }                                        
            
  _closeModal(modalElement) {
    this.setState(state => (
      {modals: Arrays.remove(state.modals, modalElement)}));
  }

  componentWillUpdate(nextProps) {
    nextProps.model.notifications.forEach(notification => {
      if (notification.type == 'success') {
        // TODO: Remove duplicate timeouts for the same notification.
        window.setTimeout(() => (
          this._model.removeNotification(notification)), 2000);
      }
    });
  }

  componentDidMount() {
    // TODO: Remove the onChange callback in componentWillUnmount.
    this._model.onChange(() => {
      const nextHasUserCredentials = !!this._model.auth.userCredentials;
      if (this.state.hasUserCredentials != nextHasUserCredentials) {
        this.setState(state => ({hasUserCredentials: nextHasUserCredentials}));
        if (nextHasUserCredentials) {
          this.props.history.push('/games');
        }
      } else {
        this.forceUpdate();
      }
    });
  }

  render() {
    return [
      this._renderNav(),
      this._renderHeader(),
      this._renderSection(),
      this._renderFooter(),
      this._renderNotifications(),
      this._renderModals()
    ];
  }

  _renderNav() {
    return [
      <button id="show_nav"></button>,
      <nav>
        <NavLink to="/" exact activeClassName='active'>
          Intro
        </NavLink>
        <hr />
        {this._model.auth.userCredentials ? [
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
          this._authButtonFactory.renderLogoutButton(
            this._model.auth, {size: 'small'}),
        ] : this._authButtonFactory.renderLoginButton(
              this._model.auth, {size: 'small'})}
        <hr />
        <a href="/privacy">Privacy policy</a>
        {this._renderAdminModeCheckbox()}
      </nav>
    ];
  }

  _renderHeader() {
    return (
      <header>
        <div id="volleyball" />
        {this._model.auth.userCredentials &&
         this._authButtonFactory.renderLogoutButton(
           this._model.auth, {size: 'small'})}
        {this._renderAdminModeCheckbox()}
        {this._model.auth.userCredentials &&
         <div id="user_name"><NavLink to="/profile">
           {this._model.auth.userCredentials.name}
         </NavLink></div>}
        <h2>Volleyball in Warsaw<span>: game registration</span>
          <a href="https://facebook.com/groups/307483076649700/">
            <img src="facebook-20x20.png" width="20" heigth="20" />
          </a>
        </h2>
      </header>
    );
  }

  _renderAdminModeCheckbox() {
    const user = this._model.hasGamesData ? this._model.getUser() : null;
     return user && user.isAdmin
       ? <div>
           <input id="admin_mode" type="checkbox"
                  value={this._model.isAdminMode}
                  onChange={() => this._model.setIsAdminMode(!this._model.isAdminMode)} />
           <label htmlFor="admin_mode">Admin mode</label>
         </div>
       : null;
  }

  _renderSection() {
    return (
      <Switch>
         <Route exact path='/' component={IntroSection} />
         {this._model.auth.userCredentials && [
            <Route exact path='/instructions' component={InstructionsSection} />,
            <Route exact path='/games' component={GamesSection} />,
            <Route exact path='/players' component={PlayersSection} />,
            <Route exact path='/profile' component={ProfileSection} />,
            this._model.isAdminMode &&
            <Route path='/profile/:id' render={({match}) => (
              <ProfileSection player={this._model.players.get(match.params.id)} />
            )} />
         ]}
         <Route><Redirect to='/' /></Route>
       </Switch>
    );
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
        <span id="version">{config.getVersion()}</span>
      </footer>
    );
  }
  
  _renderNotifications() {
    return this._model.notifications.map((notification, i) => {
      const width = notification.type == 'warning' ? 23 : 20;
      return (
        <dialog open className={
            `notification ${notification.type}
             ${notification.isSticky ? 'sticky' : ''}`}
                style={{top: (20 + i * 60) + 'px'}}>
          <img className="icon" src={`${notification.type}-${width}x20.png`}
               width={width} height="20" />
          <span>{notification.text}</span>
          <img className="close" src="close-6x6.png"
               width="6" height="6"
               onClick={() => this._model.removeNotification(notification)} />
        </dialog>
      );
    });
  }

  _renderModals() {
    return this.state.modals;
  }

  getChildContext() {
    return {
      model: this._model,
      authButtonFactory: this._authButtonFactory,
      createAndShowModal: this._createAndShowModal.bind(this),
      closeModal: this._closeModal.bind(this)
    };
  }
}

_View.childContextTypes = {
  model: PropTypes.instanceOf(Model).isRequired,
  authButtonFactory: PropTypes.instanceOf(Object).isRequired,
  createAndShowModal: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired
};

const View = withRouter(_View);

export default View;