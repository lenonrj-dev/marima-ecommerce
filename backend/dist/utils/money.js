"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCents = toCents;
exports.fromCents = fromCents;
exports.ensureCents = ensureCents;
function toCents(value) {
    return Math.round(value * 100);
}
function fromCents(value) {
    return Number((value / 100).toFixed(2));
}
function ensureCents(value) {
    return Math.max(0, Math.round(value));
}
