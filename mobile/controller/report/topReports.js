const moment = require("moment");
const errorHandle = require("../../../src/errorhandler/error");
const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");
const topReports = async (req, res) => {
    try {
        let { companyName, fromDate, toDate, type, limit } = req.query;
        if (!companyName) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name in query.",
            });
        }
        if (!fromDate || !toDate) {
            return res.status(400).send({
                status: false,
                message: "Please provide fromDate and toDate in query.",
            });
        }
        const dbName = await dbNameFromCLPCode(companyName);
        if (!dbName) {
            return res.status(400).send({
                status: false,
                message: `No db exist with this company name: ${companyName} or company name is not given in params.`
            });
        }
        const db = await connect();

        if (!limit) {
            limit = "All";
        }

        const formattedFromDate = moment(fromDate, "DD MMM YY").format("YYYY-MM-DD");
        const formattedToDate = moment(toDate, "DD MMM YY").format("YYYY-MM-DD");

        const totalSum = (arr) => arr.reduce((acc, item) => acc + Math.abs(item.total_amount), 0);

        switch (type) {
            case "customer":
                const customerQuery = await db.query(`SELECT v._party_name, v.party_name,
                SUM(a.amount) AS total_amount
               FROM ${dbName}.trn_voucher AS  v
               INNER JOIN ${dbName}.trn_accounting AS a ON a.guid = v.guid
               inner join ${dbName}.mst_vouchertype as m on m.guid = v._voucher_type
               where v._party_name != a._ledger
               and m.voucher_reserved_name = 'Sales'
               AND v.date >= '${formattedFromDate}'
               AND v.date <= '${formattedToDate}'
               GROUP BY v.party_name, v._party_name
               order by total_amount desc
               LIMIT ${limit};`)
                res.status(200).send({
                    status: true,
                    message: "Data fetched successfully.",
                    total: totalSum(customerQuery.rows),
                    data: customerQuery.rows
                });
                break;
            case "supplier":
                const supplierQuery = await db.query(`SELECT v._party_name, v.party_name,
                ABS(SUM(a.amount)) AS total_amount
               FROM ${dbName}.trn_voucher AS  v
               INNER JOIN ${dbName}.trn_accounting AS a ON a.guid = v.guid
               inner join ${dbName}.mst_vouchertype as m on m.guid = v._voucher_type
               where v._party_name != a._ledger
               and m.parent = 'Purchase'
               AND v.date >= '${formattedFromDate}'
               AND v.date <= '${formattedToDate}'
               GROUP BY v.party_name, v._party_name
               order by total_amount desc
               LIMIT ${limit};`)
                res.status(200).send({
                    status: true,
                    message: "Data fetched successfully.",
                    total: totalSum(supplierQuery.rows),
                    data: supplierQuery.rows
                });
                break;
            case "item sold value":
                const itemSoldValue = await db.query(`SELECT A.ITEM,
                A._ITEM,
                S.UOM,
                ABS(SUM(A.AMOUNT)) AS TOTAL_AMOUNT,
                ABS(SUM(A.QUANTITY)) AS TOTAL_QUANTITY
                FROM ${dbName}.TRN_VOUCHER AS V
                INNER JOIN ${dbName}.TRN_INVENTORY AS A ON A.GUID = V.GUID
                INNER JOIN ${dbName}.MST_VOUCHERTYPE AS M ON M.GUID = V._VOUCHER_TYPE
                INNER JOIN ${dbName}.MST_STOCK_ITEM AS S ON S.GUID = A._ITEM
                WHERE M.voucher_reserved_name = 'Sales'
                AND V.date >= '${formattedFromDate}'
                AND V.date <= '${formattedToDate}'
                GROUP BY A.ITEM,A._ITEM,S.UOM
                ORDER BY TOTAL_AMOUNT DESC
                LIMIT ${limit};`)
                res.status(200).send({
                    status: true,
                    message: "Data fetched successfully.",
                    total: totalSum(itemSoldValue.rows),
                    data: itemSoldValue.rows
                });
                break;
            case "item purchase value":
                const itemPurchaseValue = await db.query(`SELECT A.ITEM,
                A._ITEM,
                S.UOM,
                ABS(SUM(A.AMOUNT)) AS TOTAL_AMOUNT,
                ABS(SUM(A.QUANTITY)) AS TOTAL_QUANTITY
                FROM ${dbName}.TRN_VOUCHER AS V
                INNER JOIN ${dbName}.TRN_INVENTORY AS A ON A.GUID = V.GUID
                INNER JOIN ${dbName}.MST_VOUCHERTYPE AS M ON M.GUID = V._VOUCHER_TYPE
                INNER JOIN ${dbName}.MST_STOCK_ITEM AS S ON S.GUID = A._ITEM
                WHERE M.PARENT = 'Purchase'
                AND V.date >= '${formattedFromDate}'
                AND V.date <= '${formattedToDate}'
                GROUP BY A.ITEM,A._ITEM,S.UOM
                ORDER BY TOTAL_AMOUNT DESC
                LIMIT ${limit};`)
                res.status(200).send({
                    status: true,
                    message: "Data fetched successfully.",
                    total: totalSum(itemPurchaseValue.rows),
                    data: itemPurchaseValue.rows
                });
                break;
            case "item sold quantity":
                const itemSoldQuantity = await db.query(`SELECT A.ITEM,
                A._ITEM,
                S.UOM,
                ABS(SUM(A.AMOUNT)) AS TOTAL_AMOUNT,
                ABS(SUM(A.QUANTITY)) AS TOTAL_QUANTITY
                FROM ${dbName}.TRN_VOUCHER AS V
                INNER JOIN ${dbName}.TRN_INVENTORY AS A ON A.GUID = V.GUID
                INNER JOIN ${dbName}.MST_VOUCHERTYPE AS M ON M.GUID = V._VOUCHER_TYPE
                INNER JOIN ${dbName}.MST_STOCK_ITEM AS S ON S.GUID = A._ITEM
                WHERE M.voucher_reserved_name = 'Sales'
                AND V.date >= '${formattedFromDate}'
                AND V.date <= '${formattedToDate}'
                GROUP BY A.ITEM,A._ITEM,S.UOM
                ORDER BY TOTAL_QUANTITY DESC
                LIMIT ${limit};`)
                res.status(200).send({
                    status: true,
                    message: "Data fetched successfully.",
                    total: totalSum(itemSoldQuantity.rows),
                    data: itemSoldQuantity.rows
                });
                break;
            case "item purchase quantity":
                const itemPurchaseQuantity = await db.query(`SELECT A.ITEM,
                A._ITEM,
                S.UOM,
                ABS(SUM(A.AMOUNT)) AS TOTAL_AMOUNT,
                ABS(SUM(A.QUANTITY)) AS TOTAL_QUANTITY
                FROM ${dbName}.TRN_VOUCHER AS V
                INNER JOIN ${dbName}.TRN_INVENTORY AS A ON A.GUID = V.GUID
                INNER JOIN ${dbName}.MST_VOUCHERTYPE AS M ON M.GUID = V._VOUCHER_TYPE
                INNER JOIN ${dbName}.MST_STOCK_ITEM AS S ON S.GUID = A._ITEM
                WHERE M.PARENT = 'Purchase'
                AND V.date >= '${formattedFromDate}'
                AND V.date <= '${formattedToDate}'
                GROUP BY A.ITEM,A._ITEM,S.UOM
                ORDER BY TOTAL_QUANTITY DESC
                LIMIT ${limit};`)
                res.status(200).send({
                    status: true,
                    message: "Data fetched successfully.",
                    total: totalSum(itemPurchaseQuantity.rows),
                    data: itemPurchaseQuantity.rows
                });
                break;
            default:
                res.status(400).send({
                    status: false,
                    message: "Please provide a valid 'view' parameter.",
                });
        }
    } catch (error) {
        return errorHandle(error, res);
    }
}

module.exports = { topReports }