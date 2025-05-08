const { handlers } = require("../utilities/handlers/handlers");
const { docClient, s3 } = require("../config/dynamodb");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

class RoomService {
  constructor() {
    this.tableName = "InventoryManagement";
    this.s3BucketName = "uploads-476114132237";
    this.userPK = "USER#123";
  }

  async validateProject(projectId, res) {
    if (!projectId) {
      handlers.response.failed({ res, message: "Project ID is required" });
      return false;
    }

    const projectKey = {
      PK: this.userPK,
      SK: `PROJECT#${projectId}`
    };

    const project = await docClient
      .get({ TableName: this.tableName, Key: projectKey })
      .promise();

    if (!project.Item) {
      handlers.response.failed({ res, message: "Invalid project ID" });
      return false;
    }

    return true;
  }

  async validateRoom(projectId, roomId, res) {
    if (!roomId) {
      handlers.response.failed({ res, message: "Room ID is required" });
      return false;
    }

    const roomKey = {
      PK: this.userPK,
      SK: `PROJECT#${projectId}#ROOM#${roomId}`
    };

    const room = await docClient
      .get({ TableName: this.tableName, Key: roomKey })
      .promise();

    if (!room.Item) {
      handlers.response.failed({ res, message: "Invalid room ID" });
      return false;
    }

    return true;
  }

  async uploadVideoToS3(req, res) {
    const file = req.files?.videos?.[0];

    if (!file) {
      return handlers.response.failed({
        res,
        message: "No video file provided"
      });
    }

    const localFilePath = file.path;
    const fileKey = `${uuidv4()}.mp4`;

    const params = {
      Bucket: this.s3BucketName,
      Key: fileKey,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
      PartSize: 5 * 1024 * 1024,
      QueueSize: 20,
      ACL: "public-read"
    };

    try {
      const uploadResult = await s3.upload(params).promise();

      fs.unlink(localFilePath, (err) => {
        if (err) console.error("Failed to delete local file:", err);
      });

      return handlers.response.success({
        res,
        message: "Video uploaded successfully",
        data: { url: uploadResult.Location }
      });
    } catch (err) {
      fs.unlink(localFilePath, () => {});
      handlers.logger.error({ message: err });
      return handlers.response.error({
        res,
        message: "Failed to upload video to S3"
      });
    }
  }

  async createRoom(req, res) {
    const { projectId, name, description, accessories, videoUrl } = req.body;

    if (!projectId || !videoUrl) {
      return handlers.response.error({
        res,
        message: !projectId ? "Project ID is required" : "Video URL is required"
      });
    }

    if (!(await this.validateProject(projectId, res))) return;

    try {
      const roomId = uuidv4();
      const createdAt = new Date().toISOString();

      const roomItem = {
        PK: this.userPK,
        SK: `PROJECT#${projectId}#ROOM#${roomId}`,
        EntityType: "Room",
        ProjectId: projectId,
        RoomId: roomId,
        Name: name,
        Image:
          "https://images.unsplash.com/photo-1692803629992-90acbafd964d?q=80&w=2736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        Description: description,
        Video: videoUrl,
        Accessories: accessories,
        CreatedAt: createdAt
      };

      await docClient
        .put({
          TableName: this.tableName,
          Item: roomItem
        })
        .promise();

      return handlers.response.success({
        res,
        message: "Room created successfully",
        data: roomItem
      });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({ res, message: "Failed to create room" });
    }
  }

  async getRoom(req, res) {
    const { projectId, roomId } = req.params;

    if (!projectId || !roomId) {
      return handlers.response.error({
        res,
        message: !projectId ? "Project ID is required" : "Room ID is required"
      });
    }

    if (!(await this.validateProject(projectId, res))) return;

    if (!(await this.validateRoom(projectId, roomId, res))) return;

    try {
      const result = await docClient
        .get({
          TableName: this.tableName,
          Key: {
            PK: this.userPK,
            SK: `PROJECT#${projectId}#ROOM#${roomId}`
          }
        })
        .promise();

      if (!result.Item) {
        return handlers.response.failed({ res, message: "Invalid room ID" });
      }

      return handlers.response.success({
        res,
        message: "Room fetched successfully",
        data: result.Item
      });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({ res, message: "Failed to fetch room" });
    }
  }

  async getRooms(req, res) {
    const { projectId } = req.params;

    if (!projectId) {
      return handlers.response.error({
        res,
        message: "Project ID is required"
      });
    }

    if (!(await this.validateProject(projectId, res))) return;

    try {
      const result = await docClient
        .query({
          TableName: this.tableName,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
          FilterExpression: "EntityType = :entityType",
          ExpressionAttributeValues: {
            ":pk": this.userPK,
            ":skPrefix": `PROJECT#${projectId}#ROOM#`,
            ":entityType": "Room"
          }
        })
        .promise();

      if (!result.Items.length) {
        return handlers.response.success({
          res,
          message: "No rooms yet"
        });
      }

      return handlers.response.success({
        res,
        message: "Rooms fetched successfully",
        data: result.Items
      });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({
        res,
        message: "Failed to fetch rooms"
      });
    }
  }

  async updateRoom(req, res) {
    const { projectId, roomId } = req.params;
    const { name, description, accessories, videoUrl } = req.body;

    if (!projectId || !roomId) {
      return handlers.response.error({
        res,
        message: !projectId ? "Project ID is required" : "Room ID is required"
      });
    }

    if (!(await this.validateProject(projectId, res))) return;

    if (!(await this.validateRoom(projectId, roomId, res))) return;

    const updates = [];
    const exprValues = {};
    const exprNames = {};

    if (name) {
      updates.push("#N = :name");
      exprNames["#N"] = "Name";
      exprValues[":name"] = name;
    }
    if (description) {
      updates.push("Description = :desc");
      exprValues[":desc"] = description;
    }
    if (videoUrl) {
      updates.push("Video = :video");
      exprValues[":video"] = videoUrl;
    }
    if (accessories) {
      updates.push("Accessories = :acc");
      exprValues[":acc"] = accessories;
    }

    if (updates.length === 0) {
      return handlers.response.failed({
        res,
        message: "No updates provided"
      });
    }

    try {
      const result = await docClient
        .update({
          TableName: this.tableName,
          Key: {
            PK: this.userPK,
            SK: `PROJECT#${projectId}#ROOM#${roomId}`
          },
          UpdateExpression: `SET ${updates.join(", ")}`,
          ExpressionAttributeValues: exprValues,
          ExpressionAttributeNames: Object.keys(exprNames).length
            ? exprNames
            : undefined,
          ReturnValues: "ALL_NEW"
        })
        .promise();

      return handlers.response.success({
        res,
        message: "Room updated successfully",
        data: result.Attributes
      });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({ res, message: "Failed to update room" });
    }
  }

  async deleteRoom(req, res) {
    const { projectId, roomId } = req.params;

    if (!projectId || !roomId) {
      return handlers.response.error({
        res,
        message: !projectId ? "Project ID is required" : "Room ID is required"
      });
    }

    if (!(await this.validateProject(projectId, res))) return;

    if (!(await this.validateRoom(projectId, roomId, res))) return;

    try {
      await docClient
        .delete({
          TableName: this.tableName,
          Key: {
            PK: this.userPK,
            SK: `PROJECT#${projectId}#ROOM#${roomId}`
          }
        })
        .promise();

      return handlers.response.success({
        res,
        message: "Room deleted successfully"
      });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({ res, message: "Failed to delete room" });
    }
  }
}

module.exports = new RoomService();
