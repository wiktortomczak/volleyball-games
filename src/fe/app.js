
import Model from 'fe/model';
import View from 'fe/view';


/**
 * Top-level class of Volleyball Games JS web app. Model + view.
 */
export default class App {
  
  static create() {
    const model = Model.create();
    const view = View.createAndRender(model);
    return new this(model, view);
  }

  constructor(model, view) {
    this._model = model;
    this._view = view;
  }
}
