const mongoose = require("mongoose");
const {
  isValidName,
  isValidMobile,
  isValidEmail,
  isValidPassword,
} = require("../validator/valid");
// const id = mongoose.Types.ObjectId

const userSchema = new mongoose.Schema({}, { strict: false });

module.exports = { userSchema };


// function createDynamicModel(dynamicName) {
//   dynamicName = `${dynamicName}_User`
//   return  mongoose.model(dynamicName, userSchema);
// }

// module.exports=mongoose.model("user", userSchema)

// name: {
//   type: String,
//   trim: true,
//   required: [false, "Please provide name."],
//   validate: {
//       validator: isValidName,
//       message: (props) => ` ${props.value} is not a valid Name!`,
//   },
//   },
// emailId: {
//   type: String,
//   trim: true,
//   required: [false, "Please provide emailID."],
//   validate: {
//       validator: isValidEmail,
//       message: (props) => ` ${props.value} is not a valid email!`,
//   },
// },
// userId:{
//   type: String,
//   trim: true,
// },
// mobileNumber: {
//     type: Number,
//     trim: true,
//     required: [false, "Please provide Mobile."],
//     validate: {
//       validator: isValidMobile,
//       message: (props) => ` ${props.value} is not a valid Mobile!`,
//   },
//   },
// // password: {
// //   type: String,
// //   trim: true,
// //   // required: [true, "Please provide Password."],
// //   // validate: {
// //   //   validator: isValidPassword,
// //   //   message: (props) => ` ${props.value} is not a valid password!`,
// // //},
// // },
// // isAdmin :{
// //   type: Boolean,
// // },
// // isUser:{
// //   type: Boolean,

// // },
// // company:{
// //   type:[],
// //   required:false
// // },
// // devices:[],
