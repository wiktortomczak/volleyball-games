/* global goog */

// TODO: Clean up, make it less specific to FacebookAuth implementation.
/**
 * Authentication provider. Authenticates the user.
 * @interface
 */
class Auth {

  login() {
    goog.abstractMethod();
  }

  logout() {
    goog.abstractMethod();
  }

  get userCredentials() {
    goog.abstractMethod();
  }

  onChange(callback) {
    goog.abstractMethod();
  }
}
