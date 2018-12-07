
import Model from 'model';
import View from 'view';


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
