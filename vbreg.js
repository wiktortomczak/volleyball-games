
import App from 'app';

let app;

window.fbAsyncInit = function() {
  FB.init({
    appId: '378751972670124',
    cookie: true,
    xfbml: true,
    version: 'v3.2'
  });

  app = App.create();
};
