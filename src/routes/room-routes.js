const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room-controller");
const upload = require("../middlewares/multer-middleware");

router.post(
  "/uploads",
  upload.fields([{ name: "videos" }]),
  roomController.uploadVideoToS3.bind(roomController)
);

router.post("/", roomController.createRoom.bind(roomController));

router.get(
  "/:roomId/:creationDate",
  roomController.getRoom.bind(roomController)
);

router.get("/", roomController.getRooms.bind(roomController));

router.put(
  "/:roomId/:creationDate",
  roomController.updateRoom.bind(roomController)
);

router.delete(
  "/:roomId/:creationDate",
  roomController.deleteRoom.bind(roomController)
);

module.exports = router;
