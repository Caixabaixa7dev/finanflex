const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function init() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'src/db/schema.sql'), 'utf8');
        const queries = sql.split(';').filter(q => q.trim().length > 0);
        for(let q of queries) {
            try {
                await db.query(q);
                console.log('Executed successfully:', q.substring(0, 50));
            } catch(e) {
                console.error('Error executing query:', e.message);
            }
        }
    } catch(e) {
        console.error('Failed to read schema file:', e.message);
    } finally {
        process.exit();
    }
}
init();
