
import PropTypes from 'prop-types';

import Model from 'fe/model';


/**
 * Renders 'Log in required' message with login button,
 * as a section to be rendered in place of the login-protected section.
 */
export default function LogInRequiredSection(props, context) {
  const logInButton = context.authButtonFactory.renderLoginButton(
    context.model.auth, {size: 'small'});
  return (
    <section>
      <p>{logInButton} to access this page.</p>
      <p>A login form is already displayed.<br/>
         (you may need to enable pop-up windows)</p>
    </section>
  );
}

LogInRequiredSection.contextTypes = {
  model: PropTypes.instanceOf(Model).isRequired,
  authButtonFactory: PropTypes.instanceOf(Object).isRequired
};

