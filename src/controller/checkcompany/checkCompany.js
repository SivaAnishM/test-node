const mongoose = require("mongoose");
const { dbNameFromCLPCode } = require("../../../mobile/util/dbNameFromCLPCode");

const checkIfCompanyExists = async (req, res) => {
  const dbs = await mongoose.connection.db.admin().listDatabases();
  //   console.log("check if company exists triggered", dbs.databases);
  // res.send("check")
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
  const foundDb = dbs.databases.find((db) => db.name === dbName);
  if (foundDb) {
    console.log("db found");
    res.status(200).send({
      message: "db found",
      exists: true,
    });
  } else {
    res.status(200).send({
      message: "db not found",
      exists: false,
    });
  }
  //   console.log(dbName);

  //   res.send(dbName);
};

module.exports = { checkIfCompanyExists };
