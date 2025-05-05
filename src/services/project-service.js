const { handlers } = require("../utilities/handlers/handlers");
const { docClient } = require("../config/dynamodb"); // Ensure this exports an initialized DocumentClient
const { v4: uuidv4 } = require("uuid");

class ProjectService {
  constructor() {
    this.tableName = "Projects";
    this.updatedLocation = (location) => {
      if (
        !location ||
        typeof location.name !== "string" ||
        !location.coordinates ||
        typeof location.coordinates.latitude !== "number" ||
        typeof location.coordinates.longitude !== "number"
      ) {
        return "Invalid location";
      }

      return {
        Name: location.name,
        Coordinates: {
          Latitude: location.coordinates.latitude,
          Longitude: location.coordinates.longitude
        }
      };
    };
  }

  // Create a new project
  async createProject(req, res) {
    const { name, location } = req.body;

    const projectId = uuidv4();
    const creationDate = new Date().toISOString();

    const item = {
      ProjectId: projectId,
      CreationDate: creationDate,
      Name: name,
      Location: this.updatedLocation(location)
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

  // Get a project by ID and creationDate
  async getProject(req, res) {
    const { projectId, creationDate } = req.params;

    const params = {
      TableName: this.tableName,
      Key: {
        ProjectId: projectId,
        CreationDate: creationDate
      }
    };

    try {
      const result = await docClient.get(params).promise();
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

  // List all projects without pagination (takes limit from request)
  async getProjects(req, res) {
    const { limit = 10, lastEvaluatedKey = null } = req.query;

    const params = {
      TableName: this.tableName,
      Limit: parseInt(limit),
      ExclusiveStartKey: lastEvaluatedKey || undefined
    };

    try {
      const result = await docClient.scan(params).promise();
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

  // Update project name or location (takes parameters from req)
  async updateProject(req, res) {
    const { projectId, creationDate } = req.params; // Make sure both are provided
    const { name, location } = req.body;

    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (name) {
      updateExpression.push("#name = :name");
      expressionAttributeValues[":name"] = name;
      expressionAttributeNames["#name"] = "Name";
    }

    if (location) {
      updateExpression.push("Location = :location");
      expressionAttributeValues[":location"] = this.updatedLocation(location);
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
        ProjectId: projectId,
        CreationDate: creationDate
      },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length
        ? expressionAttributeNames
        : undefined,
      ReturnValues: "ALL_NEW"
    };

    try {
      const result = await docClient.update(params).promise();

      return handlers.response.success({
        res,
        message: "Project updated successfully",
        data: result.Attributes
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  // Delete a project (takes parameters from req)
  async deleteProject(req, res) {
    const { projectId, creationDate } = req.params;

    const params = {
      TableName: this.tableName,
      Key: {
        ProjectId: projectId,
        CreationDate: creationDate
      }
    };

    try {
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
