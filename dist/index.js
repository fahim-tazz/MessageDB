"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./config/db");
const messageController_1 = require("./controllers/messageController");
const postgres_1 = require("./models/postgres");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3007;
(async () => {
    await (0, db_1.connectDB)(postgres_1.postgres);
    const countRows = await postgres_1.postgres.query(`SELECT COUNT(*) FROM contacts`);
    const numExistingRows = parseInt(countRows.rows[0].count);
    if (numExistingRows < 100000) {
        const dummyData = (0, db_1.generateData)();
        await (0, db_1.populateDB)(postgres_1.postgres, dummyData);
        console.log("Successfully Populated DB");
    }
    else {
        console.log("DB is already populated!");
    }
})();
app.get("/recents", messageController_1.getRecentsHandler);
app.get("/search", messageController_1.searchHandler);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
