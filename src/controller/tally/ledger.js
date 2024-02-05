const fs = require('fs');
const path = require('path');
let sqlFile = path.join(__dirname, "../../../db/database_structure.sql");
const { connect } = require('../../util/clientConnection');
const { addSchemaToTables } = require('../../util/schemaTableCreate');
const { doesSchemaExist } = require('../../util/checkSchemaExits');

const addLedgerDataInDb = async (req, res) => {
    console.time("addLedgerDataInDb");
    try {
        const dbname = req.query.companyName.toLowerCase();
        const bodyData = req.body;
        if (Object.keys(bodyData).length === 0) {
            console.log("nothing to create");
            console.timeEnd("addLedgerDataInDb");
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
            // await client.query("BEGIN");

            // SQL query to delete existing data
            await client.query(`DELETE FROM ${dbname}.mst_ledger`);

            // SQL query to insert data
            const query = `INSERT INTO ${dbname}.mst_ledger (
                    guid, alterid, name, parent, _parent, alias, is_revenue, is_deemedpositive, 
                    opening_balance, description, mailing_name, mailing_address, mailing_state, 
                    mailing_country, mailing_pincode, email, it_pan, gstn, gst_registration_type, 
                    gst_supply_type, gst_duty_head, tax_rate, bank_account_holder, bank_account_number, 
                    bank_ifsc, bank_swift, bank_name, bank_branch, closing_balance, mobile, phone
                )
                VALUES (
                    unnest(CAST($1 AS text[])), unnest(CAST($2 AS numeric[])), unnest(CAST($3 AS text[])), 
                    unnest(CAST($4 AS text[])), unnest(CAST($5 AS text[])), unnest(CAST($6 AS text[])), 
                    unnest(CAST($7 AS numeric[])), unnest(CAST($8 AS numeric[])), 
                    unnest(CAST($9 AS numeric[])), unnest(CAST($10 AS text[])), 
                    unnest(CAST($11 AS text[])), unnest(CAST($12 AS text[])), 
                    unnest(CAST($13 AS text[])), unnest(CAST($14 AS text[])), 
                    unnest(CAST($15 AS text[])), unnest(CAST($16 AS text[])), 
                    unnest(CAST($17 AS text[])), unnest(CAST($18 AS text[])), 
                    unnest(CAST($19 AS text[])), unnest(CAST($20 AS text[])), 
                    unnest(CAST($21 AS text[])), unnest(CAST($22 AS numeric[])), 
                    unnest(CAST($23 AS text[])), unnest(CAST($24 AS text[])), 
                    unnest(CAST($25 AS text[])), unnest(CAST($26 AS text[])), 
                    unnest(CAST($27 AS text[])), unnest(CAST($28 AS text[])), 
                    unnest(CAST($29 AS numeric[])), unnest(CAST($30 AS text[])), unnest(CAST($31 AS text[]))
                )
                ON CONFLICT (guid) DO UPDATE
                SET
                    alterid = EXCLUDED.alterid,
                    name = EXCLUDED.name,
                    parent = EXCLUDED.parent,
                    _parent = EXCLUDED._parent,
                    alias = EXCLUDED.alias,
                    is_revenue = EXCLUDED.is_revenue,
                    is_deemedpositive = EXCLUDED.is_deemedpositive,
                    opening_balance = EXCLUDED.opening_balance,
                    description = EXCLUDED.description,
                    mailing_name = EXCLUDED.mailing_name,
                    mailing_address = EXCLUDED.mailing_address,
                    mailing_state = EXCLUDED.mailing_state,
                    mailing_country = EXCLUDED.mailing_country,
                    mailing_pincode = EXCLUDED.mailing_pincode,
                    email = EXCLUDED.email,
                    it_pan = EXCLUDED.it_pan,
                    gstn = EXCLUDED.gstn,
                    gst_registration_type = EXCLUDED.gst_registration_type,
                    gst_supply_type = EXCLUDED.gst_supply_type,
                    gst_duty_head = EXCLUDED.gst_duty_head,
                    tax_rate = EXCLUDED.tax_rate,
                    bank_account_holder = EXCLUDED.bank_account_holder,
                    bank_account_number = EXCLUDED.bank_account_number,
                    bank_ifsc = EXCLUDED.bank_ifsc,
                    bank_swift = EXCLUDED.bank_swift,
                    bank_name = EXCLUDED.bank_name,
                    bank_branch = EXCLUDED.bank_branch,
                    closing_balance = EXCLUDED.closing_balance,
                    mobile = EXCLUDED.mobile,
                    phone = EXCLUDED.phone
                `;

            const values = [
                bodyData.GUID,
                bodyData.ALTERID,
                bodyData.LEDGERNAME,
                bodyData.PARENT,
                bodyData.PARENTGUID,
                bodyData.ALIAS,
                bodyData.ISREVENUE,
                bodyData.ISDEEMEDPOSITIVE,
                bodyData.OPENINGBALANCE,
                bodyData.DESCRIPTION,
                bodyData.MAILINGNAME,
                bodyData.MAILINGADDRESS,
                bodyData.MAILINGSTATE,
                bodyData.MAILINGCOUNTRY,
                bodyData.MAILINGPINCODE,
                bodyData.EMAIL,
                bodyData.INCOMTAXNUMBER,
                bodyData.GSTN,
                bodyData.GSTREGTYP,
                bodyData.GSTSUPLLYTYP,
                bodyData.GSTDUTYHEAD,
                bodyData.TAXRATE,
                bodyData.BANKACCHOLDERNAME,
                bodyData.ACCNUMBER,
                bodyData.IFSC,
                bodyData.SWIFTCODE,
                bodyData.BANKNAME,
                bodyData.BRANCHNAME,
                bodyData.CLOSINGBALANCE,
                bodyData.MOBILE,
                bodyData.PHONE
            ];

            // Execute the query
            await client.query(query, values);

            // Commit the transaction
            await client.query("COMMIT");

            console.log("Data inserted successfully");
            res.status(200).json({ message: "Data inserted successfully" });
        } catch (error) {
            // Rollback the transaction in case of an error
            await client.query("ROLLBACK");
            console.error("Error inserting data:", error);
            res.status(500).json({ error: "Error inserting data" });
        } finally {
            console.timeEnd("addLedgerDataInDb");
        }
    } catch (error) {
        console.log(error, "<--//// error");
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    addLedgerDataInDb
};
