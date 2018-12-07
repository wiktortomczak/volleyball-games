
export default class MockAuthButtonFactory {

  static createLoginButton(auth) {
    // TODO: Update auth.
    return <div><input type="button" value="Log in" /></div>;
  }

  static createLogoutButton(auth) {
    // TODO: Update auth.
    return <div><input type="button" value="Log out" /></div>;
  }
}
