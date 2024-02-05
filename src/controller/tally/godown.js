const fs = require('fs');
const path = require('path');
let sqlFile = path.join(__dirname, "../../../db/database_structure.sql");
const { connect } = require("../../util/clientConnection");
const { doesSchemaExist } = require("../../util/checkSchemaExits");
const { addSchemaToTables } = require("../../util/schemaTableCreate");

const createGodownInDb = async (req, res) => {
    console.time("createGodownInDb")
    try {
        const dbname = req.query.companyName.toLowerCase();
        const bodyData = req.body;
        if (Object.keys(bodyData).length === 0) {
            console.log("nothing to create");
            console.timeEnd("createGodownInDb");
            return res.status(200).send({
                msg: "Nothing to create"
            })
        }
        let client = await connect()
        const schemaCheck = await doesSchemaExist(dbname, client)

        if (!schemaCheck) {
            console.log("Table is creating .........");
            await client.query('BEGIN');
            await client.query(`CREATE SCHEMA IF NOT EXISTS ${dbname};`);
            const sqlScripttest = fs.readFileSync(sqlFile, 'utf8');
            const queryTable = await addSchemaToTables(sqlScripttest, dbname.toLowerCase())
            await client.query(queryTable);
        } else {
            console.log("Schema is present...");
        }

        // Commit the transaction
        await client.query('COMMIT');
        try {
            // Begin a transaction
            await client.query('BEGIN');

            // SQL query to delete existing data
            await client.query(`DELETE FROM ${dbname}.mst_godown`);

            // SQL query to insert data
            const query = `INSERT INTO ${dbname}.mst_godown (
                guid, alterid, name, parent, _parent, address
            )
            VALUES (
                unnest(CAST($1 AS text[])), unnest(CAST($2 AS numeric[])), unnest(CAST($3 AS text[])), 
                unnest(CAST($4 AS text[])), unnest(CAST($5 AS text[])), unnest(CAST($6 AS text[]))
            )
            ON CONFLICT (guid) DO UPDATE
            SET
                alterid = EXCLUDED.alterid,
                name = EXCLUDED.name,
                parent = EXCLUDED.parent,
                _parent = EXCLUDED._parent,
                address = EXCLUDED.address
            `;

            const values = [
                bodyData.GUID,
                bodyData.ALTERID,
                bodyData.NAME,
                bodyData.PARENT,
                bodyData.PARENTGUID,
                bodyData.ADDRESS
            ];

            // Execute the query
            await client.query(query, values);

            // Commit the transaction
            await client.query('COMMIT');

            console.log('Data inserted successfully');
            res.status(200).json({ message: 'Data inserted successfully' });
        } catch (error) {
            // Rollback the transaction in case of an error
            await client.query('ROLLBACK');
            console.error('Error inserting data:', error);
            res.status(500).json({ error: 'Error inserting data' });
        } finally {
            console.timeEnd("createGodownInDb");
        }
        // await client.end();
    } catch (error) {
        console.log(error, "<-- error");
    }
};

module.exports = { createGodownInDb }