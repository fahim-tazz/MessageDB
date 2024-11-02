"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postgres = void 0;
const pg_1 = require("pg");
exports.postgres = new pg_1.Pool({
    user: "postgres",
    host: "localhost",
    database: "MessageDB",
    password: "admin",
    port: 5432
});
