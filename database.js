require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

// Configuración de la conexión a Vercel/Postgres
// console.log(process.env.POSTGRES_URL)
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initializeDB() {
  var dir = './db';

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        mail TEXT PRIMARY KEY,
        akka CHAR(20) NOT NULL,
        kills_as_wolf INTEGER NOT NULL,
        wolfs_killed INTEGER NOT NULL,
        UNIQUE (mail, akka)
      )
    `);
    console.log('Tabla creada exitosamente o ya existía.');
  } catch (err) {
    console.error(err.message);
  } finally {
    client.release();
  }
}

async function getUserByMail(mail) {
  const client = await pool.connect();

  try {
    const res = await client.query('SELECT * FROM users WHERE mail = $1', [mail]);
    console.log("ROW", res.rows[0]);
    return res.rows[0];
  } catch (err) {
    console.error(err.message);
  } finally {
    client.release();
  }
}

async function createUser(mail, akka) {
  const user = await getUserByMail(mail);

  if (user !== undefined) {
    return "User already exists";
  } else {
    const client = await pool.connect();

    try {
      await client.query('INSERT INTO users (mail, akka, kills_as_wolf, wolfs_killed) VALUES ($1, $2, $3, $4)', [mail, akka, 0, 0]);
      console.log(`Un usuario ha sido insertado con el correo ${mail}`);
      return "User created successfully!";
    } catch (err) {
      console.error(err.message);
    } finally {
      client.release();
    }
  }
}

module.exports = { initializeDB, getUserByMail, createUser };
