const { configSchema } = require("../../src/model/config");
const errorHandler = require("../../src/errorhandler/error");
const {
  connectToDatabaseAndSwitch,
} = require("../../src/util/dynamicDBcreateAndSwitch");
const { dbNameFromCLPCode } = require("../util/dbNameFromCLPCode");

const createDashBoardConfig = async (req, res) => {
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
    const db = connectToDatabaseAndSwitch(dbName);
    const dashBoardConfigModel = db.model("config", configSchema);
    const data = req.body;
    if (Object.keys(data).length === 0) {
      return res.status(400).send({
        status: false,
        message: "provide all data.",
      });
    }

    const dashBoardConfigData = await dashBoardConfigModel.create(data);

    return res.status(201).send({
      status: true,
      message: "Dashboard config creatred successfully.",
      data: dashBoardConfigData,
    });
  } catch (error) {
    return errorHandler(error, res);
  }
};
const getAllDashBoardConfig = async () => {
  try {
    // console.log("entered");
    const db = connectToDatabaseAndSwitch("users");
    const dashBoardConfigModel = db.model("configs", configSchema);
    const data = await dashBoardConfigModel.findOne({ configId: 222 });
    // console.log(data, "data");
    // if (!data) {
    //   return res.status(204).send({
    //     status: false,
    //     error: "No data found",
    //   });
    // }
    return data;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getConfigById = async (req, res) => {
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
    const db = connectToDatabaseAndSwitch(dbName);
    const dashBoardConfigModel = db.model("config", configSchema);
    const configId = +req.params.configId;
    if (!configId) {
      return res.status(400).send({
        status: false,
        message: "please send configId in params.",
      });
    }
    const configData = await dashBoardConfigModel.findOne({ configId });
    if (!configData) {
      return res.status(204).send({
        status: false,
        message: `no config found with configId : ${configId}.`,
      });
    }
    return res.status(200).send({
      status: true,
      message: `config with Id ${configId} fetched successfulIy.`,
      data: configData,
    });
  } catch (error) {
    return errorHandler(error, res);
  }
};

const updateConfig = async (req, res) => {
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
    const db = connectToDatabaseAndSwitch(dbName);
    const dashBoardConfigModel = db.model("config", configSchema);

    const configId = +req.params.configId;

    const bodyData = req.body;
    if (Object.keys(bodyData).length === 0) {
      return res.status(400).send({
        status: false,
        message: "provide some data to update.",
      });
    }

    const configData = await dashBoardConfigModel.findOneAndUpdate(
      { configId: configId },
      bodyData,
      { new: true }
    );

    if (!configData) {
      return res.status(204).send({
        status: false,
        message: "No config data found",
      });
    }

    return res.status(200).send({
      status: true,
      message: `config with id ${configId} updated.`,
      data: configData,
    });
  } catch (error) {
    return errorHandler(error, res);
  }
};

const deleteConfig = async (req, res) => {
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
    const db = connectToDatabaseAndSwitch(dbName);
    const dashBoardConfigModel = db.model("config", configSchema);
    const configId = +req.params.configId;

    const configData = await dashBoardConfigModel.deleteOne({
      configId: configId,
    });

    if (!configData) {
      return res.status(204).send({
        status: false,
        message: "No config data found",
      });
    }

    return res.status(200).send({
      status: true,
      message: `config with id ${configId} deleted.`,
    });
  } catch (error) {
    return errorHandler(error, res);
  }
};

module.exports = {
  createDashBoardConfig,
  getAllDashBoardConfig,
  getConfigById,
  updateConfig,
  deleteConfig,
};
