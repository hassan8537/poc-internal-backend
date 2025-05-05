const { handlers } = require("../utilities/handlers/handlers");
const { docClient, s3 } = require("../config/dynamodb");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

class RoomService {
  constructor() {
    this.tableName = "Rooms";
    this.s3BucketName = "uploads-476114132237"; // Set your S3 bucket name here
  }

  // Upload a video to S3
  async uploadVideoToS3(req, res) {
    // Get the file from the 'videos' field
    const file = req.files?.videos?.[0];

    if (!file) {
      return handlers.response.error({
        res,
        message: "No video file provided"
      });
    }

    const localFilePath = file.path; // Get the path of the file saved locally
    const fileKey = `rooms/${uuidv4()}.mp4`; // Generate a unique key for the video on S3

    // Read the file as a buffer
    fs.readFile(localFilePath, async (err, data) => {
      if (err) {
        return handlers.response.error({
          res,
          message: "Failed to read the file",
          error: err.message
        });
      }

      // Define S3 upload parameters
      const params = {
        Bucket: this.s3BucketName,
        Key: fileKey,
        Body: data, // Buffer of the file read from disk
        ContentType: file.mimetype,
        ACL: "public-read" // Make the file publicly accessible
      };

      try {
        // Upload the file to S3
        const uploadResult = await s3.upload(params).promise();

        // Delete the local file after uploading to S3
        fs.unlink(localFilePath, (err) => {
          if (err) {
            console.error("Failed to delete local file:", err);
          }
        });

        // Return the URL of the uploaded file on S3
        return handlers.response.success({
          res,
          message: "Video uploaded successfully",
          data: { url: uploadResult.Location }
        });
      } catch (error) {
        console.error(error);

        // Delete the local file if upload fails
        fs.unlink(localFilePath, (err) => {
          if (err) {
            console.error("Failed to delete local file:", err);
          }
        });

        return handlers.response.error({
          res,
          message: "Failed to upload video to S3",
          error: error.message
        });
      }
    });
  }

  // Create a new room (video URL will be passed from the upload API)
  async createRoom(req, res) {
    const { projectId, name, description, totalInventories, videoUrl } =
      req.body;

    if (!videoUrl) {
      return handlers.response.error({
        res,
        message: "Video URL is required"
      });
    }

    const roomId = uuidv4(); // Generate a unique Room ID
    const creationDate = new Date().toISOString();

    const item = {
      RoomId: roomId,
      CreationDate: creationDate,
      ProjectId: projectId, // Foreign Key to Project
      Name: name,
      Video: videoUrl, // Store S3 URL of the video
      Description: description,
      TotalInventories: totalInventories
    };

    const params = {
      TableName: this.tableName,
      Item: item
    };

    try {
      await docClient.put(params).promise();

      return handlers.response.success({
        res,
        message: "Room created successfully",
        data: item
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  // Get a room by ID and CreationDate
  async getRoom(req, res) {
    const { roomId, creationDate } = req.params;

    const params = {
      TableName: this.tableName,
      Key: {
        RoomId: roomId,
        CreationDate: creationDate
      }
    };

    try {
      const result = await docClient.get(params).promise();

      if (!result.Item) {
        return handlers.response.error({
          res,
          message: "Room not found"
        });
      }

      return handlers.response.success({
        res,
        message: "Room fetched successfully",
        data: result.Item
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  // List all rooms for a project (without pagination)
  async getRooms(req, res) {
    const { projectId } = req.query;

    const params = {
      TableName: this.tableName,
      FilterExpression: "ProjectId = :projectId",
      ExpressionAttributeValues: {
        ":projectId": projectId
      }
    };

    try {
      const result = await docClient.scan(params).promise();

      return handlers.response.success({
        res,
        message: "Rooms fetched successfully",
        data: result.Items
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  // Update room details (including video upload)
  async updateRoom(req, res) {
    const { roomId, creationDate } = req.params;
    const { name, description, totalInventories, videoUrl } = req.body;

    const updateExpression = [];
    const expressionAttributeValues = {};

    if (name) {
      updateExpression.push("Name = :name");
      expressionAttributeValues[":name"] = name;
    }

    if (description) {
      updateExpression.push("Description = :description");
      expressionAttributeValues[":description"] = description;
    }

    if (totalInventories) {
      updateExpression.push("TotalInventories = :totalInventories");
      expressionAttributeValues[":totalInventories"] = totalInventories;
    }

    if (videoUrl) {
      updateExpression.push("Video = :video");
      expressionAttributeValues[":video"] = videoUrl;
    }

    if (updateExpression.length === 0) {
      return handlers.response.error({
        res,
        message: "No updates provided"
      });
    }

    const params = {
      TableName: this.tableName,
      Key: {
        RoomId: roomId,
        CreationDate: creationDate
      },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    };

    try {
      const result = await docClient.update(params).promise();

      return handlers.response.success({
        res,
        message: "Room updated successfully",
        data: result.Attributes
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  // Delete a room
  async deleteRoom(req, res) {
    const { roomId, creationDate } = req.params;

    const params = {
      TableName: this.tableName,
      Key: {
        RoomId: roomId,
        CreationDate: creationDate
      }
    };

    try {
      await docClient.delete(params).promise();

      return handlers.response.success({
        res,
        message: "Room deleted successfully"
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }
}

module.exports = new RoomService();
