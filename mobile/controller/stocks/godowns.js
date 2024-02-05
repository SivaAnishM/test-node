const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

const fetchGodowns = async (req, res) => {
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

        const godownData = await db.query(`SELECT name as "Name" FROM ${dbName}.mst_godown`);

        if (godownData.rows.length === 0) {
            return res.status(204).send({
                status: false,
                message: `No godown found`,
            });
        }

        return res.status(200).send({
            status: true,
            count: godownData.rows.length,
            data: godownData.rows,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

module.exports = { fetchGodowns };
