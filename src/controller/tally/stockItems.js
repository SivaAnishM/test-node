const fs = require('fs');
const path = require('path');
let sqlFile = path.join(__dirname, "../../../db/database_structure.sql");
const { connect } = require("../../util/clientConnection");
const { doesSchemaExist } = require("../../util/checkSchemaExits");
const { addSchemaToTables } = require("../../util/schemaTableCreate");

const addStockGroupDataInDb = async (req, res) => {
    console.time("addStockGroupDataInDb")
    try {
        const dbname = req.query.companyName;
        const bodyData = req.body;
        if (Object.keys(bodyData).length === 0) {
            console.log("nothing to create");
            console.timeEnd("addStockGroupDataInDb");
            return res.status(200).send({
                msg: "Nothing to create"
            })
        }

        let client = await connect()
        const schemaCheck = await doesSchemaExist(dbname, client)

        if (!schemaCheck) {
            console.log("Table is creating .........");
            await client.query('BEGIN');
            // Create the 'client' schema
            await client.query(`CREATE SCHEMA IF NOT EXISTS ${dbname};`);
            const sqlScripttest = fs.readFileSync(sqlFile, 'utf8');
            const queryTable = await addSchemaToTables(sqlScripttest, dbname)
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
            await client.query(`DELETE FROM ${dbname}.mst_stock_group`);

            // SQL query to insert data
            const query = `INSERT INTO ${dbname}.mst_stock_group (
                guid, alterid, name, parent, _parent
            )
            VALUES (
                unnest(CAST($1 AS text[])), unnest(CAST($2 AS numeric[])), unnest(CAST($3 AS text[])), 
                unnest(CAST($4 AS text[])), unnest(CAST($5 AS text[]))
            )
            ON CONFLICT (guid) DO UPDATE
            SET
                alterid = EXCLUDED.alterid,
                name = EXCLUDED.name,
                parent = EXCLUDED.parent,
                _parent = EXCLUDED._parent
            `;

            const values = [
                bodyData.GUID,
                bodyData.ALTERID,
                bodyData.NAME,
                bodyData.PARENT,
                bodyData.PARENTGUID
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
            console.timeEnd("addStockGroupDataInDb");
        }
    } catch (error) {
        console.log(error, "<-- error");
        return res.send("error")
    }
};

const addStockItemDataInDb = async (req, res) => {
    console.time("addStockItemDataInDb")
    try {
        const dbname = req.query.companyName.toLowerCase();
        const bodyData = req.body;
        if (Object.keys(bodyData).length === 0) {
            console.log("nothing to create");
            console.timeEnd("addStockItemDataInDb");
            return res.status(200).send({
                msg: "Nothing to create"
            })
        }

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

        try {
            // Begin a transaction
            await client.query('BEGIN');

            // SQL query to delete existing data
            await client.query(`DELETE FROM ${dbname}.mst_stock_item`);

            // SQL query to insert data
            const query = `INSERT INTO ${dbname}.mst_stock_item (
                guid, alterid, name, parent, _parent, alias, uom, _uom, opening_balance, opening_rate,
                opening_value,gst_nature_of_goods,gst_hsn_code,gst_taxability,closing_balance,closing_value,
                last_sale_party,last_purc_party,closing_rate
            )
            VALUES (
                unnest(CAST($1 AS text[])), unnest(CAST($2 AS numeric[])), unnest(CAST($3 AS text[])), 
                unnest(CAST($4 AS text[])), unnest(CAST($5 AS text[])),unnest(CAST($6 AS text[])), 
                unnest(CAST($7 AS text[])), unnest(CAST($8 AS text[])), 
                unnest(CAST($9 AS numeric[])), unnest(CAST($10 AS numeric[])), 
                unnest(CAST($11 AS numeric[])), unnest(CAST($12 AS text[])), 
                unnest(CAST($13 AS text[])), unnest(CAST($14 AS text[])),unnest(CAST($15 AS text[])), 
                unnest(CAST($16 AS numeric[])), unnest(CAST($17 AS text[])), 
                unnest(CAST($18 AS text[])), unnest(CAST($19 AS text[]))
            )
            ON CONFLICT (guid) DO UPDATE
            SET
                alterid = EXCLUDED.alterid,
                name = EXCLUDED.name,
                parent = EXCLUDED.parent,
                _parent = EXCLUDED._parent,
                alias = EXCLUDED.alias,
                uom = EXCLUDED.uom,
                _uom = EXCLUDED._uom,
                opening_balance = EXCLUDED.opening_balance,
                opening_rate = EXCLUDED.opening_rate,
                opening_value = EXCLUDED.opening_value,
                gst_nature_of_goods = EXCLUDED.gst_nature_of_goods,
                gst_hsn_code = EXCLUDED.gst_hsn_code,
                gst_taxability = EXCLUDED.gst_taxability,
                closing_balance = EXCLUDED.closing_balance,
                closing_value = EXCLUDED.closing_value,
                last_sale_party = EXCLUDED.last_sale_party,
                last_purc_party = EXCLUDED.last_purc_party,
                closing_rate = EXCLUDED.closing_rate
            `;

            const values = [
                bodyData.GUID,
                bodyData.ALTERID,
                bodyData.NAME,
                bodyData.PARENT,
                bodyData.PARENTGUID,
                bodyData.ALIAS,
                bodyData.UNIT,
                bodyData.UNITGUID,
                bodyData.OPENINGBALENCE,
                bodyData.OPENINGRATE,
                bodyData.OPENINGVALUE,
                bodyData.GSTNATUREOFGOODS,
                bodyData.GSTHSNCODE,
                bodyData.GSTTEXABILITY,
                bodyData.CLOSINGBALANCE,
                bodyData.CLOSINGVALUE,
                bodyData.LASTSALEPARTY,
                bodyData.LASTPURCHASEPARTY,
                bodyData.CLOSINGRATE
            ];

            // Execute the query
            await client.query(query, values);

            // Commit the transaction
            await client.query('COMMIT');
            // await client.end();

            console.log('Data inserted successfully');
            res.status(200).json({ message: 'Data inserted successfully' });
        } catch (error) {
            // Rollback the transaction in case of an error
            await client.query('ROLLBACK');
            console.error('Error inserting data:', error);
            res.status(500).json({ error: 'Error inserting data' });
        } finally {
            console.timeEnd("addStockItemDataInDb");
        }
        // await client.end();

    } catch (error) {
        console.log(error, "<-- error");
    }
};

module.exports = {
    addStockGroupDataInDb,
    addStockItemDataInDb
};
