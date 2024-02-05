const fs = require('fs');
const path = require('path');
let sqlFile = path.join(__dirname, "../../../db/database_structure.sql");
const { connect } = require("../../util/clientConnection");
const { doesSchemaExist } = require("../../util/checkSchemaExits");
const { addSchemaToTables } = require("../../util/schemaTableCreate");
const errorHandle = require('../../errorhandler/error');


const addVoucherTypeDataInDb = async (req, res) => {
    console.time("addVoucherTypeDataInDb")
    try {
        const dbname = req.query.companyName;
        const bodyData = req.body;
        if (Object.keys(bodyData).length === 0) {
            console.log("nothing to create");
            console.timeEnd("addVoucherTypeDataInDb");
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
            await client.query(`DELETE FROM ${dbname}.mst_vouchertype`);

            // SQL query to insert data
            const query = `INSERT INTO ${dbname}.mst_vouchertype (
                guid, alterid, name, parent, _parent, numbering_method, is_deemedpositive, affects_stock, voucher_reserved_name
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
                unnest(CAST($9 AS text[]))
            )
            ON CONFLICT (guid) DO UPDATE
            SET
                alterid = EXCLUDED.alterid,
                name = EXCLUDED.name,
                parent = EXCLUDED.parent,
                _parent = EXCLUDED._parent,
                numbering_method = EXCLUDED.numbering_method,
                is_deemedpositive = EXCLUDED.is_deemedpositive,
                affects_stock = EXCLUDED.affects_stock,
                voucher_reserved_name = EXCLUDED.voucher_reserved_name
            `;

            const values = [
                bodyData.GUID,
                bodyData.ALTERID,
                bodyData.NAME,
                bodyData.PARENT,
                bodyData.PARENTGUID,
                bodyData.NUMBERINGMETHODE,
                bodyData.ISDEEMEDPOSITIVE,
                bodyData.AFFECTSTOCK,
                bodyData.VOUCHERRESERVEDNAME
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
            console.timeEnd("addVoucherTypeDataInDb");
        }
    } catch (error) {
        console.log(error.message);
        return errorHandle(error, res);
    }
}

const fillTheEmptyReserveName = async (req, res) => {
    try {
        const dbname = req.query.companyName;
        let client = await connect()

        const updateQuery = `
        UPDATE ${dbname}.mst_vouchertype AS t1
        SET voucher_reserved_name = (
          SELECT t2.voucher_reserved_name 
          FROM ${dbname}.mst_vouchertype AS t2 
          WHERE t2.name = t1.parent
          LIMIT 1
        )
        WHERE t1.voucher_reserved_name = '';`;

        await client.query(updateQuery);

        console.log('Voucher reserved names updated successfully.');
        return res.status(200).send({
            message: 'Voucher reserved names updated successfully.'
        });

    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
}

module.exports = { addVoucherTypeDataInDb, fillTheEmptyReserveName };
