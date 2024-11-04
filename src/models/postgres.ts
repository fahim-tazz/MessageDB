import { Pool } from "pg";
import dotenv from 'dotenv';
dotenv.config();
console.log("The dotenv is ", process.env.DB_PASSWORD);

export const postgres: Pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
});