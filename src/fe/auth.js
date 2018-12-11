
/* global goog */

/**
 * @interface
 */
class Auth {

  get userCredentials() {
    goog.abstractMethod();
  }

  onChange(callback) {
    goog.abstractMethod();
  }
}
