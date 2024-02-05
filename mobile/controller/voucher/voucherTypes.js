const errorHandler = require("../../../src/errorhandler/error");
const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

//--------------------FETCH VOUCHER TYPES----------------------//

const sendvoucherTypeData = async (req, res) => {
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
        const voucherTypeData = await db.query(
            `SELECT name as "Name", parent as "Parent" FROM ${dbName}.mst_vouchertype`
        );

        if (voucherTypeData.rows.length === 0) {
            return res.status(204).send({
                status: false,
                message: "No voucherType data found in DB.",
            });
        }

        return res.status(200).send({
            status: true,
            message: `voucherTypes data fetched successfully.`,
            count: voucherTypeData.rows.length,
            data: voucherTypeData.rows,
        });
    } catch (error) {
        return errorHandler(error, res);
    }
};

const fetchChildsOfVoucherType = async (req, res) => {
    try {
        const { companyName, voucherName } = req.query;

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
        if (!voucherName) {
            return res.status(400).send({
                status: false,
                msg: "Send voucher name",
            });
        }
        // const db = await switchDB(companyName);
        const db = await connect();
        const query = await db.query(
            `SELECT name as "Name" from ${dbName}.mst_vouchertype WHERE voucher_reserved_name = $1`,
            [voucherName]
        );
        if (query.rows.length === 0) {
            return res.status(204).send({
                status: false,
                data: query.rows,
            });
        }

        return res.status(200).send({
            status: true,
            data: query.rows,
        });
    } catch (error) {
        return errorHandler(error, res);
    }
};


module.exports = {
    sendvoucherTypeData,
    fetchChildsOfVoucherType
};
