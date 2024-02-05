const moment = require("moment");
const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

const VouchersAccToLedgers = async (req, res) => {
    try {
        let { fromDate, toDate, voucherType, ledgerName, companyName } = req.query;
        // const companyDb = await switchDB(companyName);
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

        fromDate = moment(fromDate, "D MMM YY").format("YYYY-MM-DD");
        toDate = moment(toDate, "D MMM YY").format("YYYY-MM-DD");

        const voucherData =
            await companyDb.query(`SELECT v.guid, v.party_name, v.date, i.amount, v.voucher_number
        FROM ${dbName}.trn_voucher AS  v
        INNER JOIN ${dbName}.trn_accounting AS i ON i.guid = v.guid
        INNER JOIN ${dbName}.mst_vouchertype AS z ON z.guid = v._voucher_type
        WHERE i._ledger = v._party_name
        And v.party_name = '${ledgerName}'
        AND z.voucher_reserved_name = '${voucherType}'
        AND date BETWEEN '${fromDate}' AND '${toDate}'
        ORDER BY date;`);

        const formattedData = formatData(voucherData.rows);

        let total = voucherData.rows.reduce(
            (total, obj) => (total += Math.abs(+obj.amount)),
            0
        );

        return res.status(200).send({
            total,
            count: voucherData.rows.length,
            data: formattedData,
        });
    } catch (error) {
        return res.status(500).send({
            error: error.message,
        });
    }
};

function formatData(inputData) {
    const formattedData = inputData.map((item) => ({
        guid: item.guid,
        party_name: item.party_name,
        date: moment(item.date).format("DD MMM YY"),
        amount: Math.abs(parseFloat(item.amount)),
        voucher_number: item.voucher_number,
    }));
    return formattedData;
}

module.exports = { VouchersAccToLedgers };
