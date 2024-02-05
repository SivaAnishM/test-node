const fs = require("fs");
const path = require("path");
let sqlFile = path.join(__dirname, "../../../db/database_structure.sql");
const { connect } = require("../../util/clientConnection");
const { doesSchemaExist } = require("../../util/checkSchemaExits");
const { addSchemaToTables } = require("../../util/schemaTableCreate");

//CORE VOUCHER
const AddCoreVouchersInDb = async (req, res) => {
    console.time("AddCoreVouchersInDb");
    try {
        const dbname = req.query.companyName.toLowerCase();
        const bodyData = req.body;
        if (bodyData.length === 0) {
            console.log("nothing to create");
            console.timeEnd("AddCoreVouchersInDb");
            return res.status(200).send({
                msg: "Nothing to create",
            });
        }

        // let client = new Client(dbConfig);
        // await client.connect();
        // let client = await connect();

        // // Check if the database already exists
        // const result = await client.query(
        //     "SELECT 1 FROM pg_database WHERE datname = $1",
        //     [dbname]
        // );
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
        const guidValues = [];
        const alterIdValues = [];
        const dateValues = [];
        const voucherTypeValues = [];
        const voucherTypeGuidValues = [];
        const vopucherNumberValues = [];
        const refernceValues = [];
        const referenceDateValues = [];
        const narration = [];
        const partyLedgerNameValues = [];
        const partyLedgerNameGuidValues = [];
        const placeOfSupply = [];
        const isInvoice = [];
        const isAccountingVoucher = [];
        const isInventoryVoucher = [];
        const isOrderVoucher = [];

        for (let j = 0; j < bodyData.length; j++) {
            let data = bodyData[j].ENVELOPE;
            if (data.length !== 0) {
                const {
                    GUID,
                    ALTERID,
                    DATE,
                    VOUCHERTYPENAME,
                    VOUCHERTYPEGUID,
                    VOUCHERNUMBER,
                    REFERENCE,
                    REFERENCEDATE,
                    NARRATION,
                    PARTYLEDGERNAME,
                    PARTYLEDGERNAMEGUID,
                    PLACEOFSUPPLY,
                    ISINVOICE,
                    ISACCOUNTINGVOUCHER,
                    ISINVENTORYVOUCHER,
                    ISORDERVOUCHER,
                } = data;

                // Push the data from this iteration into the respective arrays

                for (let i = 0; i < GUID?.length; i++) {
                    // Push values from each array, checking for undefined
                    guidValues.push(GUID?.[i]);
                    alterIdValues.push(ALTERID?.[i] !== undefined ? ALTERID?.[i] : null);
                    dateValues.push(
                        typeof DATE?.[i] !== "undefined" && DATE?.[i] !== "�"
                            ? DATE?.[i]
                            : null
                    );
                    voucherTypeValues.push(
                        VOUCHERTYPENAME?.[i] !== undefined ? VOUCHERTYPENAME?.[i] : null
                    );
                    voucherTypeGuidValues.push(
                        VOUCHERTYPEGUID?.[i] !== undefined ? VOUCHERTYPEGUID?.[i] : null
                    );
                    vopucherNumberValues.push(
                        VOUCHERNUMBER?.[i] !== undefined ? VOUCHERNUMBER?.[i] : null
                    );
                    refernceValues.push(
                        REFERENCE?.[i] !== undefined ? REFERENCE?.[i] : null
                    );
                    referenceDateValues.push(
                        REFERENCEDATE?.[i] !== undefined && REFERENCEDATE?.[i] !== "�"
                            ? REFERENCEDATE?.[i]
                            : null
                    );
                    narration.push(NARRATION?.[i] !== undefined ? NARRATION?.[i] : null);
                    partyLedgerNameValues.push(
                        PARTYLEDGERNAME?.[i] !== undefined ? PARTYLEDGERNAME?.[i] : null
                    );
                    partyLedgerNameGuidValues.push(
                        PARTYLEDGERNAMEGUID?.[i] !== undefined
                            ? PARTYLEDGERNAMEGUID?.[i]
                            : null
                    );
                    placeOfSupply.push(
                        PLACEOFSUPPLY?.[i] !== undefined ? PLACEOFSUPPLY?.[i] : null
                    );
                    isInvoice.push(ISINVOICE?.[i] !== undefined ? ISINVOICE?.[i] : null);
                    isAccountingVoucher.push(
                        ISACCOUNTINGVOUCHER?.[i] !== undefined
                            ? ISACCOUNTINGVOUCHER?.[i]
                            : null
                    );
                    isInventoryVoucher.push(
                        ISINVENTORYVOUCHER?.[i] !== undefined
                            ? ISINVENTORYVOUCHER?.[i]
                            : null
                    );
                    isOrderVoucher.push(
                        ISORDERVOUCHER?.[i] !== undefined
                            ? parseFloat(ISORDERVOUCHER?.[i])
                            : null
                    );
                }
            }
        }

        try {
            // Begin a transaction
            await client.query("BEGIN");
            const query = `
      INSERT INTO ${dbname}.trn_voucher (
        guid, alterid, date, voucher_type, _voucher_type,
        voucher_number, reference_number, reference_date, narration,
        party_name, _party_name, place_of_supply,
        is_invoice, is_accounting_voucher, is_inventory_voucher, is_order_voucher
      )
      VALUES (
        unnest($1::text[]),
        unnest($2::numeric[]),
        unnest($3::date[]),
        unnest($4::text[]),
        unnest($5::text[]),
        unnest($6::text[]),
        unnest($7::text[]),
        unnest($8::date[]),
        unnest($9::text[]),
        unnest($10::text[]),
        unnest($11::text[]),
        unnest($12::text[]),
        unnest($13::numeric[]),
        unnest($14::numeric[]),
        unnest($15::numeric[]),
        unnest($16::numeric[])
      )ON CONFLICT (guid) DO UPDATE
      SET
        alterid = EXCLUDED.alterid,
        date = EXCLUDED.date,
        voucher_type = EXCLUDED.voucher_type,
        _voucher_type = EXCLUDED. _voucher_type,
        voucher_number = EXCLUDED.voucher_number,
        reference_number = EXCLUDED.reference_number,
        reference_date = EXCLUDED.reference_date,
        narration = EXCLUDED.narration,
        party_name = EXCLUDED.party_name,
        _party_name = EXCLUDED._party_name,
        place_of_supply = EXCLUDED.place_of_supply,
        is_invoice = EXCLUDED.is_invoice,
        is_accounting_voucher = EXCLUDED.is_accounting_voucher,
        is_inventory_voucher = EXCLUDED.is_inventory_voucher,
        is_order_voucher = EXCLUDED.is_order_voucher
        `;

            const values = [
                guidValues,
                alterIdValues,
                dateValues,
                voucherTypeValues,
                voucherTypeGuidValues,
                vopucherNumberValues,
                refernceValues,
                referenceDateValues,
                narration,
                partyLedgerNameValues,
                partyLedgerNameGuidValues,
                placeOfSupply,
                isInvoice,
                isAccountingVoucher,
                isInventoryVoucher,
                isOrderVoucher,
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
            console.timeEnd("AddCoreVouchersInDb");
        }
    } catch (error) {
        console.log(error, "<-- error");
        res.send({ err: error.message });
    }
};

//ACCOUNTING VOUCHER
const AddAccoutingVouchersDataInDb = async (req, res) => {
    console.time("AddAccoutingVouchersDataInDb");
    try {
        const dbname = req.query.companyName.toLowerCase();
        const bodyData = req.body;
        if (bodyData.length === 0) {
            console.log("nothing to create");
            console.timeEnd("AddAccoutingVouchersDataInDb");
            return res.status(200).send({
                msg: "Nothing to create",
            });
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

        const guidValues = [];
        const ledgerValues = [];
        const ledgerGuidValues = [];
        const amountValues = [];
        const amountForexValues = [];
        const currencyValues = [];
        const bankAllocationNames = [];
        const bankDates = [];
        const bankInstrumentDates = [];
        const transactiontypes = [];
        const bankNames = [];
        const instrumentNumbers = [];
        const uniqueReferenceNumbers = [];
        const paymentModes = [];
        const bankPartyNames = [];
        const bankAmounts = [];

        for (let j = 0; j < bodyData.length; j++) {
            let data = bodyData[j].ENVELOPE;
            if (data.length !== 0) {
                const {
                    GUID,
                    ACCOUNTLEDGERNAME,
                    ACCOUNTLEDGERGUID,
                    AMOUNT,
                    AMOUNTFOREX,
                    CURRENCY,
                    BANKALLOCATIONNAME,
                    BANKDATE,
                    BANKINSTRUMENTDATE,
                    TRANSACTIONTYPE,
                    BANKNAME,
                    INSTRUMENTNUMBER,
                    UNIQUEREFERENCENUMBER,
                    PAYMENTMODE,
                    BANKPARTYNAME,
                    BANKAMOUNT,
                } = data;

                // Push the data from this iteration into the respective arrays

                for (let i = 0; i < GUID?.length; i++) {
                    // Push values from each array, checking for undefined
                    guidValues.push(GUID?.[i]);
                    ledgerValues.push(
                        ACCOUNTLEDGERNAME?.[i] !== undefined ? ACCOUNTLEDGERNAME?.[i] : null
                    );
                    ledgerGuidValues.push(
                        ACCOUNTLEDGERGUID?.[i] !== undefined ? ACCOUNTLEDGERGUID?.[i] : null
                    );
                    amountValues.push(AMOUNT?.[i] !== undefined ? AMOUNT?.[i] : null);
                    amountForexValues.push(
                        AMOUNTFOREX?.[i] !== undefined ? AMOUNTFOREX?.[i] : null
                    );
                    currencyValues.push(
                        CURRENCY?.[i] !== undefined ? CURRENCY?.[i] : null
                    );
                    bankAllocationNames.push(
                        BANKALLOCATIONNAME?.[i] !== undefined
                            ? BANKALLOCATIONNAME?.[i]
                            : null
                    );
                    bankDates.push(BANKDATE?.[i] !== undefined ? BANKDATE?.[i] : null);
                    bankInstrumentDates.push(
                        BANKINSTRUMENTDATE?.[i] !== undefined
                            ? BANKINSTRUMENTDATE?.[i]
                            : null
                    );
                    transactiontypes.push(
                        TRANSACTIONTYPE?.[i] !== undefined ? TRANSACTIONTYPE?.[i] : null
                    );
                    bankNames.push(BANKNAME?.[i] !== undefined ? BANKNAME?.[i] : null);
                    instrumentNumbers.push(
                        INSTRUMENTNUMBER?.[i] !== undefined ? INSTRUMENTNUMBER?.[i] : null
                    );
                    uniqueReferenceNumbers.push(
                        UNIQUEREFERENCENUMBER?.[i] !== undefined
                            ? UNIQUEREFERENCENUMBER?.[i]
                            : null
                    );
                    paymentModes.push(
                        PAYMENTMODE?.[i] !== undefined ? PAYMENTMODE?.[i] : null
                    );
                    bankPartyNames.push(
                        BANKPARTYNAME?.[i] !== undefined ? BANKPARTYNAME?.[i] : null
                    );
                    bankAmounts.push(
                        BANKAMOUNT?.[i] !== undefined ? BANKAMOUNT?.[i] : null
                    );
                }
            }
        }

        try {
            // Begin a transaction
            await client.query("BEGIN");

            const checkDb = await client.query(`SELECT * FROM ${dbname}.trn_accounting`);
            if (checkDb.rowCount !== 0) {
                const query = {
                    text: `DELETE FROM ${dbname}.trn_accounting WHERE guid IN (${guidValues.map((_, i) => `$${i + 1}`).join(",")})`,
                    values: guidValues
                };
                await client.query(query);
            }

            // SQL query to insert all the data at once
            const query = `
              INSERT INTO ${dbname}.trn_accounting (
                guid, ledger, _ledger, amount, amount_forex, currency, bank_allocation_name,bank_date,bank_instrument_date,
                transaction_type,bank_name,instrument_number,unique_ref_number,payment_mode,bank_party,
                bank_amount
              )
              VALUES (
                unnest($1::text[]),
                unnest($2::text[]),
                unnest($3::text[]),
                unnest($4::numeric[]),
                unnest($5::numeric[]),
                unnest($6::text[]),
                unnest($7::text[]),
                unnest($8::text[]),
                unnest($9::text[]),
                unnest($10::text[]),
                unnest($11::text[]),
                unnest($12::text[]),
                unnest($13::text[]),
                unnest($14::text[]),
                unnest($15::text[]),
                unnest($16::text[])
              )`;

            const values = [
                guidValues,
                ledgerValues,
                ledgerGuidValues,
                amountValues,
                amountForexValues,
                currencyValues,
                bankAllocationNames,
                bankDates,
                bankInstrumentDates,
                transactiontypes,
                bankNames,
                instrumentNumbers,
                uniqueReferenceNumbers,
                paymentModes,
                bankPartyNames,
                bankAmounts,
            ];

            // Execute the query
            await client.query(query, values);

            // Commit the transaction
            await client.query("COMMIT", (err, result) => {
                if (err) {
                    console.log(err, "Error in query.");
                } else {
                    // client.end();
                }
            });

            console.log("Data inserted successfully");
            res.status(200).json({ message: "Data inserted successfully" });
        } catch (error) {
            // Rollback the transaction in case of an error
            await client.query("ROLLBACK");
            console.error("Error inserting data:", error);
            res.status(500).json({ error: "Error inserting data" });
        } finally {
            console.timeEnd("AddAccoutingVouchersDataInDb");
        }
    } catch (error) {
        console.log(error, "<-- error");
        res.send({ err: error.message });
    }
};

//INVENTORY VOUCHER
const AddVouchersInventoryDataInDb = async (req, res) => {
    console.time("AddVouchersInventoryDataInDb");
    try {
        const dbname = req.query.companyName.toLowerCase();
        const bodyData = req.body;
        if (bodyData.length === 0) {
            console.log("nothing to create");
            console.timeEnd("AddVouchersInventoryDataInDb");
            return res.status(200).send({
                message: "Nothing to create in inventory",
            });
        }
        const checkEnvelope = checkEnvelopeValues(bodyData);
        if (!checkEnvelope) {
            console.log("nothing to create for inventory");
            console.timeEnd("AddVouchersInventoryDataInDb");
            return res.status(200).send({
                message: "Nothing to create for inventory",
            });
        }
        let client = await connect()
        const schemaCheck = await doesSchemaExist(dbname, client)

        if (!schemaCheck) {
            console.log("Table is creating .........");
            await client.query('BEGIN');
            await client.query(`CREATE SCHEMA IF NOT EXISTS ${dbname};`);
            const sqlScripttest = fs.readFileSync(sqlFile, 'utf8');
            const queryTable = await addSchemaToTables(sqlScripttest, dbname)
            await client.query(queryTable);
        } else {
            console.log("Schema is present...");
        }

        const guidValues = [];
        const stockItemValues = [];
        const stockItemGuidValues = [];
        const quantityValues = [];
        const rateValues = [];
        const amountValues = [];
        const addidionalAmountValues = [];
        const discountAmountValues = [];
        const godownNameValues = [];
        const godownGuidValues = [];
        const trackingNumberValues = [];
        const orderNumberValues = [];
        const orderDueDateValues = [];

        for (let j = 0; j < bodyData.length; j++) {
            let data = bodyData[j].ENVELOPE;
            if (data.length !== 0 && data.GUID !== undefined) {
                const {
                    GUID,
                    STOCKITEMNAME,
                    STOCKITEMGUID,
                    QUANTITY,
                    RATE,
                    AMOUNT,
                    ADDITIONALAMOUNT,
                    DISCOUNTAMOUNT,
                    GODOWNNAME,
                    GODOWNGUID,
                    TRACKINGNUMBER,
                    ORDERNUMBER,
                    ORDERDUEDATE,
                } = data;

                // Push the data from this iteration into the respective arrays
                // console.log(ORDERDUEDATE);
                pushIfIterable(guidValues, GUID);
                pushIfIterable(stockItemValues, STOCKITEMNAME);
                pushIfIterable(stockItemGuidValues, STOCKITEMGUID);
                pushIfIterable(quantityValues, QUANTITY);
                pushIfIterable(rateValues, RATE);
                pushIfIterable(amountValues, AMOUNT);
                pushIfIterable(addidionalAmountValues, ADDITIONALAMOUNT);
                pushIfIterable(discountAmountValues, DISCOUNTAMOUNT);
                pushIfIterable(godownNameValues, GODOWNNAME);
                pushIfIterable(godownGuidValues, GODOWNGUID);
                pushIfIterable(trackingNumberValues, TRACKINGNUMBER);
                pushIfIterable(orderNumberValues, ORDERNUMBER);

                for (let i = 0; i < ORDERDUEDATE?.length; i++) {
                    if (ORDERDUEDATE[i] === "�") {
                        ORDERDUEDATE[i] = null;
                    }
                }
                pushIfIterable(orderDueDateValues, ORDERDUEDATE);
            }
        }

        try {
            // Begin a transaction
            await client.query("BEGIN");
            const checkDb = await client.query(`SELECT * FROM ${dbname}.trn_inventory`);
            if (checkDb.rowCount !== 0) {
                const query = {
                    text: `DELETE FROM ${dbname}.trn_inventory WHERE guid IN (${guidValues.map((_, i) => `$${i + 1}`).join(",")})`,
                    values: guidValues
                };
                await client.query(query);
            }

            // SQL query to insert all the data at once
            const query = `
              INSERT INTO ${dbname}.trn_inventory (
                guid, item, _item, quantity, rate, amount,additional_amount,discount_amount, godown, _godown, tracking_number, order_number, order_duedate
              )
              VALUES (
                unnest($1::text[]),
                unnest($2::text[]),
                unnest($3::text[]),
                unnest($4::numeric[]),
                unnest($5::numeric[]),
                unnest($6::numeric[]),
                unnest($7::numeric[]),
                unnest($8::numeric[]),
                unnest($9::text[]),
                unnest($10::text[]),
                unnest($11::text[]),
                unnest($12::text[]),
                unnest($13::date[])
              )`;

            const values = [
                guidValues,
                stockItemValues,
                stockItemGuidValues,
                quantityValues,
                rateValues,
                amountValues,
                addidionalAmountValues,
                discountAmountValues,
                godownNameValues,
                godownGuidValues,
                trackingNumberValues,
                orderNumberValues,
                orderDueDateValues,
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
            // Release the client back to the pool

            console.timeEnd("AddVouchersInventoryDataInDb");
        }
    } catch (error) {
        console.log(error, "<-- error");
        res.send({ err: error.message });
    }
};

//BILL VOUCHER
const AddVouchersBillDataInDb = async (req, res) => {
    console.time("AddVouchersBillDataInDb");
    try {
        const dbname = req.query.companyName.toLowerCase();
        const bodyData = req.body;
        if (bodyData.length === 0) {
            console.log("nothing to create");
            console.timeEnd("AddVouchersBillDataInDb");
            return res.status(200).send({
                msg: "Nothing to create",
            });
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

        const guidValues = [];
        const billLedgerValues = [];
        const billLedgerGuidValues = [];
        const billNameValues = [];
        const amountValues = [];
        const billTypeValues = [];

        for (let j = 0; j < bodyData.length; j++) {
            let data = bodyData[j].ENVELOPE;
            if (data.length !== 0 && data.GUID !== undefined) {
                // Extract data from the request (assuming it's in the same structure)
                const { GUID, BILLLEDGER, BILLLEDGERGUID, BILLNAME, AMOUNT, BILLTYPE } = data;
                pushIfIterable(guidValues, GUID);
                pushIfIterable(billLedgerValues, BILLLEDGER);
                pushIfIterable(billLedgerGuidValues, BILLLEDGERGUID);
                pushIfIterable(billNameValues, BILLNAME);
                pushIfIterable(amountValues, AMOUNT);
                pushIfIterable(billTypeValues, BILLTYPE);
            }
        }

        try {
            // Begin a transaction
            await client.query("BEGIN");

            const checkDb = await client.query(`SELECT * FROM ${dbname}.trn_bill`);
            if (checkDb.rowCount !== 0) {
                const query = {
                    text: `DELETE FROM ${dbname}.trn_bill WHERE guid IN (${guidValues.map((_, i) => `$${i + 1}`).join(",")})`,
                    values: guidValues
                };
                await client.query(query);
            }

            // SQL query to insert all the data at once
            const query = `
              INSERT INTO ${dbname}.trn_bill (
                guid, ledger, _ledger,name, amount, billtype
              )
              VALUES (
                unnest($1::text[]),
                unnest($2::text[]),
                unnest($3::text[]),
                unnest($4::text[]),
                unnest($5::numeric[]),
                unnest($6::text[])
              )`;

            const values = [
                guidValues,
                billLedgerValues,
                billLedgerGuidValues,
                billNameValues,
                amountValues,
                billTypeValues,
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
            console.timeEnd("AddVouchersBillDataInDb");
        }
    } catch (error) {
        console.log(error, "<-- error");
        res.send({ err: error.message });
    }
};

function pushIfIterable(targetArray, sourceArray) {
    if (sourceArray && Symbol.iterator in Object(sourceArray)) {
        targetArray.push(...sourceArray);
    } else {
        targetArray.push([]); // Push an empty array when the sourceArray is non-iterable.
    }
}

function checkEnvelopeValues(arr) {
    for (let i = 0; i < arr.length; i++) {
        const envelope = arr[i].ENVELOPE;

        // Check if the ENVELOPE value is an empty object
        if (Object.keys(envelope).length !== 0 || envelope.constructor !== Object) {
            return true; // Return true if any object has a non-empty ENVELOPE
        }
    }

    return false; // Return false if all objects have an empty ENVELOPE
}

module.exports = {
    AddCoreVouchersInDb,
    AddAccoutingVouchersDataInDb,
    AddVouchersInventoryDataInDb,
    AddVouchersBillDataInDb,
};
