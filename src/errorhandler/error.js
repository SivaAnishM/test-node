function errorHandle(error, res) {
    if (error.name == "TypeError") {
      return res.status(400).send({
        status: false,
        message: error.message,
      });
    }
    if (error.name == "ValidationError") {
      return res.status(400).send({
        status: false,
        message: error.message,
      });
    }
    if (error.code == 11000) {
      return res.status(400).send({
        status: false,
        message: `Duplicate value provided at ${Object.keys(
          error.keyValue
        )}: ${Object.values(error.keyValue)}`,
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).send({
        status: false,
        message: "JWT is expired, Please login again",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send({
        status: false,
        message: "Invalid Token, Please login again",
      });
    }
    if (error.name == "CastError") {
      return res.status(400).send({
        status: false,
        message: `please provide ${error.kind} at ${error.stringValue}`,
      });
    }
    if (error.message == "Unexpected end of JSON input") {
      return res.status(400).send({
        status: false,
        message: "please provide address in json format",
      });
    }
    if (error.message == "Unexpected token u in JSON at position 0") {
      return res.status(400).send({
        status: false,
        message: "please enter all data including address,password,email",
      });
    }
    return res.status(500).send({
      status: false,
      message: error.message,
    });
  }
  module.exports = errorHandle;