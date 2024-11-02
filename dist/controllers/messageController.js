"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentsHandler = getRecentsHandler;
exports.searchHandler = searchHandler;
const postgres_1 = require("../models/postgres");
async function getRecentsHandler(req, res) {
    let offset = 0;
    if (req.query.page) {
        offset = (parseInt(req.query.page) - 1) * 50;
    }
    // We use Offset Pagination assuming that the offset is small (upto 10000 rows)
    // Keyset Pagination adds unnecessary complexity to the API for little performance benefit.
    // Note that the created_at column is indexed, so offsets upto 10000 rows / 500 pages are fast.
    const getRecentsQuery = `WITH recent_contacts AS (
        SELECT
            m.contact_id,
            MAX(m.created_at) AS last_message_time
        FROM
            messages m
        GROUP BY
            m.contact_id
        ORDER BY
            last_message_time DESC
        LIMIT 50 OFFSET ${offset}
    )\n
    SELECT 
        c.first_name,
        c.last_name,
        c.phone,
        m.text,
        m.created_at
    FROM 
        messages m 
    JOIN recent_contacts rc ON m.contact_id = rc.contact_id AND m.created_at = rc.last_message_time
    JOIN contacts c ON m.contact_id = c.id
    ORDER BY
        m.created_at DESC
    `;
    const queryResult = await postgres_1.postgres.query(getRecentsQuery);
    res.json(queryResult.rows);
}
async function searchHandler(req, res) {
    if (!req.query.keyword) {
        throw new Error("No search parameter given");
    }
    const searchKeyword = req.query.keyword;
    const searchPage = parseInt(req.query.page) || 1;
    const offset = 50 * (searchPage - 1);
    const searchQuery = `
        SELECT
            c.first_name,
            c.last_name,
            c.phone,
            m.text,
            m.created_at
        FROM
            messages m
        JOIN contacts c ON m.contact_id = c.id
        WHERE
            ${ /*Full-text search on message content*/""}
            to_tsvector('english', m.text) @@ to_tsquery($1)
            OR
            ${ /*Search on contact first name*/""}
            c.first_name ILIKE '%' || '$1' || '%'
            OR
            ${ /*Search on contact last name*/""}
            c.last_name ILIKE '%' || '$1' || '%'
            OR
            ${ /*Search on contact phone number*/""}
            c.phone LIKE '%' || '$1' || '%'
        ORDER BY
            m.created_at DESC
        LIMIT 50 OFFSET ${offset};
    `;
    const queryResult = await postgres_1.postgres.query(searchQuery, [searchKeyword]);
    res.json(queryResult.rows);
}
