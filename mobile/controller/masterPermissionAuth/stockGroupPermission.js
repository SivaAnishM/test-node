const { userSchema } = require("../../../src/model/user");
const {
    connectToDatabaseAndSwitch,
} = require("../../../src/util/dynamicDBcreateAndSwitch");
const { dbNameFromCLPCode } = require("../../util/dbNameFromCLPCode");

const stockGroupPermissionAuthorization = async (req, res, next) => {
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
        const decodedToken = req.token;
        const userIdfrmTkn = decodedToken.userId;

        const rootDb = connectToDatabaseAndSwitch("users");
        const rootModel = rootDb.model("user", userSchema);

        const userFromRoot = await rootModel.findById({ _id: userIdfrmTkn });

        const email = userFromRoot.email;

        const companyDb = connectToDatabaseAndSwitch(dbName);
        const companyanyUserModel = companyDb.model("user", userSchema);

        const companyUser = await companyanyUserModel
            .findOne({ email: email })
            .select({ _id: 0, permissions: 1 });

        req.isOwner = companyUser.permissions.isOwner;
        req.isAdmin = companyUser.permissions.isAdmin;
        req.stockGroupPermission = companyUser.permissions.accessByStockGroup;

        next();
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: error });
    }
};

module.exports = { stockGroupPermissionAuthorization };
