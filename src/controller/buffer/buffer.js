const { dbNameFromCLPCode } = require("../../../mobile/util/dbNameFromCLPCode");
const { bufferSchema } = require("../../model/buffer");
const {
    connectToDatabaseAndSwitch,
} = require("../../util/dynamicDBcreateAndSwitch");

const fetchBufferData = async (req, res) => {
    try {
        const { companyName } = req.query;
        console.log(companyName);
        if (!companyName) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name in query.",
            });
        }

        const companyDb = connectToDatabaseAndSwitch(companyName);
        const bufferModel = companyDb.model("buffer", bufferSchema);
        const data = await bufferModel
            .find({ isDeleted: false })
            .select({ __v: 0 });

        if (data.length === 0) {
            return res.status(200).send({
                msg: "Nothing to create",
                data: [],
            });
        }

        return res.status(200).send({
            msg: `${data.length} data found.`,
            data: data,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

const updateBufferById = async (req, res) => {
    try {
        const id = req.params.id;
        // const { pandingStatus } = req.body;
        const { companyName } = req.query;
        if (!companyName) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name in query.",
            });
        }

        const companyDb = connectToDatabaseAndSwitch(companyName);
        const bufferModel = companyDb.model("buffer", bufferSchema);

        const updateVoucher = await bufferModel.findByIdAndUpdate(
            id,
            { $set: { pendingStatus: false } },
            { new: true }
        );

        if (!updateVoucher) {
            return res.status(204).send({
                status: false,
                error: "Voucher not found",
            });
        }

        return res.status(200).send({
            status: true,
            data: updateVoucher,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

const deleteBufferById = async (req, res) => {
    try {
        const id = req.params.id;
        const { companyName } = req.query;
        if (!companyName) {
            return res.status(400).send({
                status: false,
                message: "Please provide company name in query.",
            });
        }

        const companyDb = connectToDatabaseAndSwitch(companyName);
        const bufferModel = companyDb.model("buffer", bufferSchema);

        const updateVoucher = await bufferModel.findByIdAndUpdate(
            id,
            { $set: { isDeleted: true } },
            { new: true }
        );

        if (!updateVoucher) {
            return res.status(204).send({
                status: false,
                error: "Voucher not found",
            });
        }

        return res.status(200).send({
            status: true,
            data: updateVoucher,
        });
    } catch (error) {
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

const fetchVoucherFromBufferByUserId = async (req, res) => {
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

        const companyDb = connectToDatabaseAndSwitch(dbName);
        const bufferModel = companyDb.model("buffer", bufferSchema);

        const decodedToken = req.token;
        const userIdfrmTkn = decodedToken.userId;

        const vouchersByUserId = await bufferModel.find({
            createdBy: userIdfrmTkn,
            type: "Create Voucher",
        });

        if (vouchersByUserId.length === 0) {
            return res.status(204).send({
                status: false,
                msg: "No voucher found under this user,",
                data: vouchersByUserId,
            });
        }

        return res.status(200).send({
            status: true,
            count: vouchersByUserId.length,
            msg: `${vouchersByUserId.length} vouchers found under this user`,
            data: vouchersByUserId,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

const fetchPendingVouchers = async (req, res) => {
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

        const companyDb = connectToDatabaseAndSwitch(dbName);
        const bufferModel = companyDb.model("buffer", bufferSchema);

        const decodedToken = req.token;
        const userIdfrmTkn = decodedToken.userId;

        const pendingVouchers = await bufferModel.find({
            createdBy: userIdfrmTkn,
            type: "Create Voucher",
            pendingStatus: true,
        });

        if (pendingVouchers.length === 0) {
            return res.status(204).send({
                status: false,
                msg: "No voucher found under this user,",
                data: pendingVouchers,
            });
        }

        return res.status(200).send({
            status: true,
            count: pendingVouchers.length,
            msg: `${pendingVouchers.length} vouchers found under this user`,
            data: pendingVouchers,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

const fetchCompletedVouchers = async (req, res) => {
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

        const companyDb = connectToDatabaseAndSwitch(dbName);
        const bufferModel = companyDb.model("buffer", bufferSchema);

        const decodedToken = req.token;
        const userIdfrmTkn = decodedToken.userId;

        const completedVoucher = await bufferModel.find({
            createdBy: userIdfrmTkn,
            type: "Create Voucher",
            pendingStatus: false,
        });

        if (completedVoucher.length === 0) {
            return res.status(204).send({
                status: false,
                msg: "No voucher found under this user,",
                data: completedVoucher,
            });
        }

        return res.status(200).send({
            status: true,
            count: completedVoucher.length,
            msg: `${completedVoucher.length} vouchers found under this user`,
            data: completedVoucher,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            status: false,
            error: error.message,
        });
    }
};

module.exports = {
    fetchBufferData,
    updateBufferById,
    deleteBufferById,
    fetchVoucherFromBufferByUserId,
    fetchPendingVouchers,
    fetchCompletedVouchers
};
