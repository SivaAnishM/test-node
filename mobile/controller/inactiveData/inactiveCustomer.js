const errorHandle = require("../../../src/errorhandler/error");
const { connect } = require("../../../src/util/clientConnection");
const moment = require("moment");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

const inactiveCustomers = async (req, res) => {
    try {
        let { companyName, days } = req.query;

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

        const companyDb = await connect();

        let inactiveCustomers = await companyDb.query(
            `SELECT 
        ${dbName}.trn_voucher.party_name,
        ${dbName}.trn_voucher._party_name AS party_guid, 
        MAX(${dbName}.trn_voucher.date) AS date
    FROM ${dbName}.trn_voucher
    INNER JOIN ${dbName}.mst_vouchertype ON ${dbName}.mst_vouchertype.guid = ${dbName}.trn_voucher._voucher_type
    WHERE ${dbName}.mst_vouchertype.voucher_reserved_name = 'Sales'
        AND ${dbName}.trn_voucher.date <= (CURRENT_DATE - INTERVAL '${+days} days')
    GROUP BY 
        ${dbName}.trn_voucher.party_name,
        ${dbName}.trn_voucher._party_name;`);

        const formatedDateData = formatDateArray(inactiveCustomers.rows);

        return res.status(200).send({
            status: true,
            message: "Inactive customers fetched successfully.",
            count: inactiveCustomers.rows.length,
            data: formatedDateData,
        });
    } catch (error) {
        return errorHandle(error, res);
    }
};

function formatDateArray(arr) {
    return arr.map((item) => {
        const formattedDate = moment(item.date).format("DD MMM YY");
        return {
            party_name: item.party_name,
            party_guid: item.party_guid,
            date: formattedDate,
        };
    });
}

module.exports = { inactiveCustomers };
