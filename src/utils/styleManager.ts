import jss, { SheetsManager } from "jss";

class SheetManager {
  manager: SheetsManager;
  key: object;
  constructor() {
    this.manager = new SheetsManager();
    this.key = {};
  }

  apply(sheet, key) {}
}
/*
manager.add(key, sheet); // index
console.log(manager.size); // 1
manager.get(key); // sheet

// Will attach the sheet and count refs.
manager.manage(key); // sheet
// Will detach the sheet if refs count is 0.
manager.unmanage(key);
*/
