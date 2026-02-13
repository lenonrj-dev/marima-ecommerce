"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toIso = toIso;
exports.startOfDay = startOfDay;
exports.endOfDay = endOfDay;
exports.daysAgo = daysAgo;
function toIso(value) {
    return new Date(value).toISOString();
}
function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}
function daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
}
