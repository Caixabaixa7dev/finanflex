require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

async function setupDatabase() {
  console.log('Connecting to MySQL instance to create database (if not exists)...');
  const rootConn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
  await rootConn.end();

  console.log('Connecting to database:', process.env.DB_NAME);
  // Reconnect using the pool to the specific database
  const db = require('../config/db');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Splitting by semicolon and filtering out empty queries
  const queries = schemaSql
    .split(';')
    .filter(stmt => stmt.trim().length > 0)
    .map(stmt => stmt.trim() + ';');

  console.log('Executing schema initialization...');
  for (const query of queries) {
    await db.query(query);
  }

  // Create indexes manually since IF NOT EXISTS on indexes isn't standard MySQL
  console.log('Creating indexes (ignoring IF EXISTS errors)...');
  try { await db.query('CREATE INDEX idx_contratos_status ON contratos(status);'); } catch (e) {}
  try { await db.query('CREATE INDEX idx_parcelas_txid ON parcelas(txid_veopag);'); } catch (e) {}

  console.log('Database tables and indexes created.');

  // Create default admin user according to instructions
  const adminLogin = 'Sistema';
  const adminPasswordPlain = 'Caixabaixa7';

  const [rows] = await db.query('SELECT id FROM admins WHERE login = ?', [adminLogin]);
  
  if (rows.length === 0) {
    console.log(`Generating bcrypt hash for admin '${adminLogin}'...`);
    const hash = await bcrypt.hash(adminPasswordPlain, 10);
    await db.query('INSERT INTO admins (login, senha_hash) VALUES (?, ?)', [adminLogin, hash]);
    console.log('Initial admin created successfully.');
  } else {
    console.log('Admin user already exists.');
  }

  console.log('Setup finished.');
  process.exit(0);
}

setupDatabase().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
