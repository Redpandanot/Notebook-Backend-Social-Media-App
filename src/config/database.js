const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    `mongodb+srv://Chiragvk:${process.env.MONGODB_PASSWORD}@cluster0.w9kw428.mongodb.net/socialMedia`
  );
};

module.exports = connectDB;
