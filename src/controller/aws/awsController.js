const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIAT4CSULCUQRH3TGY5",
    secretAccessKey: "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",
  },
});

exports.uploadFile = async (file) => {
  try {
    const uploadParams = {
      // ACL: "public-read",
      Bucket: "jyoti-bisoi", 
      Key: `feedback/${file.originalname}`,
      Body: file.buffer,
    };

    const uploadCommand = new PutObjectCommand(uploadParams);

    const data = await s3.send(uploadCommand);
    const url = `https://${uploadParams.Bucket}.s3.amazonaws.com/${uploadParams.Key}`;
    return url;
  } catch (err) {
    throw { error: err };
  }
};
