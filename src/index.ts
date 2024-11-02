import Express from "express";
import { connectDB, populateDB, generateData } from "./config/db";
import { getRecentsHandler, searchHandler } from "./controllers/messageController";
import { postgres } from "./models/postgres";

const app = Express();
const PORT = process.env.PORT || 3007;

(async () => {
    await connectDB(postgres);
    const countRows = await postgres.query(`SELECT COUNT(*) FROM contacts`)
    const numExistingRows = parseInt(countRows.rows[0].count)
    if (numExistingRows < 100000) {
        const dummyData = generateData();
        await populateDB(postgres, dummyData);
        console.log("Successfully Populated DB");
    } else {
        console.log("DB is already populated!");
    }
})();

app.get("/recents", getRecentsHandler);
app.get("/search", searchHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});