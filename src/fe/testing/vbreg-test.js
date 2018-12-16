/* global goog */

import 'goog:goog.asserts';

import App from 'fe/app';
import Model from 'fe/model';
import View from 'fe/view';
import MockAuth from 'fe/testing/mock-auth';
import MockAuthButtonFactory from 'fe/testing/mock-auth-view';
import MockGamesClient from 'fe/testing/mock-games-client';

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