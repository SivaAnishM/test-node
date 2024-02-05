const { Client } = require("pg");
const { dbConfig } = require("../../../../db/dbConfig");
const fs = require('fs');
const path = require('path');
const { switchDB } = require("../../../util/dynamicDbSwitch");
const { connect } = require("../../../util/clientConnection");
const { sqlTableCount } = require("../../../util/incrementalSyncUtil/incrementalSync");
const { doesSchemaExist } = require("../../../util/checkSchemaExits");
const { addSchemaToTables } = require("../../../util/schemaTableCreate");
let sqlFile = path.join(__dirname, "../../../../db/database_structure.sql");

const addcostCentreIndb = async (req, res) => {
    console.time("addcostCentreIndb")
    try {
        const dbname = req.query.companyName.toLowerCase();
        const bodyData = req.body;

        let client = await connect()
        const schemaCheck = await doesSchemaExist(dbname, client)

        if (!schemaCheck) {
            console.log("Table is creating .........");
            await client.query('BEGIN');

            // Create the 'client' schema
            await client.query(`CREATE SCHEMA IF NOT EXISTS ${dbname};`);
            const sqlScripttest = fs.readFileSync(sqlFile, 'utf8');
            const queryTable = await addSchemaToTables(sqlScripttest, dbname.toLowerCase())
            await client.query(queryTable);
        } else {
            console.log("Schema is present...");
        }

        // Commit the transaction
        await client.query('COMMIT');

        if (Object.keys(bodyData).length === 0) {
            console.log("nothing to create");
            console.timeEnd("addcostCentreIndb");
            return res.status(200).send({
                msg: "Nothing to create"
            })
        } else {
            try {
                // Begin a transaction
                await client.query('BEGIN');

                // SQL query to delete existing data
                await client.query(`DELETE FROM ${dbname}.mst_cost_centre`);

                // SQL query to insert data
                const query = `INSERT INTO ${dbname}.mst_cost_centre (
                guid, alterid, name, parent, _parent, category
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
                category = EXCLUDED.category
            `;

                const values = [
                    bodyData.GUID,
                    bodyData.ALTERID,
                    bodyData.NAME,
                    bodyData.PARENT,
                    bodyData.PARENTGUID,
                    bodyData.CATEGORY
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
                console.timeEnd("addcostCentreIndb");
            }
        }
    } catch (error) {
        console.log(error, "<-- error");
        return res.send({ err: "server side error" })
    }
};

module.exports = { addcostCentreIndb }