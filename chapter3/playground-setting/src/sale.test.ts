import { Display, Item, ItemParameter, Sale } from "./sale";

class FakeDisplay implements Display {
  private lastLine = "";

  public showLine(line: string) {
    this.lastLine = line;
  }
  public getLastLine() {
    return this.lastLine;
  }
}

const mockItemInfo: ItemParameter[] = [
  ["name1", "$1000", "010101"],
  ["name2", "$2000", "020202"],
];

const mockItemList = mockItemInfo.map((one) => new Item(...one));

describe("Sale Test", () => {
  it("test display an item by fake object", () => {
    const fakeDisplay: FakeDisplay = new FakeDisplay();
    const sale = new Sale(fakeDisplay, mockItemList);

    sale.scan("010101");
    expect(fakeDisplay.getLastLine()).toEqual("name1 $1000");
  });
});
