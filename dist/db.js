"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const faker_1 = require("@faker-js/faker");
const BATCH_SIZE = 999;
exports.connectDB = async () => {
    const pool = new pg_1.Pool({
        user: "postgres",
        host: "localhost",
        database: "MessageDB",
        password: "admin",
        port: 5432
    });
    try {
        await pool.connect();
        console.log("Successfully connected to database!");
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS contacts (
                phone VARCHAR(12) PRIMARY KEY,
                first_name VARCHAR(30),
                last_name VARCHAR(30)
            )
        `;
        await pool.query(createTableQuery);
        console.log("CREATED OR CHECKED TABLE");
        return pool;
    }
    catch (error) {
        console.log(error);
    }
};
exports.generateData = () => {
    const phoneSet = new Set();
    const nameSet = new Set();
    const contacts = [];
    console.log("Start DATA GENERATION");
    for (let i = 0; i < 100000; i++) {
        // console.log(faker.phone.number()) 
        let phone;
        let first_name;
        let last_name;
        do {
            phone = faker_1.faker.phone.number({ style: "international" });
            first_name = faker_1.faker.person.firstName();
            last_name = faker_1.faker.person.lastName();
            console.log(`DUPLICATE PHONE NUMBER ${phone}, MOVING ON!!!`);
        } while (phoneSet.has(phone) || nameSet.has(first_name + last_name));
        contacts.push(phone, first_name, last_name);
        phoneSet.add(phone);
        nameSet.add(first_name + last_name);
    }
    console.log("Finish DATA GENERATION");
    return contacts;
};
exports.populateDB = async (pool, contacts) => {
    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
        console.log(`Started query ${i}`);
        const batch = contacts.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map((value, index) => {
            if (index % 3 == 0) {
                return `($${index + 1}`;
            }
            else if (index % 3 == 2) {
                return `$${index + 1})`;
            }
            else {
                return `$${index + 1}`;
            }
        });
        const createTableQuery = `
                INSERT INTO contacts
                VALUES ${placeholders.join(", ")}
        `;
        await pool.query(createTableQuery, batch);
        console.log(`Finished query ${i}`);
    }
};
