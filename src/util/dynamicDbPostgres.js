const { Pool } = require("pg");
const { dbConfig } = require("../../db/dbConfig");

// const dbConfig = {
//     user: "postgres",
//     host: "localhost",
//     database: "postgres", // Connect to the PostgreSQL default 'postgres' database
//     password: "postgres",
//     port: 5432, // PostgreSQL default port
//   }

const defaultPool = new Pool(dbConfig);


const checkIfDbExists = async (dbName) => {
  const exists = await defaultPool.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName]
  );
}

const createDb = async (dbName) => {
  await defaultPool.query(`CREATE DATABASE "${dbName}";`);
}

const switchDB = async (dbName) => {
  // await pool.end();
  const newConfig = {
    ...dbConfig,
    database: dbName,
  };
  const newPool = new Pool(newConfig);
  return newPool;
}

module.exports = { checkIfDbExists, createDb, switchDB }


