// Classes support static members which can be accessed without an
// instance being present.
export class Tripple {
  // Using the 'static' keyword creates a method which is associated
  // with a class, but not with an instance of the class.
  static tripple(n) {
    return (n || 1) * 3;
  }
}

// super.prop in this example is used for accessing super-properties from
// a parent class. This works fine in static methods too:
export class BiggerTripple extends Tripple {
  static tripple(n) {
    return super.tripple(n) * super.tripple(n);
  }
}
