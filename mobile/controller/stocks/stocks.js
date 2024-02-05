const errorHandler = require("../../../src/errorhandler/error");
const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

//--------------------FETCH STOCK----------------------//
const sendStockData = async (req, res) => {
    try {
        const companyName = req.query.companyName;
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
        const stockGroupPermission = req.stockGroupPermission
        // const db = await switchDB(companyName);
        const db = await connect();

        if (req.isOwner || req.isAdmin) {
            const queryRun = await db.query(
                `select guid as "itemGuid", name as "Name", uom as "BaseUnits", parent as "Parent", gst_hsn_code as 
                "_HSNCode", last_purc_party as "_LastPurcParty", last_sale_party as "__LastSaleParty",  closing_balance 
                as "_ClosingQty", opening_balance as "_ClosingBalance", opening_value as "_ClosingValue", 
                SPLIT_PART(closing_rate::TEXT, '/', 1) "_ClosingRate" from ${dbName}.mst_stock_item ORDER BY name`
            );
            if (queryRun.rows.length === 0) {
                return res.status(204).send({
                    status: false,
                    message: "No stock data found in DB.",
                    data: []
                });
            }
            // console.log(queryRun.rows.length, "stock length")
            return res.status(200).send({
                status: true,
                message: "Stocks data fetched successfully.",
                count: queryRun.rows.length,
                data: queryRun.rows,
            });
        } else {
            const trueKeys = stockGroupPermission && Object.keys(stockGroupPermission)?.filter(key => stockGroupPermission?.[key] === true);
            const query = await db.query(`select guid as "itemGuid", name as "Name", uom as "BaseUnits", parent as 
            "Parent", gst_hsn_code as "_HSNCode", last_purc_party as "_LastPurcParty", last_sale_party 
            as "__LastSaleParty",  closing_balance as "_ClosingQty", opening_balance as "_ClosingBalance", 
            opening_value as "_ClosingValue", SPLIT_PART(closing_rate::TEXT, '/', 1) "_ClosingRate" 
            from ${dbName}.mst_stock_item where parent = ANY ($1) ORDER BY name`, [trueKeys]);

            if (query.rows.length === 0) {
                return res.status(204).send({
                    status: false,
                    message: "No stock data found in DB.",
                    data: []
                });
            }
            // console.log(query.rows.length, "stock length")
            return res.status(200).send({
                status: true,
                message: "Stocks data fetched successfully.",
                count: query.rows.length,
                data: query.rows,
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            status: false,
            message: error.message,
            data: []
        });
    }
};

//----------------------CREATE STOCK-----------------//
const createStocks = async (req, res) => {
    try {
    } catch (error) {
        return errorHandler(error, res);
    }
};

//----------------------SEND STOCKGROUP LIST-------------------//
const fetchPrimaryGroups = async (req, res) => {
    try {

        const { companyName, stockGroupName } = req.query;
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

        let db = await connect();

        if (!stockGroupName) {
            const stockGroupPermission = req.stockGroupPermission
            const trueKeys = Object.keys(stockGroupPermission).filter(key => stockGroupPermission[key] === true);

            const query1 = await db.query(`SELECT ${dbName}.mst_stock_group.name as "Name", 
            ${dbName}.mst_stock_group.parent as "Parent", SUM(${dbName}.mst_stock_item.opening_value) 
            as "TotalAmount" from ${dbName}.mst_stock_group INNER JOIN ${dbName}.mst_stock_item 
            on ${dbName}.mst_stock_group.name=${dbName}.mst_stock_item.parent WHERE 
            ${dbName}.mst_stock_group.parent='' AND ${dbName}.mst_stock_group.name=ANY ($1) 
            GROUP BY ${dbName}.mst_stock_group.name, ${dbName}.mst_stock_group.parent`, [trueKeys])
            query1.rows.map(item => item.Parent = " Primary")
            const query2 = await db.query(`SELECT name as "Name", uom as "BaseUnits", parent as "Parent", 
            gst_hsn_code as "_HSNCode", last_purc_party as "_LastPurcParty", last_sale_party as "__LastSaleParty",  
            closing_balance as "_ClosingQty", opening_balance as "_ClosingBalance", opening_value as "_ClosingValue", 
            SPLIT_PART(closing_rate::TEXT, '/', 1) "_ClosingRate" from ${dbName}.mst_stock_item WHERE parent=''`)
            query2.rows.map(item => item.Parent = " Primary")

            if (query1.rows.length === 0) {
                return res.status(204).send({
                    status: false,
                    message: "No Stocks data found."
                })
            }

            return res.status(200).send({
                status: true,
                message: "Stocks data fetched successfully.",
                endOfList: true,
                data: { stockgroupList: query1.rows, itemList: query2.rows },
            });
        }
        else {
            const query1 = await db.query(`SELECT ${dbName}.mst_stock_group.name, 
            ${dbName}.mst_stock_group.parent, SUM(${dbName}.mst_stock_item.opening_value) as "TotalAmount", 
            SUM(${dbName}.mst_stock_item.opening_balance) as "TotalStock" FROM ${dbName}.mst_stock_group 
            INNER JOIN ${dbName}.mst_stock_item ON ${dbName}.mst_stock_group.name=${dbName}.mst_stock_item.parent 
            WHERE ${dbName}.mst_stock_group.parent = $1 GROUP BY ${dbName}.mst_stock_group.name, 
            ${dbName}.mst_stock_group.parent`, [stockGroupName])
            const query2 = await db.query(`SELECT name as "Name", uom as "BaseUnits", parent as "Parent", gst_hsn_code as 
            "_HSNCode", last_purc_party as "_LastPurcParty", last_sale_party as "__LastSaleParty",  closing_balance as 
            "_ClosingQty", opening_balance as "_ClosingBalance", opening_value as "_ClosingValue", 
            SPLIT_PART(closing_rate::TEXT, '/', 1) "_ClosingRate" from ${dbName}.mst_stock_item 
            WHERE parent=$1`, [stockGroupName])

            return res.status(200).send({
                status: true,
                data: { groupData: query1.rows, itemData: query2.rows }
            })
        }

    } catch (error) {
        console.log(error);
        return errorHandler(error, res);
    }
};

const fetchSelectedGroups = async (req, res) => {
    try {
        const { companyName, stockGroupName } = req.query;
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
        const query1 = await db.query(`SELECT * FROM ${dbName}.mst_stock_group WHERE parent = $1`, [stockGroupName])
        const query2 = await db.query(`SELECT name as "Name", uom as "BaseUnits", parent as "Parent", 
        gst_hsn_code as "_HSNCode" from ${dbName}.mst_stock_item WHERE parent=$1`, [stockGroupName])

        return res.status(200).send({
            status: true,
            data: { groupData: query1.rows, itemData: query2.rows }
        })
    } catch (error) {
        console.log(error);
        return errorHandler(error, res);
    }
}

module.exports = {
    sendStockData,
    createStocks,
    fetchPrimaryGroups,
    fetchSelectedGroups
};
