const express = require("express");
const userAuth = require("../middlewares/userAuth");
const { validateGroupCreation } = require("../utils/validation");
const Groups = require("../models/groups");
const GroupMember = require("../models/groupMembers");
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

groupRouter.post("/group/addMember/:groupId", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { groupId } = req.params;

    const group = await Groups.findById({
      _id: groupId,
    });

    if (!group) {
      throw new Error("Group does not exist");
    }
    if (group.isPrivate) {
      const newMemberRequest = new GroupMember({
        groupId,
        userId: user._id,
        status: "requested",
      });

      await newMemberRequest.save();

      console.log(
        "new member request added for a private group",
        newMemberRequest
      );

      return res.send("Membership requested", newMemberRequest);
    } else {
      const newMemberRequest = new GroupMember({
        groupId,
        userId: user._id,
        status: "accepted",
      });

      await newMemberRequest.save();
      console.log("new member added for a public group", newMemberRequest);

      group.memberCount++;
      await group.save();
      console.log("Group member count updated successfully:", group);

      return res.send("Membership added", newMemberRequest);
    }
  } catch (error) {
    console.log("Error occured while adding user to group", error.message);

    res.send("Error adding user", error.message);
  }
});

module.exports = groupRouter;
