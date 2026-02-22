"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Types = void 0;
const crypto_1 = require("crypto");
class ObjectIdCompat {
    constructor(value) {
        const normalized = String(value || "").trim();
        this.value = normalized || (0, crypto_1.randomUUID)().replace(/-/g, "");
    }
    toString() {
        return this.value;
    }
    valueOf() {
        return this.value;
    }
    static isValid(value) {
        return String(value || "").trim().length > 0;
    }
}
exports.Types = {
    ObjectId: ObjectIdCompat,
};
