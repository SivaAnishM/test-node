const { Pool } = require("pg");
const { dbConfig } = require("../../db/dbConfig");
// const { pool } = require("../../index");

// Define the connection configuration
const dbConfig1 = {
  user: "postgres",
  host: "localhost",
  database: "postgres", // Connect to the PostgreSQL default 'postgres' database
  password: "postgres",
  port: 5432, // PostgreSQL default port
};

const defaultPool = new Pool(dbConfig1);

// Function to connect to a specific PostgreSQL database
async function connectToDatabase(dbName) {
  console.log("connectToDatabase entered");

  const dbPool = new Pool(dbConfig1);

  try {
    // Check if the database exists
    const exists = await dbPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (!exists.rows.length) {
      console.log("!exists entered", dbName);
      // If the database doesn't exist, create it
      await defaultPool.query(`CREATE DATABASE "${dbName}";`);
    } else {
      dbPool.connect({
        user: "postgres",
        host: "localhost",
        database: dbName, // Connect to the PostgreSQL default 'postgres' database
        password: "postgres",
        port: 5432, // PostgreSQL default port
      });
    }

    // Switch to the specified database
    return dbPool;
  } catch (error) {
    throw error;
  }
}


// const dbConfig = {
//   user: "postgres",
//   host: "localhost",
//   database: "tallydb",
//   password: "postgres",
//   port: 5432,
// };

// const dbConfig = {
//   user: "postgres",
//   host: "localhost",
//   database: "TALLY_DATA",
//   password: "decobee",
//   port: 5433,
// };

const pool = new Pool(dbConfig);
module.exports = {
  connectToDatabase,
  defaultPool,
  query: (text, params) => pool.query(text, params),
  switchDB: async (dbName) => {
    // await pool.end();
    const newConfig = {
      ...dbConfig,
      database: dbName,
    };
    const newPool = new Pool(newConfig);
    // let client = await newPool.connect();
    return newPool;
  },
};
