const { handlers } = require("../utilities/handlers/handlers");
const path = require("path");
const fs = require("fs");

class Service {
  // Upload files locally
  async uploadFile(req, res) {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        handlers.logger.failed({ message: "No files uploaded" });

        return handlers.response.failed({
          res,
          message: "No files uploaded"
        });
      }

      const uploaded = [];

      for (const fieldname in req.files) {
        req.files[fieldname].forEach((file) => {
          uploaded.push({
            path: file.path
          });
        });
      }

      handlers.logger.success({
        message: `Uploaded ${uploaded.length} file(s) successfully`,
        data: uploaded
      });

      return handlers.response.success({
        res,
        message: "Files uploaded successfully",
        data: uploaded
      });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({
        res,
        message: "Failed to upload files"
      });
    }
  }

  // Delete local file
  async deleteFile(req, res) {
    try {
      const { file_path } = req.query;

      if (!file_path) {
        return handlers.response.failed({
          res,
          message: "File path not provided"
        });
      }

      const filePath = path.join(global.rootdir, file_path);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        handlers.logger.success({ message: "File deleted successfully" });
        return handlers.response.success({
          res,
          message: "File deleted successfully"
        });
      } else {
        return handlers.response.failed({
          res,
          message: "File not found"
        });
      }
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
