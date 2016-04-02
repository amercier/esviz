import Polygon from './lib/geometry/polygon';
import Rectangle from './lib/geometry/rectangle';
import Square from './lib/geometry/square';
import { Tripple, BiggerTripple } from './lib/arithmetic/tripple';
import { log } from './lib/util/console';

// Example 1
// ---------

// Classes are used just like ES5 constructor functions:
const p = new Polygon(300, 400);
p.sayName();
log(`The width of this polygon is ${p.width}`);

// Example 2
// ---------

// Our Polygon class above is an example of a Class declaration.
// ES6 classes also support Class expressions - just another way
// of defining a new class. For example:
const MyPoly = class Poly {
  getPolyName() {
    log(`Hi. I was created with a Class expression. My name is ${Poly.name}`);
  }
};

const inst = new MyPoly();
inst.getPolyName();

// Example 3
// ---------

const s = new Square(5);
s.sayName();
log(`The area of this square is ${s.area}`);

// Example 4
// ---------

const r = new Rectangle(50, 60);
r.sayName();

// Example 5
// ---------

log(Tripple.tripple());
log(Tripple.tripple(6));
log(BiggerTripple.tripple(3));
