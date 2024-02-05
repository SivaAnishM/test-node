const errorHandle = require("../../../src/errorhandler/error");
const { connect } = require("../../../src/util/clientConnection");
const moment = require("moment");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

const inactiveItems = async (req, res) => {
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
                message: `No db exist with this company name: ${companyName} or company name is not given in params.`,
            });
        }

        const companyDb = await connect();

        let inactiveItems =
            await companyDb.query(`SELECT ${dbName}.mst_stock_item.guid, ${dbName}.mst_stock_item.name, ${dbName}.mst_stock_item.closing_balance AS quantity, ${dbName}.mst_stock_item.opening_value AS amount, MAX(${dbName}.trn_voucher.date) AS date
        FROM ${dbName}.mst_stock_item
        INNER JOIN ${dbName}.trn_inventory ON ${dbName}.trn_inventory._item = ${dbName}.mst_stock_item.guid
        INNER JOIN ${dbName}.trn_voucher ON ${dbName}.trn_inventory.guid = ${dbName}.trn_voucher.guid
        INNER JOIN ${dbName}.mst_vouchertype ON ${dbName}.trn_voucher._voucher_type = ${dbName}.mst_vouchertype.guid
        WHERE ${dbName}.mst_vouchertype.voucher_reserved_name = 'Sales'
        AND ${dbName}.trn_voucher.date <= (CURRENT_DATE - INTERVAL '${+days} days')
        GROUP BY ${dbName}.mst_stock_item.name, ${dbName}.mst_stock_item.closing_balance, ${dbName}.mst_stock_item.opening_value,  ${dbName}.mst_stock_item.guid;`);

        const formatedDateData = formatDateArray(inactiveItems.rows);

        const totalItems = await companyDb.query(
            `SELECT guid FROM ${dbName}.mst_stock_item;`
        );

        return res.status(200).send({
            status: true,
            message: "voucher data fetched successfully.",
            totalItemCount: totalItems.rows.length,
            inactiveItemCount: inactiveItems.rows.length,
            data: formatedDateData,
        });
    } catch (error) {
        console.log(error.message);
        return errorHandle(error, res);
    }
};

function formatDateArray(arr) {
    return arr.map((item) => {
        const formattedDate = moment(item.date).format("DD MMM YY");
        return {
            itemGuid : item.guid,
            item_name: item.name,
            quantity: item.quantity,
            amount: item.amount,
            date: formattedDate,
        };
    });
}

module.exports = { inactiveItems };
