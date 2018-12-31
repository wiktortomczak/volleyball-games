/* global goog */
import 'goog:goog.Uri';


/**
 * @public {!Object} Frontend configuration.
 */
export default {
  // Volleyball games web app URI. TODO: Configure statically?
  uri: _getLocationSchemeHostPort(),
  // 'Volleyball in Warsaw' Facebook app ID, for accessing Facebook APIs.
  // Specifically, for authenticating users via Facebook login.
  facebookAppId: '378751972670124'
}


/**
 * @return {!string} Browser's current location (scheme, host, port).
 */
function _getLocationSchemeHostPort() {
  const uri = goog.Uri.parse(window.location.href);
  return (
    (uri.hasScheme() ? (uri.getScheme() + '://') : '')
    + uri.getDomain()
    + (uri.hasPort() ? ':' + uri.getPort() : ''));
}
