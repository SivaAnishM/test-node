const { default: axios } = require("axios");

const sendOtpEmail =async (req, res) => {
  try {
    const {email} = req.body;
    const response = await axios.post(
      "https://qzzqcoxoezfwbzj5j3szy6jkmi0gfcld.lambda-url.ap-south-1.on.aws/",
      {"email":email}
    );
    console.log(response.status,response.data)
    if(response.status === 200){
        res.json({otp:response.data.otp})
    }

  } catch (error) {
    console.log(error);
  }
};


const sendOtpMobile =async (req, res) => {
  try {
    const response = await axios.post(
      "https://56qqnwalnlsthc4ee3wd2nrs7i0flmqz.lambda-url.ap-south-1.on.aws/",
      req.body
    );
    if(response.status === 200){
        res.json({otp:response.data.otp})
    }

  } catch (error) {
    console.log(error);
  }
};
module.exports = { sendOtpEmail, sendOtpMobile };
