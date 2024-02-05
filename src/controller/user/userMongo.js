//PAKAGE & MODULE IMPORT
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { userSchema } = require("../../model/user");
const { sessionSchema } = require("../../model/sessionModel");
const {
  getAllDashBoardConfig,
} = require("../../../mobile/controller/dashBoardConfig");
const {
  connectToDatabaseAndSwitch,
} = require("../../util/dynamicDBcreateAndSwitch");
const { fetchPermissionConfig } = require("../config/permissionConfig");
const { default: axios } = require("axios");
const logger = require("../../../logger/logger");
const { syncedCompanySchema } = require("../../model/syncedCompanyModel");
const { dbNameFromCLPCode } = require("../../../mobile/util/dbNameFromCLPCode");
const SecretKey = process.env.JWT_PASSWORD;

//--------------------------------------->SIGNUP<---------------------------------------------------------//
//FOR BOTH CONNECTOR MOBILE
const signUp = async (req, res) => {
  try {
    let { name, email, phoneNumber, password } = req.body;

    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).send({
        status: false,
        message: "please provide all the fields",
      });
    }

    const rootUserDb = connectToDatabaseAndSwitch("users");
    const rootUserModel = rootUserDb.model("user", userSchema);

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailCheck = await rootUserModel.find({ email });
    if (emailCheck.length !== 0) {
      logger.error("Email already exist", { email });
      return res.status(400).json({ message: "Email already exist" });
    }

    const phoneCheck = await rootUserModel.find({ phoneNumber });
    if (phoneCheck.length !== 0) {
      logger.error("Phone number already exist", { phoneNumber });
      return res.status(400).json({ message: "Phone number already exist" });
    }

    const userInfo = {
      name,
      userName: name,
      email,
      phoneNumber,
      password: hashedPassword,
      allowedDevices: 1,
      devices: [],
      company: [],
      lastSyncedTime: [],
      connectors: [],
    };

    const newUser = await rootUserModel.create(userInfo);
    logger.info("User registered successfully", { newUser });
    return res.status(201).json({
      message: "User registered successfully",
      Data: newUser,
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << signUp >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};

//--------------------------------------->RESISTER<-------------------------------------------------------//
const registerInvitedUser = async (req, res) => {
  const { email } = req.query;
  res.render("registerinvite", { email });
};

//--------------------------------------->EMAIL VERIFY<---------------------------------------------------//
//VERIFY FOR BOTH CONNECTOR AND MOBILE
const emailVerify = async (req, res) => {
  const { email, password } = req.body;
  try {
    const rootDb = connectToDatabaseAndSwitch("users");
    const rootDbUserModel = rootDb.model("users", userSchema);
    const user = await rootDbUserModel.findOne({ email });
    if (!user) {
      logger.error("Authentication failed , incorrect email", { email });
      return res.status(401).json({ message: "Authentication failed" });
    }
    if (!password)
      return res.status(400).send({
        status: false,
        message: "password is required",
      });
    if (user.password === undefined) {
      return res.status(400).send({
        status: false,
        message: "user is invited but not registed yet please register first",
      });
    }
    let checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      logger.error("Authentication failed , incorrect password", { email });
      return res.status(401).send({
        status: false,
        message: "Incorrect Password.", // Send error response if password does not match
      });
    }
    logger.info("User email successfully verified", { email });
    return res
      .status(200)
      .json({ auth: true, message: "authenticated successfully" });
  } catch (error) {
    logger.error(
      "Internal server error in function << emailVerify >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};

//--------------------------------------->PHONE VERIFY<---------------------------------------------------//
//THIS IS FOR BOTH CONNECTOR AND MOBILE
const mobileVerify = async (req, res) => {
  try {
    const { email, phoneNumber, deviceInfo } = req.body;
    const rootDb = connectToDatabaseAndSwitch("users");
    const rootDbUserModel = rootDb.model("users", userSchema);

    const user = await rootDbUserModel.findOne({ email, phoneNumber });
    if (!user) {
      logger.error("Authentication failed , incorrect mobile number", {
        email,
        phoneNumber,
        deviceInfo,
      });
      return res.status(401).json({ message: "Authentication failed" });
    }

    if (user.devices.length === 0) {
      const newDevice = await rootDbUserModel.findByIdAndUpdate(
        //check device exist
        { _id: user._id },
        { $push: { devices: deviceInfo } },
        { new: true }
      );

      const token = jwt.sign(
        { userId: user._id, deviceInfo: deviceInfo },
        SecretKey,
        {
          expiresIn: "30d", // Token expiration time
        }
      );
      logger.info(
        "New device added with email and phone and user logged in successfully",
        { email, phoneNumber, deviceInfo }
      );
      return res.status(200).json({
        status: true,
        token,
        user: newDevice,
      });
    }

    if (user.devices.length === user.allowedDevices) {
      if (
        user.devices.some((obj) => obj.deviceModel === deviceInfo.deviceModel)
      ) {
        const token = jwt.sign(
          { userId: user._id, deviceInfo: deviceInfo },
          SecretKey,
          {
            expiresIn: "30d", // Token expiration time
          }
        );
        logger.info(
          "user device have previously logged in so user logged in successfully",
          { email, phoneNumber, deviceInfo }
        );
        return res.status(200).json({
          status: true,
          token,
          user: user,
        });
      } else {
        logger.info("user need to purchase the device", {
          email,
          phoneNumber,
          deviceInfo,
        });
        return res.status(400).json({
          auth: false,
          message: "You need to purchase this device.",
          devices: user.devices,
        });
      }
    } else if (user.devices.length < user.allowedDevices) {
      if (
        user.devices.some((obj) => obj.deviceModel === deviceInfo.deviceModel)
      ) {
        const token = jwt.sign(
          { userId: user._id, deviceInfo: deviceInfo },
          SecretKey,
          {
            expiresIn: "30d", // Token expiration time
          }
        );
        logger.info("user prchased this device previously", {
          email,
          phoneNumber,
          deviceInfo,
        });
        return res.status(200).json({
          status: true,
          token,
          user: user,
        });
      } else {
        const addedDevice = await rootDbUserModel.findByIdAndUpdate(
          //check device exist
          { _id: user._id },
          {
            $push: {
              devices: deviceInfo,
            },
          },
          { new: true }
        );

        const token = jwt.sign(
          { userId: user._id, deviceInfo: deviceInfo },
          SecretKey,
          {
            expiresIn: "30d", // Token expiration time
          }
        );
        logger.info(
          "user already purchased a device and now logging with that one",
          { email, phoneNumber, deviceInfo }
        );
        return res.status(200).json({
          status: true,
          token,
          user: addedDevice,
        });
      }
      // return res.send({err : "error"})
    } else {
      logger.info("user need to purcahse a device", {
        email,
        phoneNumber,
        deviceInfo,
      });
      return res.status(400).json({
        auth: false,
        message: "You need to purchase this device.",
        devices: user.devices,
      });
    }
  } catch (error) {
    logger.error(
      "Internal server error in function << mobileVerify >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).send({ error: error.message });
  }
};

//--------------------------------------->CONNECTOR LOGIN MULTY USER ALLOWED<-----------------------------//
const connectorLogin = async (req, res) => {
  try {
    const { email, phoneNumber, deviceInfo } = req.body;
    const rootDb = connectToDatabaseAndSwitch("users");
    const rootDbUserModel = rootDb.model("users", userSchema);

    const user = await rootDbUserModel.findOne({ email, phoneNumber });
    if (!user) {
      logger.error("Authentication failed , incorrect mobile number", {
        email,
        phoneNumber,
        deviceInfo,
      });
      return res.status(401).json({ message: "Authentication failed" });
    }
    const userId = new mongoose.Types.ObjectId(user._id);

    const userModel = connectToDatabaseAndSwitch("users").model("user", userSchema);
    const userData = await userModel.findById(userId).lean();
    const rootDbSyncedCompanyModel = userModel.db.model("syncedcompany", syncedCompanySchema);
    const companies = userData.company;
    const companiesInfo = await Promise.all(
      companies.map(async (company) => {
        return rootDbSyncedCompanyModel.findOne({ companyName: company }).lean();
      })
    );

    // const existingSession = await sessionModel.findOne({
    //   userId: userId,
    //   isActive: true,
    // });

    // if (existingSession) {
    //   if (existingSession.deviceInfo.deviceModel === deviceInfo.deviceModel) {
    //     const token = jwt.sign(
    //       { userId: userId, deviceInfo: deviceInfo },
    //       SecretKey,
    //       {
    //         expiresIn: "30d", // Token expiration time
    //       }
    //     );
    //     return res.status(200).json({
    //       status: true,
    //       token,
    //       user: user,
    //     });
    //   } else {
    //     return res.status(409).json({
    //       message: "Session active on another device",
    //       deviceInfo: existingSession.deviceInfo.deviceName,
    //     });
    //   }
    // } else {
    //   const sessionData = {
    //     userId,
    //     deviceInfo,
    //     isActive: true,
    //   };
    //   await sessionModel.create(sessionData);

    //   // Generate and sign a JWT token
    //   const token = jwt.sign(
    //     { userId: userId, deviceInfo: deviceInfo },
    //     SecretKey,
    //     {
    //       expiresIn: "30d", // Token expiration time
    //     }
    //   );
    //   return res.status(200).json({
    //     status: true,
    //     token,
    //     user: user,
    //   });
    // }

    const token = jwt.sign(
      { userId: userId, deviceInfo: deviceInfo },
      SecretKey,
      {
        expiresIn: "30d", // Token expiration time
      }
    );
    logger.info("user logged in successfully in connector", {
      email,
      phoneNumber,
      deviceInfo,
    });
    return res.status(200).json({
      status: true,
      token,
      user: user,
      companiesInfo
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << connectorLogin >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).send({ error: error.message });
  }
};

//--------------------------------------->FORCE LOGIN<----------------------------------------------------//
const forceLogin = async (req, res) => {
  try {
    const { email, phoneNumber, ownDeviceInfo, removeDeviceInfo } = req.body;
    const rootDb = connectToDatabaseAndSwitch("users");
    const rootDbUserModel = rootDb.model("users", userSchema);

    const user = await rootDbUserModel.findOne({ email, phoneNumber });
    if (!user) {
      logger.error("Authentication failed , incorrect mobile number", {
        email,
        phoneNumber,
        ownDeviceInfo,
      });
      return res.status(401).json({ message: "Authentication failed" });
    }

    const userId = user._id;

    // const pullQuery = removeDeviceInfo.map(obj => ({ id: obj.id, name: obj.name }));

    await rootDbUserModel.findByIdAndUpdate(
      { _id: userId },
      { $pull: { devices: { $in: removeDeviceInfo } } },
      { new: true }
    );

    const updatedUser = await rootDbUserModel.findByIdAndUpdate(
      { _id: userId },
      { $push: { devices: ownDeviceInfo } },
      { new: true }
    );

    const token = jwt.sign(
      { userId: userId, deviceInfo: ownDeviceInfo },
      SecretKey,
      {
        expiresIn: "30d", // Token expiration time
      }
    );
    logger.info("user force loggedin successfully through mobile", {
      email,
      phoneNumber,
      ownDeviceInfo,
    });
    return res.status(200).json({
      status: true,
      token,
      user: updatedUser,
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << forceLogin >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).send({
      status: false,
      error: error.message,
    });
  }
};

//--------------------------------------->UPDATE OF USER AFTER SYNC<--------------------------------------//
//THIS IS FOR BOTH CONNECTOR AND MOBILE
const updateUserOnSync = async (req, res) => {
  try {
    const { companyName, CLPCode } = req.query;
    if (!companyName || !CLPCode) {
      return res.status(400).send({
        status: false,
        message: "need company name and CLPCode in request",
      });
    }
    let { email, machineId, tally_companyInfo, permissions } = req.body;
    if (!email) {
      return res.status(400).send({
        status: false,
        message: "please provide email in body.",
      });
    }
    console.log(machineId, "machineId");
    if (!machineId) {
      return res.status(400).send({
        status: false,
        message: "please provide machineId in body.",
      });
    }
    let key = CLPCode;

    const rootDb = connectToDatabaseAndSwitch("users");

    const rootDbUserModel = rootDb.model("users", userSchema);
    const emailCheck = await rootDbUserModel.findOne({ email: email });
    if (!emailCheck) {
      return res.status(400).send({
        status: false,
        message: `no user found with email ${email} in root db.`,
      });
    }

    const rootDbSyncedCompanyModel = rootDb.model(
      "syncedcompany",
      syncedCompanySchema
    );
    const checkCompanyAlreadyExist = await rootDbSyncedCompanyModel.findOne({
      companyName: key,
      "tally_companyInfo.GUID": tally_companyInfo.GUID,
    });

    const obj = {
      dbName: companyName,
      companyName: key,
      syncedByEmail: email,
      syncedByUserId: emailCheck._id,
      syncData : true,
      autoImportVoucher : true,
      tally_companyInfo,
    };
    if (!checkCompanyAlreadyExist) {
      console.log("company not exist in root db");
      await rootDbSyncedCompanyModel.create(obj);
    }

    if (emailCheck.company.includes(key)) {
      return res.status(200).send({
        msg: "not first time sync",
      });
    }
    const filter = { email };
    const update = {
      $push: {
        company: key,
        lastSyncedTime: {
          companyName: key,
          time: tally_companyInfo.lastSynced,
        },
      },
    };
    const rootDbUser = await rootDbUserModel.findOneAndUpdate(filter, update, {
      new: true,
    });

    const checkConnectorExists = await rootDbUserModel.findOne({
      email: email,
      "connectors.machineId": machineId,
    });

    if (!checkConnectorExists) {
      await rootDbUserModel.findOneAndUpdate(
        { email: email },
        {
          $push: {
            connectors: {
              machineId: machineId,
              companies: [key],
            },
          },
        },
        { new: true }
      );
    } else {
      const checkCompanyUnderConnector = await rootDbUserModel.findOne({
        email: email,
        connectors: {
          $elemMatch: {
            machineId: machineId,
            companies: key,
          },
        },
      });
      if (!checkCompanyUnderConnector) {
        await rootDbUserModel.updateOne(
          {
            email: email,
            connectors: {
              $elemMatch: {
                machineId: machineId,
              },
            },
          },
          {
            $push: {
              "connectors.$.companies": key,
            },
          },
          { new: true }
        );
      } else {
        console.log("company already exist under connector===========>");
      }
    }

    const configData = await getAllDashBoardConfig();
    permissions.dashBoardConfig = configData.dashboardTileConfig;
    const userData = {
      name: rootDbUser.name,
      userName: rootDbUser.name,
      email: rootDbUser.email,
      phoneNumber: rootDbUser.phoneNumber,
      key: key,
      dbName: companyName,
      companyData: tally_companyInfo,
      permissions: permissions,
      userDashboardConfig: configData.dashboardTileConfig,
    };
    const companyDb = connectToDatabaseAndSwitch(companyName);

    const companyDbUserModel = companyDb.model("users", userSchema);

    const companyDbUser = await companyDbUserModel.create(userData);

    logger.info("user updated successfully after sync", {
      email,
      key
    });
    return res.status(200).send({
      status: true,
      msg: "Both rootdb and companydb updated",
      rootDbData: rootDbUser,
      companyDbData: companyDbUser,
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << updateUserOnSync >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).send({
      status: false,
      error: error.message,
    });
  }
};

//--------------------------------------->FETCH USER BY THEIR MAIL<----------------------------------------//
//THIS IS FOR MOBILE ONLY
const fetchUserFromCompany = async (req, res) => {
  try {
    const { companyName, email } = req.query;
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

    if (!email) {
      return res.status(400).send({
        status: false,
        message: "please provide email in query.",
      });
    }

    const companyDb = connectToDatabaseAndSwitch(dbName);
    const companyDbUserModel = companyDb.model("users", userSchema);

    const userData = await companyDbUserModel.findOne({ email: email });

    const convertedPermission = convertUnderscoreToDot(userData.permissions);

    const responseData = {
      ...userData.toObject(),
      permissions: convertedPermission,
    };

    if (!userData) {
      return res.status(204).send({
        msg: `user not exist in company db with email ${email}`,
      });
    }

    return res.status(200).send({
      status: true,
      data: responseData,
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << fetchUserFromCompany >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).send({
      status: false,
      error: error.message,
    });
  }
};

//--------------------------------------->FETCH ALL USER<-------------------------------------------------//
//THIS IS FOR MOBILE ONLY
const fetchAllUserFromCompany = async (req, res) => {
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
    const companyDbUserModel = companyDb.model("users", userSchema);

    const allusers = await companyDbUserModel.find();

    if (allusers.length === 0) {
      return res.status(204).send({
        status: false,
        msg: `no user fount under company --> ${companyName}. `,
      });
    }

    return res.status(200).send({
      status: true,
      msg: `${allusers.length} users exist.`,
      data: allusers,
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << fetchAllUserFromCompany >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).send({
      status: false,
      error: error.message,
    });
  }
};

//--------------------------------------->FETCH USER data<------------------------------------------------//
const fetchUserData = async (req, res) => {
  try {
    const decodedToken = req.token;
    const userIdFromToken = decodedToken.userId;

    const userModel = connectToDatabaseAndSwitch("users").model("user", userSchema);
    const rootDbSyncedCompanyModel = userModel.db.model("syncedcompany", syncedCompanySchema);

    const userData = await userModel.findById(userIdFromToken).lean();
    if (!userData) {
      return res.status(404).send({
        msg: `No user found with token id.`,
      });
    }

    const companies = userData.company;

    const companiesInfo = await Promise.all(
      companies.map(async (company) => {
        return rootDbSyncedCompanyModel.findOne({ companyName: company }).lean();
      })
    );

    return res.status(200).send({
      status: true,
      msg: "Fetch user details successfully",
      data: { userData, companiesInfo },
    });
  } catch (err) {
    logger.error(
      "Internal server error in function << fetchUserData >> in userMongo.js",
      { error: err.message }
    );
    return res.status(500).json({
      status: false,
      error: err.message,
      msg: "Internal server error"
    });
  }
};

//--------------------------------------->ADD USER (ONLY ADMIN CAN DO THIS)<------------------------------//
//THIS IS FOR MOBILE ONLY
const addUser = async (req, res) => {
  let rootUserModel
  let companyUserModel
  let rootuserInfo
  let userData
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
    let { userName, email } = req.body;
    let bodyData = req.body;
    const decodedToken = req.token;
    const permissionConfig = await fetchPermissionConfig("666", dbName);
    const configData = await getAllDashBoardConfig();

    const permissionObj = permissionConfig.permissions;
    permissionObj.isOwner = false;
    permissionObj.isDevice = false;
    permissionObj.isRegister = false;
    permissionObj.isAdmin = true;
    permissionObj.dashBoardConfig = configData.dashboardTileConfig;

    bodyData.permissions = permissionObj;
    bodyData.userDashboardConfig = permissionObj.dashBoardConfig;

    //ROOT DB CREATION
    const rootDb = connectToDatabaseAndSwitch("users");
    rootUserModel = rootDb.model("user", userSchema);

    //COMPANY DB CONNECTION
    const companyDb = connectToDatabaseAndSwitch(dbName);
    companyUserModel = companyDb.model("user", userSchema);

    //CHECK EMAIL EXIST IN COMPANY DB
    const emailCheckInCompanyDb = await companyUserModel.findOne({ email });
    if (emailCheckInCompanyDb) {
      return res.status(400).json({ message: "Email already exist" });
    }

    //Only Admin can add new user (userId extract from headers TOKEN)
    const userIdfrmTkn = decodedToken.userId;
    const userFrmRootDb = await rootUserModel.findById({ _id: userIdfrmTkn });

    if (!userFrmRootDb) {
      return res.status(204).send({
        msg: `No user found with token id.`,
      });
    }
    let emailFromRoot = userFrmRootDb.email;
    const checkAdmin = await companyUserModel.findOne({
      email: emailFromRoot,
      "permissions.isAdmin": true,
    });

    if (!checkAdmin) {
      return res.status(500).json({ message: "Permission Denied" });
    }
    let companyData = checkAdmin.companyData;
    bodyData.companyData = companyData;
    bodyData.key = companyName;
    userData = await companyUserModel.create(bodyData);
    const lastSyncTimeArr = userFrmRootDb.lastSyncedTime;
    const lastSyncTimeOfThisCompany = lastSyncTimeArr.filter(comp => comp.companyName === companyName);

    //Create user in root db
    const checkDb = await rootUserModel.findOne({ email: email });
    if (!checkDb) {
      console.log("user not in root db");
      let data = {
        userName: userName,
        email: email,
        allowedDevices: 1,
        devices: [],
        company: [companyName],
        lastSyncedTime: [lastSyncTimeOfThisCompany[0]],
      };
      rootuserInfo = await rootUserModel.create(data);

      logger.info("user added successfully in root db and email invitaion is sent.", { email, companyName });

      const emailinvite = await axios.post(
        "https://l72sbnerl3twl355dtx3sfzfmi0frhga.lambda-url.ap-south-1.on.aws",
        {
          email: email,
          link: `https://tally-mob-auth.netlify.app/?email=${email}&companyName=${companyName}`,
        }
      );
      // console.log(emailinvite, "emailinvite");
    } else {
      await rootUserModel.findByIdAndUpdate(
        { _id: checkDb._id },
        {
          $push: {
            company: companyName,
            lastSyncedTime: lastSyncTimeOfThisCompany[0]
          }
        },
        { new: true }
      );

      await companyUserModel.findOneAndUpdate(
        { email: email },
        { $set: { "permissions.isRegister": true } },
        { new: true }
      )

      logger.info("company pushed in company array of this existing users document and email sent as added to company ", { email, companyName });

      const emailinvite = await axios.post(
        "https://l72sbnerl3twl355dtx3sfzfmi0frhga.lambda-url.ap-south-1.on.aws",
        {
          email: email,
          link: `You have been added to a company, ${companyName}`,
        }
      );
      // console.log("link sent", companyData);
    }

    // if(emailinvite.status===200){
    return res.status(200).send({
      status: true,
      msg: "Device registered successfully and invite link sent",
      data: { userData },
      link: `http://localhost:5000/user/registerinvite?email=${email}`,
    });
    // }
  } catch (err) {
    logger.error(
      "Internal server error in function << addUser >> in userMongo.js",
      { error: err.message }
    );
    if (err.response?.status === 502) {
      console.log("delete user from root db and company db");
      await rootUserModel.findByIdAndDelete({ _id: rootuserInfo._id });
      await companyUserModel.findByIdAndDelete({ _id: userData._id });
      return res.status(400).send({
        status: false,
        msg: "Invalid email address. please provide valid email address.",
      });
    }
    return res
      .status(500)
      .json({ error: err.message, msg: "Internal server error" });
  }
};

//--------------------------------------->ADD DEVICE (ONLY ADMIN CAN DO THIS)<----------------------------//
const addDevice = async (req, res) => {
  try {
    const { email, phoneNumber, deviceInfo } = req.body;
    const rootDb = connectToDatabaseAndSwitch("users");
    const rootDbUserModel = rootDb.model("users", userSchema);
    const user = await rootDbUserModel.findOne({ email, phoneNumber });
    const addedDevice = await rootDbUserModel.findByIdAndUpdate(
      { _id: user._id },
      {
        $inc: {
          allowedDevices: 1,
        },
        $push: {
          devices: deviceInfo,
        },
      },
      { new: true }
    );

    const token = jwt.sign(
      { userId: user._id, deviceInfo: deviceInfo },
      SecretKey,
      {
        expiresIn: "30d", // Token expiration time
      }
    );
    logger.info("new device added successfully", {
      email,
      phoneNumber,
      deviceInfo,
    });
    return res.status(200).json({
      status: true,
      msg: "New device added",
      token,
      user: addedDevice,
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << addDevice >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).send({
      status: false,
      error: error.message,
    });
  }
};

//--------------------------------------->Last SYNC Time<-------------------------------------------------//
const lastSyncTimeUpdate = async (req, res) => {
  try {
    const { companyName, CLPCode } = req.query;
    const companyDb = connectToDatabaseAndSwitch(companyName);
    const companyUserModel = companyDb.model("user", userSchema);

    const { lastSynced, email } = req.body;

    if (!lastSynced) {
      return res.status(400).send({
        status: false,
        error: "please provide lastsynced time in body.",
      });
    }
    await companyUserModel.findOneAndUpdate(
      { email: email },
      {
        $set: {
          "companyData.lastSynced": lastSynced,
        },
      },
      { new: true }
    );

    const rootDb = connectToDatabaseAndSwitch("users");
    const rootDbUserModel = rootDb.model("users", userSchema);
    await rootDbUserModel.updateMany(
      { company: { $in: [CLPCode] } },
      { $set: { "lastSyncedTime.$.time": lastSynced } },
      { new: true }
    );

    logger.info("last sync time updated successfully", {
      email,
      CLPCode,
      lastSynced,
    });

    return res.status(200).send({
      status: true,
      msg: "sync time updated.",
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << lastSyncTimeUpdate >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).send({
      status: false,
      error: error.message,
      msg: "Internal server error"
    });
  }
};

//--------------------------------------->Update Permission<----------------------------------------------//
const updateUserPermission = async (req, res) => {
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
    const bodyData = req.body;
    const { id, permissions } = bodyData;

    if (!bodyData) {
      return res
        .status(400)
        .send({ status: false, msg: "Please provide bodyData" });
    }

    const db = connectToDatabaseAndSwitch(dbName);
    const userModel = db.model("user", userSchema);

    const rootDb = connectToDatabaseAndSwitch("users");
    const rootModel = rootDb.model("user", userSchema);

    const decodedToken = req.token;
    const userIdfrmTkn = decodedToken.userId;

    const checkId = await rootModel.findById({ _id: userIdfrmTkn });

    const Email = checkId.email;
    const checkAccess = await userModel.findOne({
      email: Email,
      "permissions.isAdmin": true,
    });

    if (!checkAccess) {
      return res.status(400).send({
        status: false,
        msg: "You are not an admin; you can't update this.",
      });
    }

    const checkAdmin = await userModel.findById({ _id: id });

    if (checkAdmin.permissions.isOwner === true) {
      return res
        .status(400)
        .send({ status: false, msg: "You can't update admin's permission." });
    }

    try {
      // Convert dot notation to underscore notation
      const updatedPermissions = convertDotToUnderscore(permissions);
      // console.log(updatedPermissions);
      const filteredObjects = Object.fromEntries(
        Object.entries(updatedPermissions.dashBoardConfig).filter(
          ([key, value]) => !value.hidden
        )
      );

      const update = await userModel.findByIdAndUpdate(
        { _id: id },
        {
          $set: { permissions: updatedPermissions },
          userDashboardConfig: filteredObjects,
        },
        { new: true }
      );

      // Convert underscore notation back to dot notation in response
      const responsePermissions = convertUnderscoreToDot(update.permissions);

      logger.info("user permission updated successfully", {
        companyName,
        id
      });
      return res.status(200).send({
        status: true,
        msg: "Successfully updated",
        permissions: responsePermissions,
      });
    } catch (err) {
      logger.error(
        "Internal server error while updating permission in function << updateUserPermission >> in userMongo.js",
        { error: err.message }
      );
      return res
        .status(400)
        .send({ status: false, msg: "Document not found or not updated." });
    }
  } catch (err) {
    logger.error(
      "Internal server error in function << updateUserPermission >> in userMongo.js",
      { error: err.message }
    );
    return res
      .status(500)
      .json({ error: err.msg, msg: "Internal server error" });
  }
};

//--------------------------------------->DELETE USER<----------------------------------------------------//
const deleteUser = async (req, res) => {
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
    const { id } = req.body;

    const db = connectToDatabaseAndSwitch(dbName);
    const userModel = db.model("user", userSchema);

    const rootDb = connectToDatabaseAndSwitch("users");
    const rootModel = rootDb.model("user", userSchema);

    const decodedToken = req.token;
    const userIdfrmTkn = decodedToken.userId;

    const checkId = await rootModel.findOne({ _id: userIdfrmTkn });

    const Email = checkId.email;
    const checkAccess = await userModel.findOne({
      email: Email,
      "permissions.isAdmin": true,
    });
    if (!checkAccess) {
      return res
        .status(204)
        .send({ status: false, msg: "You are not admin, you can't delete." });
    }

    const checkOwner = await userModel.findById({ _id: id });
    if (!checkOwner) {
      return res
        .status(404)
        .send({ status: false, msg: "given Id not found." });
    }

    if (checkOwner.permissions.isOwner == true) {
      return res
        .status(401)
        .send({ status: false, msg: "You can't delete owner." });
    }

    const deleteUser = await userModel.findByIdAndDelete({ _id: id });
    if (deleteUser.deletedCount == 0) {
      return res.status(200).send({ status: true, msg: "User not found" });
    }
    const findRootUser = await rootModel.findOne({ email: checkOwner.email });

    let ID = findRootUser._id;
    let array = findRootUser.company;
    // Remove company from array
    let array2 = array.filter(company => company !== companyName);
    let lastSyncTimeArr = findRootUser.lastSyncedTime;
    // Remove corresponding lastSyncedTime entry
    let lastSyncTimeMove = lastSyncTimeArr.filter(entry => entry.companyName !== companyName);
    // Update the document in the MongoDB collection
    await rootModel.findByIdAndUpdate(
      { _id: ID },
      { company: array2, lastSyncedTime: lastSyncTimeMove },
      { new: true }
    );
    logger.info("user deleted successfully", {
      companyName,
      id
    });
    return res
      .status(200)
      .send({ status: true, msg: "User deleted successfully" });
  } catch (err) {
    logger.error(
      "Internal server error in function << deleteUser >> in userMongo.js",
      { error: err.message }
    );
    return res
      .status(500)
      .json({ error: err.msg, msg: "Internal server error" });
  }
};

//--------------------------------------->LOGOUT<---------------------------------------------------------//
const logOut = async (req, res) => {
  try {
    const rootDb = connectToDatabaseAndSwitch("users");
    const sessionModel = rootDb.model("session", sessionSchema);

    const decodedToken = req.token;
    const userIdfrmTkn = decodedToken.userId;
    const userId = new mongoose.Types.ObjectId(userIdfrmTkn);

    const logOutUser = await sessionModel.findOneAndDelete({ userId: userId });

    if (!logOutUser) {
      return res.status(403).send({ status: true, msg: "User not found" });
    }

    logger.info("user logged out successfully", {
      userIdfrmTkn,
    });
    return res.status(200).send({
      msg: "user logged out successfully",
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << logOut >> in userMongo.js",
      { error: error.message }
    );
    return res
      .status(500)
      .json({ error: err.msg, msg: "Internal server error" });
  }
};

//--------------------------------------->Update<---------------------------------------------------------//
const editUser = async (req, res) => {
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
    const { name } = req.body;

    if (Object.keys(req.body).length == 0) {
      return res
        .status(400)
        .send({ status: true, msg: "Provide Data which you want to update" });
    }
    const db = connectToDatabaseAndSwitch(dbName);
    const userModel = db.model("user", userSchema);

    const rootDb = connectToDatabaseAndSwitch("users");
    const rootModel = rootDb.model("user", userSchema);

    const decodedToken = req.token;
    const userIdfrmTkn = decodedToken.userId;
    const updateRootUser = await rootModel.findByIdAndUpdate(
      { _id: userIdfrmTkn },
      { $set: { name: name } },
      { new: true }
    );
    if (!updateRootUser) {
      return res.status(403).send({ status: true, msg: "User not found" });
    }
    email = updateRootUser.email;
    const updateUser = await userModel.findOneAndUpdate(
      { email: email },
      { $set: { name: name } },
      { new: true }
    );

    if (!updateUser) {
      return res.status(403).send({ status: true, msg: "User not found" });
    }
    logger.info("user updated successfully", {
      companyName,
      userIdfrmTkn
    });
    return res.status(200).send({
      msg: "user update successfully",
    });
  } catch (err) {
    logger.error(
      "Internal server error in function << editUser >> in userMongo.js",
      { error: err.message }
    );
    return res
      .status(500)
      .json({ error: err.msg, msg: "Internal server error" });
  }
};

//--------------------------------------->CHANGE PASSWORD<------------------------------------------------//
const forgotPassword = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    console.log(phoneNumber, password);
    if (Object.keys(req.body).length == 0) {
      return res.status(400).send({
        status: true,
        msg: "Provide password, which you want to update",
      });
    }
    const rootDb = connectToDatabaseAndSwitch("users");
    const rootModel = rootDb.model("user", userSchema);

    const hashedPassword = await bcrypt.hash(password, 10);
    const updateRootPassord = await rootModel.findOneAndUpdate(
      { phoneNumber: phoneNumber },
      { $set: { password: hashedPassword } },
      { new: true }
    );
    if (!updateRootPassord) {
      return res.status(403).send({ status: true, msg: "User not found" });
    }

    logger.info("user password updated successfully", {
      phoneNumber
    });

    return res.status(200).send({
      msg: "Password update successfully",
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << forgotPassword >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).send({ error: error.message, msg: "Internal server error." });
  }
};

//--------------------------------------->CHANGE PASSWORD<------------------------------------------------//
const changePassword = async (req, res) => {
  try {
    const { password, confirmPassword, oldPassword } = req.body;

    if (Object.keys(req.body).length == 0) {
      return res.status(400).send({
        status: true,
        msg: "Provide password, which you want to update",
      });
    }
    if (password !== confirmPassword) {
      return res
        .status(400)
        .send({ status: true, msg: "confirm password is not wrong" });
    }
    const rootDb = connectToDatabaseAndSwitch("users");
    const rootModel = rootDb.model("user", userSchema);

    const decodedToken = req.token;
    const userIdfrmTkn = decodedToken.userId;
    console.log(userIdfrmTkn);
    const user = await rootModel.findById({ _id: userIdfrmTkn });
    console.log(user);
    let checkPassword = await bcrypt.compare(oldPassword, user.password);
    console.log(checkPassword);
    if (!checkPassword) {
      return res.status(401).send({
        status: false,
        message: "Incorrect old Password.", // Send error response if password does not match
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updateRootPassord = await rootModel.findByIdAndUpdate(
      { _id: userIdfrmTkn },
      { $set: { password: hashedPassword } },
      { new: true }
    );
    if (!updateRootPassord) {
      return res.status(403).send({ status: true, msg: "User not found" });
    }
    logger.info("user password updated successfully", {
      userIdfrmTkn
    });
    return res.status(200).send({
      msg: "Password update successfully",
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << changePassword >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).send({ error: error.message });
  }
};

//--------------------------------------->UPDATE USER WHEN REGISTER<--------------------------------------//
const updateUserWhenRegister = async (req, res) => {
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
    if (Object.keys(req.body).length == 0) {
      return res.status(400).send({
        status: true,
        msg: "Provide password, which you want to update",
      });
    }
    const { email, name, phoneNumber, password } = req.body;
    const db = connectToDatabaseAndSwitch(dbName);
    const userModel = db.model("user", userSchema);

    const rootDb = connectToDatabaseAndSwitch("users");
    const rootModel = rootDb.model("user", userSchema);

    const hashedPassword = await bcrypt.hash(password, 10);
    const updateUserInCompanyDb = await userModel.findOneAndUpdate(
      { email: email },
      {
        $set: {
          name: name,
          phoneNumber: phoneNumber,
          "permissions.isRegister": true,
        },
      },
      { new: true }
    );

    const updateUserInRootDb = await rootModel.findOneAndUpdate(
      { email: email },
      {
        $set: {
          name: name,
          phoneNumber: phoneNumber,
          password: hashedPassword,
        },
      },
      { new: true }
    );

    logger.info("user updated successfully when register", {
      companyName,
      email
    });
    return res.status(200).send({
      companyUser: updateUserInCompanyDb,
      rootUser: updateUserInRootDb,
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << updateUserWhenRegister >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).send({ error: error.message, msg: "Internal server error." });
  }
};

//--------------------------------------->UPDATE OWN DASHBOARD CONFIG<------------------------------------//
const updateOwnDashBoardConfig = async (req, res) => {
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
    const bodyData = req.body;
    if (!bodyData) {
      return res
        .status(400)
        .send({ status: false, msg: "Please provide bodyData" });
    }
    let { id, dashBoardConfig } = bodyData;

    const db = connectToDatabaseAndSwitch(dbName);
    const userModel = db.model("user", userSchema);

    const updatedashBoardConfig = await userModel.findByIdAndUpdate(
      { _id: id },
      { $set: { userDashboardConfig: dashBoardConfig } },
      { new: true }
    );

    logger.info("user dashboard config updated successfully", {
      companyName,
      id
    });
    return res.status(200).send({
      status: true,
      data: updatedashBoardConfig,
    });
  } catch (error) {
    logger.error(
      "Internal server error in function << updateOwnDashBoardConfig >> in userMongo.js",
      { error: error.message }
    );
    return res.status(500).send({ error: error.message, msg: "Internal server error." });
  }
};

// Recursively convert dot notation to underscore notation
function convertDotToUnderscore(obj) {
  const result = {};
  for (const key in obj) {
    if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      result[key.replace(/\./g, "_")] = convertDotToUnderscore(obj[key]);
    } else {
      result[key.replace(/\./g, "_")] = obj[key];
    }
  }
  return result;
}

// Recursively convert underscore notation back to dot notation
function convertUnderscoreToDot(obj) {
  const result = {};
  for (const key in obj) {
    if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      result[key.replace(/_/g, ".")] = convertUnderscoreToDot(obj[key]);
    } else {
      result[key.replace(/_/g, ".")] = obj[key];
    }
  }
  return result;
}

//MODULE EXPORTS
module.exports = {
  registerInvitedUser,
  emailVerify,
  mobileVerify,
  connectorLogin,
  forceLogin,
  signUp,
  updateUserOnSync,
  fetchUserFromCompany,
  fetchAllUserFromCompany,
  fetchUserData,
  addDevice,
  addUser,
  deleteUser,
  updateUserPermission,
  lastSyncTimeUpdate,
  logOut,
  editUser,
  changePassword,
  updateUserWhenRegister,
  updateOwnDashBoardConfig,
  forgotPassword,
};
