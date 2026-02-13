"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchStoreSettingsHandler = exports.getStoreSettingsHandler = void 0;
const notFound_1 = require("../middlewares/notFound");
const settings_service_1 = require("../services/settings.service");
exports.getStoreSettingsHandler = (0, notFound_1.asyncHandler)(async (_req, res) => {
    const data = await (0, settings_service_1.getStoreSettings)();
    res.json({ data });
});
exports.patchStoreSettingsHandler = (0, notFound_1.asyncHandler)(async (req, res) => {
    const data = await (0, settings_service_1.updateStoreSettings)(req.body);
    res.json({ data });
});
