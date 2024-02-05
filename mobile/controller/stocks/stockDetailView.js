//PACKAGE IMPORT
const moment = require("moment");

//FUNCTION IMPORT
const { connect } = require("../../../src/util/clientConnection");
const { organizeByMonth } = require("../../util/monthWiseUtil");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

//FUNCTION FOR ITEM SUMMERY DETAIL VIEW WITH SQL
const itemSummaryDetailViewP = async (req, res) => {
    try {
        const { itemGuid, fromDate, toDate, companyName, view } = req.query;

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
        if (!view) {
            return res.status(200).send({
                msg: "please provide view parameter"
            });
        }

        // const db = await switchDB(companyName);
        const db = await connect();

        if (!itemGuid && !fromDate && !toDate) {
            return sendErrorResponse(
                req,
                res,
                'Please provide either the "itemGuid", "fromDate" or "toDate" parameter.'
            );
        }

        const parsedFromDate = moment(fromDate, "DD MMM YY");
        const parsedToDate = moment(toDate, "DD MMM YY");
        const convertedFromDate = parsedFromDate.format("YYYY-MM-DD");
        const convertedToDate = parsedToDate.format("YYYY-MM-DD");
        const voucherData = await db.query(`SELECT *, TO_CHAR(v.date, 'YYYY-MM-DD') AS date, j.parent as unuseparent , j.voucher_reserved_name AS parent
        FROM ${dbName}.trn_voucher AS v
        INNER JOIN ${dbName}.mst_vouchertype AS j ON v._voucher_type=j.guid
        INNER JOIN ${dbName}.trn_inventory AS i ON v.guid = i.guid
        where v.date BETWEEN  '${convertedFromDate}' AND '${convertedToDate}' and i._item= '${itemGuid}' ;`);

        if (voucherData.rows.length === 0) {
            return res.status(204).send({
                status: false,
                message: "No voucher found with this filter.",
            });
        }

        const uniqueParentNames = [
            ...new Set(voucherData.rows.map((voucher) => voucher.parent)),
        ];

        // Create a map to group voucher data by parent
        const parentMap = new Map();

        uniqueParentNames.forEach((parentName) => {
            const parentData = voucherData.rows.filter(
                (voucher) => voucher.parent === parentName
            );

            if (parentData.length > 0) {
                parentMap.set(parentName, parentData);
            }
        });

        const parentArray = Array.from(parentMap, ([parentName, data]) => ({
            parentName,
            totalAmount: calculateTotalAmountByStockItem(data),
            data,
        }));

        let overviewArr = parentArray.map((obj) =>
            calculateOverviewData(obj.data)
        );

        if (view == "month") {
            let newArr = []

            for (let i = 0; i < parentArray.length; i++) {
                let dataArr = parentArray[i].data;
                let monthArr = organizeByMonth(dataArr);
                let obj = {
                    parentName: parentArray[i].parentName,
                    totalAmount: parentArray[i].totalAmount,
                    data: monthArr
                }
                newArr.push(obj)
            }
            return res.status(200).send({
                status: true,
                data: newArr,
                overview: overviewArr,
            });
        } else if (view == "bill") {
            return res.status(200).send({
                status: true,
                voucher: parentArray,
                overview: overviewArr,
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

//FUNCTION FOR ITEM CUSTOMERS DETAIL VIEW WITH SQL
const itemCustomersDetailviewP = async (req, res) => {
    try {
        const { itemGuid, partyGuid, fromDate, toDate, companyName } = req.query;
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

        voucherType = "Sales";
        if (!itemGuid || !fromDate || !toDate) {
            return res.status(400).send({
                status: false,
                message: `Please provide either the "itemGuid", "fromDate" or "toDate" parameter and item name.`,
            });
        }

        let parsedFromDate = moment(fromDate, "DD MMM YY");
        let parsedToDate = moment(toDate, "DD MMM YY");
        let convertedFromDate = parsedFromDate.format("YYYY-MM-DD");
        let convertedToDate = parsedToDate.format("YYYY-MM-DD");

        if (partyGuid) {
            if (!itemGuid) {
                return res.status(400).send({
                    status: false,
                    message: "Please send the itemGuid in the query.",
                });
            }
            const voucherData =
                await db.query(`SELECT v.guid, v.voucher_number, v.date, j.rate, j.amount, j.quantity, i.parent as voucher_type
             FROM ${dbName}.trn_voucher AS v
             INNER JOIN ${dbName}.trn_inventory AS j ON v.guid=j.guid
             INNER JOIN ${dbName}.mst_vouchertype AS i ON v._voucher_type = i.guid
             where v.date BETWEEN '${convertedFromDate}' AND '${convertedToDate}' and i.parent='Sales' and j._item='${itemGuid}' and v._party_name='${partyGuid}';`);

            if (voucherData.rows.length === 0) {
                return res.status(204).send({
                    status: false,
                    message: `No data found with partyGuid: ${partyGuid}.`,
                });
            }

            return res.status(200).send({
                status: true,
                message: `Voucher with party Guid ${partyGuid}.`,
                data: voucherData.rows,
            });
        }

        let soldVoucherData = await db.query(`SELECT *
        FROM ${dbName}.trn_voucher AS v
        INNER JOIN ${dbName}.trn_inventory AS j ON v.guid=j.guid
        INNER JOIN ${dbName}.mst_vouchertype AS i ON v._voucher_type = i.guid
        INNER JOIN ${dbName}.mst_stock_item AS s ON j._item=s.guid
        where v.date BETWEEN '${convertedFromDate}' AND '${convertedToDate}' and i.parent='Sales' and j._item='${itemGuid}';`);

        if (soldVoucherData.rows.length === 0) {
            return res.status(204).send({
                status: false,
                message: "No voucher found with this filter.",
            });
        }
        let soldStocks = findLastSoldItemInfo(
            soldVoucherData.rows,
            voucherType
        );

        return res.status(200).send({
            status: true,
            count: soldStocks.length,
            data: soldStocks,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

// FUNCTION FOR ITEM SUPPLIERS DETAIL VIEW WITH SQL
const itemSuppliersDetailViewP = async (req, res) => {
    try {
        const { itemGuid, partyGuid, fromDate, toDate, companyName } = req.query;
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

        voucherType = "Purchase";
        if (!itemGuid || !fromDate || !toDate) {
            return res.status(400).send({
                status: false,
                message: `Please provide either the "itemGuid", "fromDate" or "toDate" parameter and item name.`,
            });
        }

        let parsedFromDate = moment(fromDate, "DD MMM YY");
        let parsedToDate = moment(toDate, "DD MMM YY");
        let convertedFromDate = parsedFromDate.format("YYYY-MM-DD");
        let convertedToDate = parsedToDate.format("YYYY-MM-DD");

        if (partyGuid) {
            if (!itemGuid) {
                return res.status(400).send({
                    status: false,
                    message: "Please send the itemGuid in the query.",
                });
            }
            const voucherData =
                await db.query(`SELECT v.guid, v.voucher_number, v.date, j.rate, j.amount, j.quantity, i.parent as voucher_type
            FROM ${dbName}.trn_voucher AS v             
            INNER JOIN ${dbName}.trn_inventory AS j ON v.guid=j.guid
            INNER JOIN ${dbName}.mst_vouchertype AS i ON v._voucher_type = i.guid
            where v.date BETWEEN '${convertedFromDate}' AND '${convertedToDate}' and i.parent='Purchase' and j._item='${itemGuid}' and v._party_name='${partyGuid}';`);

            if (voucherData.rows.length === 0) {
                return res.status(204).send({
                    status: false,
                    message: `No data found with partyGuid: ${partyGuid}.`,
                });
            }

            return res.status(200).send({
                status: true,
                message: `Voucher with partyGuid ${partyGuid}.`,
                data: voucherData.rows,
            });
        }

        let purchasedVoucherData = await db.query(`SELECT *
        FROM ${dbName}.trn_voucher AS v
        INNER JOIN ${dbName}.trn_inventory AS j ON v.guid=j.guid
        INNER JOIN ${dbName}.mst_vouchertype AS i ON v._voucher_type = i.guid
        INNER JOIN ${dbName}.mst_stock_item AS s ON j._item=s.guid
        where v.date BETWEEN '${convertedFromDate}' AND '${convertedToDate}' and i.parent='Purchase' and j._item='${itemGuid}';`);

        if (purchasedVoucherData.rows.length === 0) {
            return res.status(204).send({
                status: false,
                message: "No voucher found with this filter.",
            });
        }
        let purchasedStocks = findLastSoldItemInfo(
            purchasedVoucherData.rows,
            voucherType
        );

        return res.status(200).send({
            status: true,
            count: purchasedStocks.length,
            data: purchasedStocks,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

//UTIL
function calculateTotalAmountByStockItem(data) {
    let totalAmount = 0;

    data.forEach((e) => {
        totalAmount += Math.abs(e.amount);
    });

    return totalAmount;
}

function calculateTotalQantityByStockItem(data) {
    let totalQuantity = 0;

    data.forEach((e) => {
        totalQuantity += Math.abs(e.quantity);
    });

    return totalQuantity;
}

function calculateRateInfoByStockItem(data) {
    let lastRate = null;
    let minRate = null;
    let maxRate = null;

    const rate = data[0].rate; // Extracting rate value from "1234.56/Pcs"
    const date = moment(data[0].date, "YYYYMMDD");
    lastRate = { value: data[0].rate, date };
    data.forEach((e) => {
        if (date.isAfter(moment(e.date, "YYYYMMDD"))) {
            lastRate = { value: rate, date };
        }
        if (minRate === null || rate < minRate) {
            minRate = rate;
        }

        if (maxRate === null || rate > maxRate) {
            maxRate = rate;
        }
    });

    return { lastRate: lastRate ? lastRate.value : null, minRate, maxRate };
}

function calculateOverviewData(data) {
    const overview = {};

    const voucherTypes = [
        ...new Set(data.map((voucher) => voucher.parent)),
    ];

    voucherTypes.forEach((voucherType) => {
        const vouchers = data.filter(
            (voucher) => voucher.parent === voucherType
        );

        let lastDate = vouchers[0].date;
        vouchers.forEach((e) => {
            if (!moment(lastDate).isAfter(moment(e.date))) {
                lastDate = e.date;
            }
        });

        const totalAmount = calculateTotalAmountByStockItem(vouchers);
        const totalQuantity = calculateTotalQantityByStockItem(vouchers);
        const info = calculateRateInfoByStockItem(vouchers);

        overview[`voucherType`] = voucherType;
        overview["totalAmount"] = totalAmount;
        overview["totalQuantity"] = totalQuantity;
        overview[`lastDate`] = lastDate;
        overview[`numOfInvoice`] = vouchers.length.toString();
        overview[`lastRate`] = info.lastRate;
        overview[`minRate`] = info.minRate;
        overview[`maxRate`] = info.maxRate;
    });

    return overview;
}

function findLastSoldItemInfo(arr, voucherType) {
    const result = {};

    arr.forEach((obj) => {
        const partyLedgerName = obj.party_name;
        const partyGuid = obj._party_name;
        const date = moment(obj.date, "YYYYMMDD");
        const item = obj;

        if (item) {
            const quantityInfo = Math.abs(item.quantity);
            const rate = item.rate;

            if (!result[partyLedgerName]) {
                result[partyLedgerName] = {
                    partyLedgerName,
                    partyGuid,
                    lastsold: date,
                    rate: rate,
                    totalquantity: quantityInfo ? quantityInfo : 0,
                    unit: quantityInfo ? item.uom : "",
                };
            } else {
                if (date.isAfter(result[partyLedgerName].lastsold)) {
                    result[partyLedgerName].lastsold = date;
                    result[partyLedgerName].rate = rate; // Update rate with the latest one
                }
                result[partyLedgerName].totalquantity += quantityInfo
                    ? quantityInfo
                    : 0;
            }
        }
    });

    // Format lastsold as a date string using Moment.js
    if (voucherType === "Sales") {
        for (const key in result) {
            const entry = result[key];
            entry.lastsold = entry.lastsold.format("DD MMM YYYY");
            entry.totalquantity = `${entry.totalquantity} ${entry.unit}`;
        }
    }
    if (voucherType === "Purchase") {
        for (const key in result) {
            const entry = result[key];
            entry.lastPurchase = entry.lastsold.format("DD MMM YYYY");
            entry.totalquantity = `${entry.totalquantity} ${entry.unit}`;
        }
    }

    return Object.values(result);
}

//ERROR HANDEL UTIL FUNCTION
const sendErrorResponse = (req, res, message) => {
    return res.status(400).send({
        status: false,
        message: message,
    });
};



module.exports = {
    itemSummaryDetailViewP,
    itemCustomersDetailviewP,
    itemSuppliersDetailViewP,
};
