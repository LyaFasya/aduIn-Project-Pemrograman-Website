const { v2: cloudinary } = require("cloudinary")
const streamifier = require("streamifier")

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadImage = (file, folder = "general") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${process.env.APP_NAME || "app"}/${folder}`,
        public_id: `${folder}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        resource_type: "image",
        transformation: [
          { width: 800, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error)

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        })
      }
    )

    streamifier.createReadStream(file.buffer).pipe(stream)
  })
}

module.exports = {
  uploadImage,
}