import InstrumentCalculator from "./instrument-calculator";

describe("testFirstMoment", () => {
  it("test1", () => {
    const calculator = new InstrumentCalculator();
    expect(() => calculator.firstMomentAbout(2.0)).toThrow("no elements");

    calculator.addElement(1.0);
    calculator.addElement(2.0);

    expect(calculator.firstMomentAbout(2.0)).toEqual(-0.5);
  });
});

describe("testSecondMoment", () => {
  it("no elements throw error test", () => {
    const calculator = new InstrumentCalculator();
    expect(() => calculator.secondMomentAbout(2.0)).toThrow("no elements");
  });
  it("two elements test ", () => {
    const calculator = new InstrumentCalculator();

    calculator.addElement(1.0);
    calculator.addElement(2.0);

    expect(calculator.secondMomentAbout(2.0)).toEqual(0.5);
  });
});
