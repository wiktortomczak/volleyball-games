
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
import LoggedInRoute from 'fe/logged-in-route';
import LogInRequiredSection from 'fe/login-required';
import Model from 'fe/model';
import PlayersSection from 'fe/players-view';
import ProfileSection from 'fe/profile-view';


/**
 * View part of Volleyball Games JS web app. The app's user interface,
 * in-browser. Visualizes the model through a number of views (games, players,
 * etc.) as HTML DOM. Implemented with React.
 */
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
    this.state = {modals: []};

    // TODO: Register onChange callbacks in componentDidMount?
    // And deregister in componentWillUnmount?
    this._model.onChange(() => {
      this.forceUpdate();
      // TODO: This should be called on every DOM change.
      // Some DOM changes are done elsewhere (eg. via setState()).
      elementNavigator.notifyDocumentChange();
    });
    // Redirect logged-in user to Games view by default
    // (if browser location not set to other specific view).
    this._model.auth.onChange(() => {
      if (this._model.auth.userCredentials
          && this.props.location.pathname == '/') {
        this.props.history.push('/games');
      }
    });
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

  /**
   * Navigates to element indicated in current url. Globally, for all views.
   * @override
   */
  componentDidMount() {
    // Initial page load.
    elementNavigator.navigateToElement(this.props.location);
    // Every subsequent router location change (<Link> click).
    this.props.history.listen(location => (
      elementNavigator.navigateToElement(location)));
  }

  /**
   * @override
   */
  componentWillUpdate(nextProps) {
    nextProps.model.notifications.forEach(notification => {
      if (notification.type == 'success') {
        // TODO: Remove duplicate timeouts for the same notification.
        window.setTimeout(() => (
          this._model.removeNotification(notification)), 2000);
      }
    });
  }

  /**
   * @override
   */
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
      <img id="show_nav" src="menu-32x32.png" width="32" height="32" tabIndex="0" />,
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
            <img src="facebook-20x20.png" width="20" height="20" />
          </a>
        </h2>
      </header>
    );
  }

  _renderAdminModeCheckbox() {
    // TODO: Render <Loading /> if !hasGamesData.
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
        <LoggedInRoute exact path='/instructions' component={InstructionsSection}
          loggedOutComponent={LogInRequiredSection} />
        <LoggedInRoute exact path='/games' component={GamesSection} 
          loggedOutComponent={LogInRequiredSection} />
        <LoggedInRoute exact path='/players' component={PlayersSection}
          loggedOutComponent={LogInRequiredSection} />
        <LoggedInRoute exact path='/profile' component={ProfileSection}
          loggedOutComponent={LogInRequiredSection} />
        this._model.isAdminMode &&
        <Route path='/profile/:id' render={({match}) => (
          <ProfileSection player={this._model.players.get(match.params.id)} />
        )} />
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
          volleyball: Boris{' '}
          <a href="https://www.messenger.com/t/borisVanisimov">messenger</a>{' | '}
          <a href={'mailto:borisuu' + '@gmail.com'}>email</a>
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


/**
 * Navigates (scrolls) to element given in location. Handles delayed element
 * rendering (if the element is rendered after {@code navigateToElement()}
 * is called).
 *
 * @see github.com/ReactTraining/react-router/issues/394#issuecomment-128148470
 */
const elementNavigator = new (class ElementNavigator {

  constructor() {
    this._elementId = null;  // DOM element to scroll to.
  }

  navigateToElement(location) {
    if (location.hash) {
      this._elementId = location.hash.substr(1);
      this._tryNavigateToElement();
    } else {
      this._elementId = null;
    }
  }

  _tryNavigateToElement() {
    const el = document.getElementById(this._elementId);
    if (el) {
      el.scrollIntoView();
      // Trigger :target selector. TODO: Fix.
      // github.com/ReactTraining/history/issues/503
      window.location.hash = '#' + this._elementId;
      this._elementId = null;
    }
  }

  notifyDocumentChange() {
    if (this._elementId) {
      this._tryNavigateToElement();
    }
  }
});
