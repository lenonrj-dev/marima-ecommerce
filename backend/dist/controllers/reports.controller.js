"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCustomersCsvHandler = exports.exportProductsCsvHandler = exports.exportSalesCsvHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const reports_service_1 = require("../services/reports.service");
function sendCsv(res, filename, content) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(200).send(content);
}
exports.exportSalesCsvHandler = (0, notFound_1.asyncHandler)(async (_req, res) => {
    const file = await (0, reports_service_1.exportSalesCsv)();
    sendCsv(res, file.filename, file.content);
});
exports.exportProductsCsvHandler = (0, notFound_1.asyncHandler)(async (_req, res) => {
    const file = await (0, reports_service_1.exportProductsCsv)();
    sendCsv(res, file.filename, file.content);
});
exports.exportCustomersCsvHandler = (0, notFound_1.asyncHandler)(async (_req, res) => {
    const file = await (0, reports_service_1.exportCustomersCsv)();
    sendCsv(res, file.filename, file.content);
});
