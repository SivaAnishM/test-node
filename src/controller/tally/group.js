const fs = require('fs');
const path = require('path');
let sqlFile = path.join(__dirname, "../../../db/database_structure.sql");
const { connect } = require("../../util/clientConnection");
const { doesSchemaExist } = require("../../util/checkSchemaExits");
const { addSchemaToTables } = require("../../util/schemaTableCreate");

const addGroupsIndb = async (req, res) => {
    console.time("addGroupsIndb")
    try {
        const dbname = req.query.companyName.toLowerCase();
        const bodyData = req.body;
        if (Object.keys(bodyData).length === 0) {
            console.log("nothing to create");
            console.timeEnd("addGroupsIndb");
            return res.status(200).send({
                msg: "Nothing to create"
            })
        }
        let client = await connect()
        const schemaCheck = await doesSchemaExist(dbname, client)

        if (!schemaCheck) {
            await client.query('BEGIN');
            // Create the 'client' schema
            await client.query(`CREATE SCHEMA IF NOT EXISTS ${dbname};`);
            const sqlScripttest = fs.readFileSync(sqlFile, 'utf8');
            const queryTable = await addSchemaToTables(sqlScripttest, dbname.toLowerCase())
            await client.query(queryTable);
        } else {
            console.log("Schema is present...");
        }

        try {
            // Begin a transaction
            await client.query('BEGIN');

            // SQL query to delete existing data
            await client.query(`DELETE FROM ${dbname}.mst_group`);

            // SQL query to insert data
            const query = `INSERT INTO ${dbname}.mst_group (
                guid, alterid, name, parent, _parent, primary_group,
                is_revenue, is_deemedpositive, is_reserved, affects_gross_profit, sort_position, group_reserved_name
            )
            VALUES (
                unnest(CAST($1 AS text[])), 
                unnest(CAST($2 AS numeric[])), 
                unnest(CAST($3 AS text[])), 
                unnest(CAST($4 AS text[])), 
                unnest(CAST($5 AS text[])), 
                unnest(CAST($6 AS text[])), 
                unnest(CAST($7 AS numeric[])), 
                unnest(CAST($8 AS numeric[])), 
                unnest(CAST($9 AS numeric[])), 
                unnest(CAST($10 AS numeric[])), 
                unnest(CAST($11 AS numeric[])), 
                unnest(CAST($12 AS text[]))
            )
            ON CONFLICT (guid) DO UPDATE
            SET
                alterid = EXCLUDED.alterid,
                name = EXCLUDED.name,
                parent = EXCLUDED.parent,
                _parent = EXCLUDED._parent,
                primary_group = EXCLUDED.primary_group,
                is_revenue = EXCLUDED.is_revenue,
                is_deemedpositive = EXCLUDED.is_deemedpositive,
                is_reserved = EXCLUDED.is_reserved,
                affects_gross_profit = EXCLUDED.affects_gross_profit,
                sort_position = EXCLUDED.sort_position,
                group_reserved_name = EXCLUDED.group_reserved_name
            `;

            const values = [
                bodyData.GUID,
                bodyData.ALTERID,
                bodyData.NAME,
                bodyData.PARENT,
                bodyData.PARENTGUID,
                bodyData.PRIMARYGROUP,
                bodyData.ISREVENUE,
                bodyData.ISDEEMEDPOSITIVE,
                bodyData.ISRESERVED,
                bodyData.AFFECTSGROSSPROFIT,
                bodyData.SORTPORTION,
                bodyData.GROUPRESERVEDNAME
            ];

            // Execute the query
            await client.query(query, values);

            // Commit the transaction
            await client.query('COMMIT');

            console.log('Data inserted successfully');
            return res.status(200).json({ message: 'Data inserted successfully' });
        } catch (error) {
            // Rollback the transaction in case of an error
            await client.query('ROLLBACK');
            console.error('Error inserting data:', error);
            return res.status(500).json({ error: 'Error inserting data' });
        } finally {
            // Release the client back to the pool

            console.timeEnd("addGroupsIndb");
        }

    } catch (error) {
        console.log(error, "<-- error");
        return res.send({ err: "server side error" })
    }
};

const sendGroupsNameList = async (req, res) => {
    try {
        const { companyName } = req.query
        const db = await connect()
        const data = await db.query(`SELECT name FROM ${companyName}.mst_group`, (err, result) => {
            if (err) {
                console.log(err, "Error in query.");
            } else {
                // db.end()
            }
        })

        const namesArray = data.rows.map(item => item.name);
        return res.status(200).send({
            status: true,
            data: namesArray
        })
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message
        })
    }
}

const fillTheEmptyGroupReserveName = async (req, res) => {
    try {
        const dbname = req.query.companyName;
        let client = await connect()

        // const updateQuery = `
        // UPDATE ${dbname}.mst_group AS t1
        // SET group_reserved_name = (
        //   SELECT t2.group_reserved_name 
        //   FROM ${dbname}.mst_group AS t2 
        //   WHERE t2.name = t1.primary_group
        //   LIMIT 1
        // )
        // WHERE t1.group_reserved_name = '';`;
        const updateQuery = `
        UPDATE ${dbname}.mst_group
        SET group_reserved_name = name
        WHERE group_reserved_name = '';`;

        await client.query(updateQuery);

        console.log('group reserved names updated successfully.');
        return res.status(200).send({
            message: 'group reserved names updated successfully.'
        });

    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
}

module.exports = { addGroupsIndb, sendGroupsNameList, fillTheEmptyGroupReserveName }