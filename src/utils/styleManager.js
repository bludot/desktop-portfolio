import { SheetsManager } from "jss";
var SheetManager = /** @class */ (function () {
    function SheetManager() {
        this.manager = new SheetsManager();
        this.key = {};
    }
    SheetManager.prototype.apply = function (sheet, key) { };
    return SheetManager;
}());
/*
manager.add(key, sheet); // index
console.log(manager.size); // 1
manager.get(key); // sheet

// Will attach the sheet and count refs.
manager.manage(key); // sheet
// Will detach the sheet if refs count is 0.
manager.unmanage(key);
*/
//# sourceMappingURL=styleManager.js.map