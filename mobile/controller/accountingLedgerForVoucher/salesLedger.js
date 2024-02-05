const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

const fetchSalesLedgerData = async (req, res) => {
    try {
        const { companyName } = req.query;

        if (!companyName) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name in query.",
            });
        }
        const dbName = await dbNameFromCLPCode(companyName);
        if (!dbName) {
            return res.status(400).send({
                status: false,
                message: `No db exist with this company name: ${companyName} or company name is not given in params.`
            });
        }
        // const db = await switchDB(companyName);
        const db = await connect();
        const salesLedger = await db.query(
            `SELECT name as "Name", parent as "Parent" FROM ${dbName}.mst_ledger WHERE parent = 'Sales Accounts'`
        );

        return res.status(200).send({
            status: true,
            data: salesLedger.rows,
        });
    } catch (error) {
        return errorHandler(error, res);
    }
};

module.exports = { fetchSalesLedgerData };
