const { feedbackSchema } = require("../../model/feedback");
const { uploadFile } = require("../aws/awsController");
const {
connectToDatabaseAndSwitch,
} = require("../../util/dynamicDBcreateAndSwitch");


const feedback = async (req, res) => {
   try{
    const {description, name, email } = req.body;
   
    const rootUserDb = connectToDatabaseAndSwitch("users");
    const rootfeedbackModel = rootUserDb.model("feedback",feedbackSchema );
    const file = req.files;
    console.log(file); 
    let location = "";
    if (file && file.length > 0) {
      try {
        location = await uploadFile(file[0]); 
        console.log("File uploaded to aws successfully: ", location);
        console.log(typeof location);
        const Data = {
         message: description,
         name : name,
         email : email,
         picture: location
        };
        const data = await rootfeedbackModel.create(Data);
        
        return res.status(201).send({msg: "Successfully feedback uploaded", data: data});
      } catch (error) {
        console.error("Error uploading file: ", error);
      };
    } else {
      const Data = {
        message: description,
        name : name,
        email : email,
      };
        const data = await rootfeedbackModel.create(Data);
        return res.status(201).send({msg: "Successfully feedback uploaded", data : data});
    };
   } catch (error) {
    console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };


module.exports={feedback};