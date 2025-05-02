const express = require("express");
const userAuth = require("../middlewares/userAuth");
const { validateGroupCreation } = require("../utils/validation");
const Groups = require("../models/groups");
const groupRouter = express.Router();

groupRouter.post("/group/create", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const { groupName, groupInfo, isPrivate } = req.body;
    if (!validateGroupCreation(req)) {
      throw new Error("Group is not valid");
    }

    const newGroup = new Groups({
      createdBy: user,
      groupName,
      groupInfo,
      moderators: [user],
      isPrivate,
    });

    await newGroup.save();
    res.send(newGroup);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

module.exports = groupRouter;
