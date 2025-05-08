const { handlers } = require("../utilities/handlers/handlers");
const { docClient } = require("../config/dynamodb");
const { v4: uuidv4 } = require("uuid");

class ProjectService {
  constructor() {
    this.tableName = "InventoryManagement";
    this.staticPK = "USER#123"; // Static partition key

    // this.updatedLocation = (location) => {
    //   if (
    //     !location ||
    //     typeof location.name !== "string" ||
    //     !location.coordinates ||
    //     typeof location.coordinates.latitude !== "number" ||
    //     typeof location.coordinates.longitude !== "number"
    //   ) {
    //     return "Invalid location";
    //   }

    //   return {
    //     Name: location.name,
    //     Coordinates: {
    //       Latitude: location.coordinates.latitude,
    //       Longitude: location.coordinates.longitude
    //     }
    //   };
    // };
  }

  async createProject(req, res) {
    const { name, location } = req.body;

    if (!name || !location) {
      return handlers.response.error({
        res,
        message: "Both 'name' and 'location' are required"
      });
    }

    const projectId = uuidv4();
    const createdAt = new Date().toISOString();

    const item = {
      PK: this.staticPK,
      SK: `PROJECT#${projectId}`,
      EntityType: "Project",
      ProjectId: projectId,
      Name: name,
      CreatedAt: createdAt,
      Location: location
    };

    const params = {
      TableName: this.tableName,
      Item: item
    };

    try {
      await docClient.put(params).promise();
      return handlers.response.success({
        res,
        message: "Project created successfully",
        data: item
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: "Error creating project",
        error: error.message
      });
    }
  }

  async getProject(req, res) {
    const { projectId } = req.params;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.staticPK,
        SK: `PROJECT#${projectId}`
      }
    };

    try {
      const result = await docClient.get(params).promise();

      if (!result.Item) {
        return handlers.response.failed({
          res,
          message: "Invalid project ID"
        });
      }

      return handlers.response.success({
        res,
        message: "Project fetched successfully",
        data: result.Item
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: "Error fetching project",
        error: error.message
      });
    }
  }

  async getProjects(req, res) {
    const { limit = 10, lastEvaluatedKey = null } = req.query;

    const params = {
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk and begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": this.staticPK,
        ":skPrefix": "PROJECT#",
        ":entityType": "Project"
      },
      FilterExpression: "EntityType = :entityType",
      Limit: parseInt(limit),
      ExclusiveStartKey: lastEvaluatedKey || undefined
    };

    try {
      const result = await docClient.query(params).promise();

      if (!result.Items.length) {
        return handlers.response.unavailable({
          res,
          message: "No projects yet"
        });
      }

      return handlers.response.success({
        res,
        message: "Projects fetched successfully",
        data: result.Items,
        nextKey: result.LastEvaluatedKey || null
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: "Error listing projects",
        error: error.message
      });
    }
  }

  async updateProject(req, res) {
    const { projectId } = req.params;
    const { name, location } = req.body;

    // Step 1: Check if the project exists
    const getParams = {
      TableName: this.tableName,
      Key: {
        PK: this.staticPK,
        SK: `PROJECT#${projectId}`
      }
    };

    try {
      const existing = await docClient.get(getParams).promise();
      if (!existing.Item) {
        return handlers.response.failed({
          res,
          message: "Invalid project ID"
        });
      }
    } catch (err) {
      return handlers.response.error({
        res,
        message: "Error checking project existence",
        error: err.message
      });
    }

    // Step 2: Prepare update expression
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (name) {
      updateExpression.push("#name = :name");
      expressionAttributeValues[":name"] = name;
      expressionAttributeNames["#name"] = "Name";
    }

    if (location) {
      updateExpression.push("#location = :location");
      expressionAttributeValues[":location"] = location;
      expressionAttributeNames["#location"] = "Location";
    }

    if (updateExpression.length === 0) {
      return handlers.response.error({
        res,
        message: "No updates provided"
      });
    }

    const updateParams = {
      TableName: this.tableName,
      Key: {
        PK: this.staticPK,
        SK: `PROJECT#${projectId}`
      },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length
        ? expressionAttributeNames
        : undefined,
      ReturnValues: "ALL_NEW"
    };

    try {
      const result = await docClient.update(updateParams).promise();
      return handlers.response.success({
        res,
        message: "Project updated successfully",
        data: result.Attributes
      });
    } catch (error) {
      console.error(error);

      return handlers.response.error({
        res,
        message: "Error updating project",
        error: error.message
      });
    }
  }

  async deleteProject(req, res) {
    const { projectId } = req.params;

    const params = {
      TableName: this.tableName,
      Key: {
        PK: this.staticPK,
        SK: `PROJECT#${projectId}`
      }
    };

    try {
      const existing = await docClient.get(params).promise();
      if (!existing.Item) {
        return handlers.response.failed({
          res,
          message: "Invalid project ID"
        });
      }

      await docClient.delete(params).promise();
      return handlers.response.success({
        res,
        message: "Project deleted successfully"
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: "Error deleting project",
        error: error.message
      });
    }
  }
}

module.exports = new ProjectService();
