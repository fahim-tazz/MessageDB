import { Pool } from "pg";

export const postgres: Pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "MessageDB",
    password: "admin",
    port: 5432
});