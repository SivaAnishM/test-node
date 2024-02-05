const { connect } = require('./clientConnection');

async function doesSchemaExist(schemaName, client) {
  // let client = await connect();

  try {
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.schemata
        WHERE schema_name = $1
      );
    `;

    const result = await client.query(query, [schemaName]);
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking schema existence:', error);
    return false;
  }
}

module.exports = { doesSchemaExist }