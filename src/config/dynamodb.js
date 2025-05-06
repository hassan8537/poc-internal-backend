const AWS = require("aws-sdk");

AWS.config.update({
  region: process.env.REGION, // e.g., "us-east-1"
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

module.exports = { dynamodb, docClient, s3 };
