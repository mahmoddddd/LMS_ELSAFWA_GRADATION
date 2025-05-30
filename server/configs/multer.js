import multer from "multer";

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images and videos
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only images and videos are allowed."),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
});

export default upload;
