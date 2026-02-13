"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
function validate(schema) {
    return (req, _res, next) => {
        try {
            if (schema.body)
                req.body = schema.body.parse(req.body);
            if (schema.query)
                req.query = schema.query.parse(req.query);
            if (schema.params)
                req.params = schema.params.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                next(new Error(error.issues.map((issue) => issue.message).join("; ")));
                return;
            }
            next(error);
        }
    };
}
