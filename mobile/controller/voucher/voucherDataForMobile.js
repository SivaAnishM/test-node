const moment = require("moment");
const {
    connectToDatabaseAndSwitch,
} = require("../../../src/util/dynamicDBcreateAndSwitch");
const { bufferSchema } = require("../../../src/model/buffer");
const { userSchema } = require("../../../src/model/user");
const { connect } = require("../../../src/util/clientConnection");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

//-----------------------------------ADD VOUCHER----------------------------//

const addVoucher = async (req, res) => {
    try {
        const addVoucherPermission = req.addVoucherPermission;
        const voucherData = req.body;
        const voucherType = voucherData.childrenVoucherType;
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

        if (addVoucherPermission[voucherType]) {
            const db = connectToDatabaseAndSwitch(dbName);
            const bufferModel = db.model("buffer", bufferSchema);

            if (Object.keys(voucherData).length === 0) {
                return res.status(400).send({
                    status: false,
                    message: "Request body can not be empty.",
                });
            }

            //ROOT DB CREATION
            const rootDb = connectToDatabaseAndSwitch("users");
            const rootUserModel = rootDb.model("user", userSchema);

            const decodedToken = req.token;
            const userIdfrmTkn = decodedToken.userId;
            const checkAdmin = await rootUserModel.findById({
                _id: userIdfrmTkn,
            });

            if (!checkAdmin) {
                return res.status(500).json({ message: "Permission Denied" });
            }

            voucherData.createdBy = userIdfrmTkn;

            const storeData = await bufferModel.create(voucherData);

            return res.status(201).send({
                status: true,
                message: "Data added in voucher",
                data: storeData,
            });
        } else {
            return res.status(403).send({
                status: false,
                message: "Access Denied",
            });
        }
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

//-----------------------------------SEND VOUCHER FOR DAYBOOK PAGE----------------------------------//

const VoucherForDayBook = async (req, res) => {
    try {
        let { fromDate, toDate, companyName } = req.query;
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

        let voucherData =
            await companyDb.query(`select v.guid , v.party_name, v.date, v.voucher_number, v.voucher_type, 
            b.amount, b.ledger from ${dbName}.trn_voucher as v 
        inner join ${dbName}.trn_accounting as b on b.guid = v.guid
        where v.date between '${fromDate}' and '${toDate}'
        and v.party_name != b.ledger
        order by v.date;`);

        const formattedData = formatData(voucherData.rows);

        return res.status(200).send({
            count: formattedData.length,
            data: formattedData,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

function formatData(inputData) {
    const formattedData = inputData.map((item) => ({
        guid: item.guid,
        ledgerName: item.party_name,
        ledger: item.ledger,
        date: moment(item.date).format("DD MMM YY"),
        amount: Math.abs(parseFloat(item.amount)),
        voucherNumber: item.voucher_number,
        voucherName: item.voucher_type,
    }));
    return formattedData;
}

module.exports = {
    addVoucher,
    VoucherForDayBook,
};
