const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");
const { fetchAllReceivables } = require("../dashboard/dashBoardUtil");

const fetchOutstanding = async (req, res) => {
    try {
        const { companyName } = req.query;
        if (!companyName) {
            return res.status(400).json({
                status: false,
                message: "Please provide company name in query.",
            });
        }
        const dbName = await dbNameFromCLPCode(companyName);

        if (!dbName) {
            return res.status(400).json({
                status: false,
                message: `No database exists with this company name: ${companyName} or company name is not given in params.`,
            });
        }

        const outStandinginfo = await fetchAllReceivables(dbName);

        const { total, data: outstandingData } = outStandinginfo;

        if (outstandingData.length === 0) {
            return res.status(200).json({
                status: true,
                message: "No outstanding data found.",
                totalOutstanding: total,
                outstandingData
            });
        }

        const OutstandingData = await processData(
            outstandingData,
            dbName,
            res
        );

        const finalOutstandingData = OutstandingData.sort((a, b) => {
            return Math.abs(+b.total) - Math.abs(+a.total);
        });

        return res.status(200).json({
            status: true,
            message: "Outstanding data fetched successfully.",
            totalOutstanding: total,
            finalOutstandingData,
        });
    } catch (error) {
        console.error("Error in fetchOutstanding:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const processData = async (inputArray, dbName, res) => {
    try {
        const db = await connect();
        const uniquePartyNames = [
            ...new Set(inputArray.map((item) => item.partyName)),
        ];
        const query = {
            text: `SELECT name as "partyName", mobile, phone FROM ${dbName}.mst_ledger WHERE name = ANY($1)`,
            values: [uniquePartyNames],
        };

        const mobileNumberData = await db.query(query);

        const resultObject = {};

        inputArray.forEach((item) => {
            const mobileNumber = mobileNumberData.rows.find(
                (row) => row.partyName === item.partyName
            );

            if (resultObject.hasOwnProperty(item.partyName)) {
                resultObject[item.partyName].total += parseFloat(item.pendingAmount);
                resultObject[item.partyName].data.push(item);
            } else {
                resultObject[item.partyName] = {
                    partyName: item.partyName,
                    total: parseFloat(item.pendingAmount),
                    mobileNumber: mobileNumber?.mobile != "" ? mobileNumber?.mobile : mobileNumber?.phone,
                    data: [item],
                };
            }
        });

        const resultArray = Object.values(resultObject);

        return resultArray;
    } catch (error) {
        console.error("Error in processData:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = {
    fetchOutstanding,
};
