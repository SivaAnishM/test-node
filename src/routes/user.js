const express = require("express");
const userRoute = express.Router();
const { authentication, connectorAuthentication } = require("../middleware/auth");

const {
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
  forgotPassword,
  updateUserWhenRegister,
  updateOwnDashBoardConfig,
} = require("../controller/user/userMongo");
const { sendOtpEmail, sendOtpMobile } = require("../controller/user/otp");
const { phoneFromToken } = require("../util/phoneFromToken");

//Connector
userRoute.post("/signup", signUp);
userRoute.get("/registerinvite", registerInvitedUser);
userRoute.post("/verifyemail", emailVerify);
userRoute.post("/login", mobileVerify);
userRoute.post("/connectorlogin", connectorLogin);
userRoute.post("/forcelogin", forceLogin);
userRoute.patch("/updateuser", updateUserOnSync); //updates the user in root db and places the root user in company user
userRoute.get("/fetchuserinfo", fetchUserFromCompany);
userRoute.get("/fetchcompanyusers", fetchAllUserFromCompany);
userRoute.get("/fetchuserconnector", connectorAuthentication, fetchUserData);
userRoute.get("/fetchuser", authentication, fetchUserData);
userRoute.post("/adduser", authentication, addUser);
userRoute.put("/adddevice", addDevice);
userRoute.delete("/delete", authentication, deleteUser);
userRoute.patch("/updatepermission", authentication, updateUserPermission);
userRoute.post("/adduser", authentication, addUser);
userRoute.post("/adddevice", authentication, addDevice);
userRoute.put("/updatesynctime", lastSyncTimeUpdate);
userRoute.put("/logout", connectorAuthentication, logOut);
userRoute.put("/edit", authentication, editUser);
userRoute.put("/changepassword", authentication, changePassword);
userRoute.put("/updateuserregister", updateUserWhenRegister);
userRoute.put("/updateowndashboardconfig", authentication, updateOwnDashBoardConfig);
userRoute.put("/changepassword", authentication, changePassword);
userRoute.put("/forgotpassword", forgotPassword);
userRoute.put("/updateuserregister", updateUserWhenRegister);
userRoute.get("/phone", connectorAuthentication, phoneFromToken);

//OTP
userRoute.post("/emailotp", sendOtpEmail);
userRoute.post("/mobileotp", sendOtpMobile);

module.exports = userRoute;
