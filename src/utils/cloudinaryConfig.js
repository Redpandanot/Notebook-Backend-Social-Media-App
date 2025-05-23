const cloudinary = require("cloudinary").v2;
const multer = require("multer");
require("dotenv").config();

cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./public/temp/");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

module.exports = { cloudinary, upload }; // Export them for use in your routes
