const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://Chiragvk:Lvn13oCd2KA8jzEk@cluster0.w9kw428.mongodb.net/socialMedia"
  );
};

module.exports = connectDB;
