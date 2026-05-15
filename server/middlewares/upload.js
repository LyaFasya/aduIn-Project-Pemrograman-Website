const multer = require("multer")

const storage = multer.memoryStorage()

const fileFilter = (request, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
  ]

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only image files are allowed (jpeg, png, jpg, webp)"),
      false
    )
  }

  cb(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // max 1MB
  },
})

module.exports = upload