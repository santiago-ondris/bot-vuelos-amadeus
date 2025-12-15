const Database = require('better-sqlite3');

const db = new Database('vuelos.db', {verbose: console.log});
db.pragma('journal_mode = WAL');

function initDB() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS historical_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recorded_at DATETIME,
            origin TEXT,
            destination TEXT,
            departure_date DATE,
            airline TEXT,
            price REAL,
            currency TEXT
        )
    `;
    db.exec(createTableQuery);
    console.log('db inicializada');
}

initDB();

const insertStmt = db.prepare(`
    INSERT INTO historical_prices (recorded_at, origin, destination, departure_date, airline, price, currency)
    VALUES (@recorded_at, @origin, @destination, @departure_date, @airline, @price, @currency)
`);

function savePrice(data) {
    try {
        insertStmt.run(data);
    } catch (error) {
        console.error("error guardando en la db", error);
    }
}


module.exports = {savePrice};