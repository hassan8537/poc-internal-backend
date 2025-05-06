const { handlers } = require("../utilities/handlers/handlers");
const { docClient, s3 } = require("../config/dynamodb");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

class RoomService {
  constructor() {
    this.tableName = "Rooms"; // Single table, but uses composite keys
    this.s3BucketName = "uploads-476114132237"; // Set your S3 bucket name here
  }

  // Upload a video to S3
  async uploadVideoToS3(req, res) {
    const file = req.files?.videos?.[0];

    if (!file) {
      return handlers.response.error({
        res,
        message: "No video file provided"
      });
    }

    const localFilePath = file.path;
    const fileKey = `rooms/${uuidv4()}.mp4`; // Unique key for S3 video

    fs.readFile(localFilePath, async (err, data) => {
      if (err) {
        return handlers.response.error({
          res,
          message: "Failed to read the file",
          error: err.message
        });
      }

      const params = {
        Bucket: this.s3BucketName,
        Key: fileKey,
        Body: data,
        ContentType: file.mimetype,
        ACL: "public-read"
      };

      try {
        const uploadResult = await s3.upload(params).promise();

        fs.unlink(localFilePath, (err) => {
          if (err) {
            console.error("Failed to delete local file:", err);
          }
        });

        return handlers.response.success({
          res,
          message: "Video uploaded successfully",
          data: { url: uploadResult.Location }
        });
      } catch (error) {
        console.error(error);
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

    const roomId = uuidv4();
    const creationDate = new Date().toISOString();

    const roomItem = {
      PK: `PROJECT#${projectId}`,
      SK: `ROOM#${roomId}`,
      EntityType: "Room",
      RoomId: roomId,
      Name: name,
      Description: description,
      Video: videoUrl,
      TotalInventories: totalInventories,
      CreationDate: creationDate
    };

    const params = {
      TableName: this.tableName,
      Item: roomItem
    };

    try {
      await docClient.put(params).promise();

      return handlers.response.success({
        res,
        message: "Room created successfully",
        data: roomItem
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  // Get a room by ID
  async getRoom(req, res) {
    const { projectId, roomId } = req.params;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: `PROJECT#${projectId}`,
        SK: `ROOM#${roomId}`
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

  // List all rooms for a project
  async getRooms(req, res) {
    const { projectId } = req.query;

    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `PROJECT#${projectId}`
      }
    };

    try {
      const result = await docClient.query(params).promise();

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

  // Update room details (including video URL)
  async updateRoom(req, res) {
    const { projectId, roomId } = req.params;
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
        PK: `PROJECT#${projectId}`,
        SK: `ROOM#${roomId}`
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
    const { projectId, roomId } = req.params;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: `PROJECT#${projectId}`,
        SK: `ROOM#${roomId}`
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
