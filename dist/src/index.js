"use strict";
const Express = require("express");
const { connectDB, populateDB, generateData } = require("./config/db");
const app = new Express();
const PORT = process.env.PORT || 3000;
(async () => {
    const postgres = await connectDB();
    const countRows = await postgres.query(`SELECT COUNT(*) FROM contacts`);
    const numExistingRows = parseInt(countRows.rows[0].count);
    if (numExistingRows < 100000) {
        const dummyData = generateData();
        await populateDB(postgres, dummyData);
        console.log("Successfully Populated DB");
    }
    else {
        console.log("DB is already populated!");
    }
})();
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
