const e = require("cors");
const { dbIndexSchema } = require("../../src/model/dbIndex");
const { connectToDatabaseAndSwitch } = require("../../src/util/dynamicDBcreateAndSwitch");

const dbNameFromCLPCode = async (clpCode) => {
    try {
        if (!clpCode) return null;
        const rootDb = connectToDatabaseAndSwitch("users");
        const rootDbIndexModel = rootDb.model("dbindex", dbIndexSchema);

        const checkCLPexist = await rootDbIndexModel.findOne({
            uniqueCompanyName: clpCode,
            isDeleted: false,
        });

        if (checkCLPexist) {
            return checkCLPexist.dbName;
        } else {
            return null;
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message,
        });
    }
};

module.exports = { dbNameFromCLPCode };