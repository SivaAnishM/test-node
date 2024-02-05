const { v4: uuidv4 } = require("uuid");

const { dbIndexSchema } = require("../model/dbIndex");
const { connectToDatabaseAndSwitch } = require("./dynamicDBcreateAndSwitch");

const checkAndCreateDb = async (req, res) => {
    try {
        const { companyNameAsTally, CLPCode } = req.query; // CLP = companyName_licenseNumber_phoneNumber
        const rootDb = connectToDatabaseAndSwitch("users");
        const rootDbIndexModel = rootDb.model("dbindex", dbIndexSchema);

        const checkCLPexist = await rootDbIndexModel.findOne({
            uniqueCompanyName: CLPCode,
        });

        // console.log(checkCLPexist, "checkCLPexist===================>");

        if (checkCLPexist?.isDeleted === true) {
            await rootDbIndexModel.findOneAndUpdate(
                { uniqueCompanyName: CLPCode },
                { $set: { isDeleted: false } },
                { new: true }
            );
        }

        if (checkCLPexist) {
            return res.status(200).json({
                status: true,
                msg: "Company already exists",
                data: checkCLPexist,
            });
        }

        const uniqueID = generateUniqueID();
        const dbName = `ac_${uniqueID}`;

        const obj = {
            dbName: dbName,
            uniqueCompanyName: CLPCode,
            tallyCompanyName: companyNameAsTally,
            isDeleted: false,
        };

        const newDbIndex = await rootDbIndexModel.create(obj);

        return res.status(200).json({
            status: true,
            msg: "Company created successfully",
            data: newDbIndex,
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message,
        });
    }
};

const generateUniqueID = () => {
    const uuid = uuidv4().slice(0, 6);
    return uuid;
};

module.exports = { checkAndCreateDb };