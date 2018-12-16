/* global goog */
import 'goog:goog.Uri';


export default {
  uri: _getLocationSchemeHostPort(),
  facebookAppId: '378751972670124'
}


function _getLocationSchemeHostPort() {
  const uri = goog.Uri.parse(window.location.href);
  return (
    (uri.hasScheme() ? (uri.getScheme() + '://') : '')
    + uri.getDomain()
    + (uri.hasPort() ? ':' + uri.getPort() : ''));
}
