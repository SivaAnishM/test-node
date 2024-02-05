const { versionSchema } = require("../../model/version");
const {
  connectToDatabaseAndSwitch,
} = require("../../util/dynamicDBcreateAndSwitch");

const getCurrentVersion = async (req, res) => {
  const rootDb = connectToDatabaseAndSwitch("users");
  const versionModel = rootDb.model("version", versionSchema);

  const getData = await versionModel.find();

  return res.status(201).send({
    data: getData,
  });
};

module.exports = { getCurrentVersion };
