
export default class MockAuthButtonFactory {

  static renderLoginButton(auth, props) {
    return <button onClick={() => auth.login()}>Log in</button>;
  }

  static renderLogoutButton(auth, props) {
    return <button onClick={() => auth.logout()}>Log out</button>;
  }
}
