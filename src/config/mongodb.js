const mongoose = require("mongoose");
const { handlers } = require("../utilities/handlers/handlers");

const mongoURI = process.env.MONGODB_URI;
const mode = process.env.NODE_ENV;

const connectToDatabase = async () => {
  try {
    const options = {
      ...(mode === "production"
        ? {
            user: process.env.MONGODB_USERNAME,
            pass: process.env.MONGODB_PASSWORD
          }
        : {})
    };

    await mongoose.connect(mongoURI, options);

    return handlers.logger.success({
      message: "MongoDB connected successfully."
    });
  } catch (error) {
    handlers.logger.error({
      message: error
    });
    return process.exit(1);
  }
};

module.exports = connectToDatabase;
