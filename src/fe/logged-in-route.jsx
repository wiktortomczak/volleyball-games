
import PropTypes from 'prop-types';
import React from 'react';
import {Route} from 'react-router-dom';

import Model from 'fe/model';


/**
 * Login-protected {@code Route}. 
 * If logged out, triggers login form and renders {@code loggedOutComponent}.
 */
export default function LoggedInRoute(
  {path, exact, component, loggedOutComponent}, context) {
  return (
    <Route path={path} exact={exact} render={() => {
      if (context.model.auth.userCredentials) {
        return React.createElement(component);
      } else {
        // TODO: Show a single login form. This opens two copies of the pop-up.
        context.model.auth.login();
        return React.createElement(loggedOutComponent);
      }
    }} />
  );
}

LoggedInRoute.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired
};
