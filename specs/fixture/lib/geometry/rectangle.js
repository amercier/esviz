import { yellow } from 'chalk';
import { log } from '../util/console';
import Polygon from './polygon';

export default class Rectangle extends Polygon {
  constructor(height, width) {
    super(height, width);
    this.name = 'Rectangle';
  }
  // Here, sayName() is a subclassed method which
  // overrides their superclass method of the same name.
  sayName() {
    log(`Sup! My name is ${yellow(this.name)}.`);
    super.sayHistory();
  }
}
