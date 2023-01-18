var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { FeatureFlag } from './FeatureFlags';
import Dexie from "dexie";
var AppDatabase = /** @class */ (function (_super) {
    __extends(AppDatabase, _super);
    function AppDatabase() {
        var _this = _super.call(this, "AppDatabase") || this;
        var db = _this;
        //
        // Define tables and indexes
        //
        db.version(1).stores({
            featureFlags: '++id, code, name, enabled'
        });
        // Let's physically map Contact class to contacts table.
        // This will make it possible to call loadEmailsAndPhones()
        // directly on retrieved database objects.
        db.featureFlags.mapToClass(FeatureFlag);
        return _this;
    }
    return AppDatabase;
}(Dexie));
export { AppDatabase };
var db = new AppDatabase();
export { db as default, FeatureFlag };
//# sourceMappingURL=index.js.map