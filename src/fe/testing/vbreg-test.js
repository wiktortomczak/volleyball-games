// Frontend-only version of Volleyball Games JS web app.
// For testing frontend code independently from the backend
// (eg. rendering of corner-case backend data) in a simpler setup.
//
// Backends are replaced with mocks:
//   - Volleyball Games -> mock gRPC client (stub)
//   - Facebook auth backend -> MockAuth

/* global goog */

import 'goog:goog.asserts';

import App from 'fe/app';
import Model from 'fe/model';
import View from 'fe/view';
import MockAuth from 'fe/testing/mock-auth';
import MockAuthButtonFactory from 'fe/testing/mock-auth-view';
import MockGamesClient from 'fe/testing/mock-games-client';

/** @define {string} */
var GAMES_BACKEND = 'mock';

let app;

window.onload = function() {
  const model = new Model(
    new MockAuth,
    GAMES_BACKEND == 'mock' ? () => new MockGamesClient : null); 
  const view = View.createAndRender(model, MockAuthButtonFactory);
  app = new App(model, view);
};

goog.asserts.setErrorHandler(function logExceptionAndStartDebugger(exception) {
  console.log(exception.message);
  console.log(exception.stack);
  debugger;
});
