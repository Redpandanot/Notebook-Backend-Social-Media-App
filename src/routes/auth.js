const express = require("express");
const authRouter = express.Router();
const { validationSignUp } = require("../utils/validation");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

authRouter.post("/signup", async (req, res) => {
  try {
    //valdate the user data
    validationSignUp(req);

    //encrypt password
    const { firstName, lastName, emailId, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // store the data in DB
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
    });
    await user.save();
    console.log("user adding done");
    //create jwt
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRECT, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
    });
    res.send("User Signup");
  } catch (error) {
    res.status(400).send(error.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId) {
      throw new Error("EmailId is missing");
    }
    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid Credentials");
    }
    const verifyPassword = await bcrypt.compare(password, user.password);

    if (!verifyPassword) {
      throw new Error("Invalid Credentials");
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRECT, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
    });
    res.send(user);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

authRouter.get("/logout", async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("User not logged in");
    }
    res.cookie("token", null, {
      expires: new Date(Date.now()),
    });
    res.send("Logged Out");
  } catch (error) {
    res.status(400).send(error.message);
  }
});

module.exports = authRouter;
