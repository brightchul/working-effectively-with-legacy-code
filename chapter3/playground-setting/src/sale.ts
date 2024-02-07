export interface Display {
  showLine(line: string): void;
}

export class Item {
  constructor(
    private _name: string,
    private _price: string,
    private _barcode: string
  ) {
    this._name = _name;
    this._price = _price;
    this._barcode = _barcode;
  }

  name() {
    return this._name;
  }
  price() {
    return this._price;
  }
  barcode() {
    return this._barcode;
  }
}

export type ItemParameter = ConstructorParameters<typeof Item>;

export class Sale {
  private display: Display;
  private itemMap: Map<string, Item>;

  constructor(display: Display, itemList: Item[]) {
    this.display = display;
    this.itemMap = new Map();
    itemList.forEach((item) => this.itemMap.set(item.barcode(), item));
  }

  getItem(barcode: string) {
    return this.itemMap.get(barcode);
  }

  public scan(barcode: string) {
    // ...

    const item = this.getItem(barcode);
    const itemLine = `${item?.name()} ${item?.price()}`;
    this.display.showLine(itemLine);
  }
}

export class ArtR56Display {
  public showLine(line: string) {}
}
