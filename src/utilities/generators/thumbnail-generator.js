const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const ffmpeg = require("fluent-ffmpeg");
const { handlers } = require("../../utilities/handlers/handlers");
const { s3 } = require("../../config/dynamodb");

exports.generateAndUploadThumbnailFromS3Url = async function (
  videoUrl,
  bucket
) {
  if (!videoUrl) {
    throw new Error("No video URL provided for thumbnail generation");
  }

  const thumbnailFilename = `${Date.now()}_thumb.jpeg`;
  const localThumbnailPath = path.join(
    "uploads",
    "thumbnails",
    thumbnailFilename
  );

  // Ensure 'uploads/thumbnails' directory exists
  fs.mkdirSync(path.dirname(localThumbnailPath), { recursive: true });

  try {
    // Step 1: Generate thumbnail from video URL (S3 public URL)
    await new Promise((resolve, reject) => {
      ffmpeg(videoUrl)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .screenshots({
          count: 1,
          folder: path.dirname(localThumbnailPath),
          filename: thumbnailFilename,
          size: "320x240"
        });
    });

    // Step 2: Upload generated thumbnail to S3
    const fileKey = `${uuidv4()}.jpeg`;
    const uploadParams = {
      Bucket: bucket, // set in your environment
      Key: fileKey,
      Body: fs.createReadStream(localThumbnailPath),
      ContentType: "image/jpeg",
      ACL: "public-read"
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    // Clean up local thumbnail file
    fs.unlink(localThumbnailPath, (err) => {
      if (err) console.error("Failed to delete thumbnail:", err);
    });

    // Log and return the uploaded thumbnail URL
    handlers.logger.success({
      message: "Thumbnail uploaded successfully",
      data: { url: uploadResult.Location }
    });

    return uploadResult.Location;
  } catch (error) {
    fs.unlink(localThumbnailPath, () => {});
    handlers.logger.error({ message: error });
    throw new Error("Failed to generate or upload thumbnail");
  }
};
