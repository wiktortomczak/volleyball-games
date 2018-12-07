/* global goog */

import 'goog:goog.asserts';

import App from 'app';
import MockAuth from 'testing/mock-auth';
import MockAuthButtonFactory from 'testing/mock-auth-view';
import MockGamesClient from 'testing/mock-games-client';
import Model from 'model';
import View from 'view';

let app;

window.onload = function() {
  const model = new Model(new MockAuth, () => new MockGamesClient); 
  const view = View.createAndRender(model, MockAuthButtonFactory);
  app = new App(model, view);
};

goog.asserts.setErrorHandler(function logExceptionAndStartDebugger(exception) {
  console.log(exception.message);
  console.log(exception.stack);
  debugger;
});
