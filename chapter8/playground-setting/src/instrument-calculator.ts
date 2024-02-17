export default class InstrumentCalculator {
  elements: number[];

  constructor() {
    this.elements = [];
  }
  firstMomentAbout(point: number) {
    // if (this.elements.length === 0) {
    //   throw new Error("no elements");
    // }

    // let numerator = 0;
    // this.elements.forEach((element) => (numerator += element - point));

    // return numerator / this.elements.length;
    return this.nthMomentAbout(point, 1.0);
  }

  // secondMomentAbout(point: number) {
  //   if (this.elements.length === 0) {
  //     throw new Error("no elements");
  //   }

  //   let numerator = 0;
  //   this.elements.forEach((element) => (numerator += element - point));
  //   return numerator / this.elements.length;
  // }

  secondMomentAbout(point: number) {
    return this.nthMomentAbout(point, 2.0);
  }

  nthMomentAbout(point: number, n: number) {
    if (this.elements.length === 0) {
      throw new Error("no elements");
    }

    const numerator = this.elements.reduce(
      (numerator, element) => (numerator += Math.pow(element - point, n)),
      0.0
    );

    return numerator / this.elements.length;
  }

  addElement(value: number) {
    this.elements.push(value);
  }
}
