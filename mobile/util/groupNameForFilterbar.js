const { connect } = require("../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("./dbNameFromCLPCode");

const groupNameForFilterbar = async (req, res) => {
    try {
        let companyName = req.query.companyName;
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
        const db1 = await connect();

        const queryRun = await db1.query(
            `SELECT name FROM ${dbName}.mst_group
            WHERE group_reserved_name = 'Sundry Creditors' OR group_reserved_name = 'Sundry Debtors';`
        );

        if (queryRun.rows.length === 0) {
            return res.status(400).send({
                status: false,
                message: `No group found in db: ${dbName}.`
            });
        }

        const groupData = queryRun.rows.map((item) => item.name);

        return res.status(200).send({
            status: true,
            message: "group data fetched successfully.",
            data: groupData
        });

    } catch {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
}

module.exports = {
    groupNameForFilterbar
}