// import { Client } from "pg";

// const { Client } = require("pg");
const { Pool } = require("pg");
const { dbConfig } = require("../../db/dbConfig");

let client = null;

// const connect = () => {
//   if (!client) {
//     client = new Client(dbConfig);
//     client.connect();
//   }
//   return client;
// };

// const connect = () => {
//   const defaultPool = new Pool(dbConfig);
//   return defaultPool;
// };

let existingPool = null;

const connect = () => {
  if (!existingPool) {
    existingPool = new Pool(dbConfig);
  }
  return existingPool;
};


const disconnect = () => {
  if (client) {
    // client.end();
    client = null;
  }
};

module.exports = { client, connect, disconnect };
