const express = require("express");
const userAuth = require("../middlewares/userAuth");
const { validationProfileEdit } = require("../utils/validation");
const validator = require("validator");
const profileRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const Connections = require("../models/connections");

profileRouter.get("/profile/view", userAuth, (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (error) {
    res.status(400).send("cannot fetch user, please login");
  }
});

profileRouter.post("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validationProfileEdit(req)) {
      throw new Error("Invalid edit request");
    }

    const currentUser = req.user;
    Object.keys(req.body).forEach((field) => {
      currentUser[field] = req.body[field];
    });

    await currentUser.save();

    res.send(currentUser);
  } catch (error) {
    res.send(error.message);
  }
});

profileRouter.post("/profile/edit/password", userAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!validator.isStrongPassword(newPassword)) {
      throw new Error("Password is not strong");
    }

    const verifyCurrentPassword = await bcrypt.compare(
      currentPassword,
      req.user.password
    );

    if (!verifyCurrentPassword) {
      res.send("Incorrect Password");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(hashedPassword);

    const user = await User.findByIdAndUpdate(
      { _id: req.user._id },
      {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
      {
        runValidators: true,
        new: true,
      }
    );

    res.cookie("token", null, {
      expires: new Date(Date.now()),
    });

    res.status(200).send(user);
  } catch (error) {
    res.send(error.message);
  }
});

profileRouter.get("/getAllUsers", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const allUsers = await User.find({}).select("firstName lastName emailId");
    //remove existing friends from this list
    const existingFriends = await Connections.find({});
    //remove pending friend requests from this list
    res.send(allUsers);
  } catch (error) {
    res.json({
      status: 500,
      message: error.message,
    });
  }
});

module.exports = profileRouter;
