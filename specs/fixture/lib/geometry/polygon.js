import { log } from '../util/console';

export default class Polygon {
  // ..and an (optional) custom class constructor. If one is
  // not supplied, a default constructor is used instead:
  // constructor() { }
  constructor(height, width) {
    this.name = 'Polygon';
    this.height = height;
    this.width = width;
  }

  // Simple class instance methods using short-hand method
  // declaration
  sayName() {
    log(`Hi, I am a ${this.name}.`);
  }

  sayHistory() {
    log('"Polygon" is derived from the Greek polus (many) and gonia (angle).');
  }

  // We will look at static and subclassed methods shortly
}
