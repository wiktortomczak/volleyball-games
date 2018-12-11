
import App from 'fe/app';

let app;

window.onload = function() {
  FB.init({
    appId: '378751972670124',
    cookie: true,
    xfbml: true,
    version: 'v3.2'
  });

  app = App.create();
};
