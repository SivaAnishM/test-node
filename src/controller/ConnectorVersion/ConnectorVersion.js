const { connectorVersionSchema } = require("../../model/connectorVersion");
const {
  connectToDatabaseAndSwitch,
} = require("../../util/dynamicDBcreateAndSwitch");

const getCurrentConnectorVersion = async (req, res) => {
  const rootDb = connectToDatabaseAndSwitch("users");
  const connectorVersionModel = rootDb.model(
    "connectorversion",
    connectorVersionSchema
  );

  const getConnectorData = await connectorVersionModel.find();
  console.log(getConnectorData, "connectorVersion");
  return res.status(201).send({
    data: getConnectorData,
  });
};

module.exports = { getCurrentConnectorVersion };
