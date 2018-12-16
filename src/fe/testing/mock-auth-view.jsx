
export default class MockAuthButtonFactory {

  static renderLoginButton(auth) {
    // TODO: Update auth.
    return <div><input type="button" value="Log in" /></div>;
  }

  static renderLogoutButton(auth) {
    // TODO: Update auth.
    return <div><input type="button" value="Log out" /></div>;
  }
}
