# MessageDB

# Quickstart
1. Setup your Postgres Database.
2. Add the database name, username, and password to the .env file on the project root. (Host should be localhost, and port should be 5432 as usual).
3. Navigate to the project root.
4. Run ```npm ci```.
5. Run ```npm run dev```.
6. Wait for it to populate the DB.

# API Endpoints
1. ```/recents``` : Gets the last message of the 50 most recent conversations.
2. Optionally, use ```/recents?page=2``` to get subsequent pages of rows.
3. ```/search?keyword=<TEXT, NAME or PHONE>``` (without the angle brackets) : Searches for the ```keyword``` in message text, full names, and phone numbers.
