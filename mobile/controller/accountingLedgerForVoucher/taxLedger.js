const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

const taxLedger = async (req, res) => {
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

        const taxNameArr = await db.query(`SELECT name FROM ${dbName}.mst_group where primary_group = 'Duties & Taxes'`);
        const parentArray = taxNameArr.rows.map((item) => item.name);
        console.log(parentArray);

        const query = `SELECT name as "ledgerName", parent as "Parent" FROM ${dbName}.mst_ledger WHERE parent = ANY($1)`;
        const taxData = await db.query(query, [parentArray]);
        if (taxData.rows.length === 0) {
            return res.status(204).send({
                msg: "Not found",
            });
        }

        return res.status(200).send({
            count: taxData.rows.length,
            data: taxData.rows,
        });
    } catch (error) {
        return res.status(500).send({
            error: error.message,
        });
    }
};

module.exports = { taxLedger };
