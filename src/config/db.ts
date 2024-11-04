import { Pool, QueryResult } from "pg";
import { faker } from "@faker-js/faker";
import Papa from "papaparse";
import fs from "fs";
import path from "path"

const BATCH_SIZE = 999;

export async function connectDB(pool: Pool): Promise<void> {
    try {
        await pool.connect()
        console.log("Successfully connected to database!")
        await pool.query(`
                DROP TABLE messages, contacts;
            `)
        const createTablesAndIndicesQuery = `
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(12) UNIQUE NOT NULL,
                first_name VARCHAR(30) NOT NULL,
                last_name VARCHAR(30)
            );
            \n
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER,
                text VARCHAR(1000),
                created_at TIMESTAMP,
                FOREIGN KEY (contact_id) REFERENCES contacts(id)
            );
            \n
            ${/* For fast sorting of messages by timestamp.*/ ""}
            CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
            \n
            ${/* For fast full-text search*/ ""}
            CREATE INDEX IF NOT EXISTS idx_messages_text ON messages USING gin(to_tsvector('english', text));
            \n
            ${/* No need for indices on individual columns of contacts, as there is no need for sorting them in the API.*/ ""}
            ${/* For fast joins between messages and contacts tables.*/ ""}
            CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
        `;
        await pool.query(createTablesAndIndicesQuery)
        console.log("CREATED OR CHECKED TABLES")
    } catch (error) {
        console.log(error);
        throw new Error("Database connection failed");
    }
}

export function generateData(): string[] {
    const phoneSet = new Set();
    const nameSet = new Set();
    const contacts: Array<string> = []
    console.log("Start DATA GENERATION")

    for (let i = 0; i < 100000; i++) {
        // console.log(faker.phone.number()) 

        let phone: string;
        let first_name: string;
        let last_name: string;
        do {
            phone = faker.phone.number({ style: "international" });
            first_name = faker.person.firstName();
            last_name = faker.person.lastName();
            // console.log(`DUPLICATE PHONE NUMBER ${phone}, MOVING ON!!!`)
        } while (phoneSet.has(phone) || nameSet.has(first_name + last_name));

        contacts.push(phone, first_name, last_name)
        phoneSet.add(phone)
        nameSet.add(first_name + last_name)
    }
    console.log("Finish DATA GENERATION");
    return contacts
}


export async function populateDB(pool: Pool, contactsValues: string[]): Promise<void> {
    // Add contacts
    for (let i = 0; i < contactsValues.length; i += BATCH_SIZE) {
        const batch = contactsValues.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map((value: string, index: number) => {
            if (index % 3 == 0) {
                return `($${index + 1}`
            } else if (index % 3 == 2) {
                return `$${index + 1})`
            } else {
                return `$${index + 1}`
            }
        });
        const insertContactsQuery = `
                INSERT INTO contacts (phone, first_name, last_name)
                VALUES ${placeholders.join(", ")}
        `;
        await pool.query(insertContactsQuery, batch)
    }

    // Add messages
    const messages: string[] = [];
    const stream = fs.createReadStream(path.join(__dirname, "../message_content.csv"), {
        highWaterMark: 64 * 1024 * 1024
    });
    await new Promise<void>((resolve, reject) => {
        Papa.parse(stream, {
            header: false,
            step: (result) => {
                const data = result.data as string[];
                if (!data || data.length === 0 || data[0].trim().length === 0) {
                    console.log(`Empty or malformed row.`);
                    return;
                }
                const message = data[0].trim();
                if (message.length == 0) {
                    return;
                }
                messages.push(message);
            },
            complete: () => {
                console.log(`${messages.length} lines from CSV parsed!`);
                resolve();
            },
            error: (err: Error) => {
                console.error("Parsing error:", err);
                reject(err)
            }
        })
    });
    let messageValues: string[] = [];
    let placeholders: string[] = [];
    let placeholderIndex = 1;
    const promises: Promise<QueryResult<any>>[] = []
    for (let index = 0; index < contactsValues.length; index += 3) {
        const contactId = (index / 3) + 1;
        for (let i = 0; i < 50; i++) {
            // We reuse the contacts array in memory
            const messageText = messages[((contactId - 1) * 50 + i) % messages.length];
            // Generate a random timestamp between start and end
            const startTimestamp = new Date('2015-01-01T00:00:00Z').getTime();
            const endTimestamp = new Date('2024-12-31T23:59:59Z').getTime();
            const randomTimestamp = Math.random() * (endTimestamp - startTimestamp) + startTimestamp;
            const createdAt = new Date(randomTimestamp).toISOString();

            // Add values for each message
            messageValues.push((contactId).toString(), messageText, createdAt);

            // Create a placeholder set (e.g., ($1, $2, $3))
            placeholders.push(`($${placeholderIndex}, $${placeholderIndex + 1}, $${placeholderIndex + 2})`);
            placeholderIndex += 3;
            // console.log(`Added message ${(contactId - 1) * 50 + i}`);
        }
        // batch processing at 5000 messages
        if (contactId % 100 == 0) {
            const addMessagesQuery = `
                INSERT INTO messages (contact_id, text, created_at)
                VALUES ${placeholders.join(", ")}
            `
            promises.push(pool.query(addMessagesQuery, messageValues));
            placeholderIndex = 1;
            placeholders = [];
            messageValues = [];
        }
    };
    return Promise.all(promises).then(() => {
        console.log("All messages populated!");
    });
}