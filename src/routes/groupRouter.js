const express = require("express");
const userAuth = require("../middlewares/userAuth");
const { validateGroupCreation } = require("../utils/validation");
const Groups = require("../models/groups");
const GroupMember = require("../models/groupMembers");
const groupRouter = express.Router();
const User = require("../models/user");

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

    console.log("new group created", newGroup);

    const newMemberRequest = new GroupMember({
      groupId: newGroup._id,
      userId: user._id,
      status: "accepted",
    });

    await newMemberRequest.save();
    console.log("admin added as the member of the group", newMemberRequest);

    res.send(newGroup);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

groupRouter.post("/group/joinRequest/:groupId", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { groupId } = req.params;

    const group = await Groups.findById({
      _id: groupId,
    });

    //is already a member?
    const isAMember = await GroupMember.findOne({
      groupId,
      userId: user._id,
    });

    if (isAMember) {
      if (isAMember.status === "requested") {
        return res.send("Request already exists");
      } else if (isAMember.status === "accepted") {
        return res.send("Already a member");
      } else if (isAMember.status === "rejected") {
        return res.send("Your request as been rejected");
      }
    }

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

    res.send(error.message);
  }
});

groupRouter.post(
  "/group/addModerator/:groupId/:newMemberId",
  userAuth,
  async (req, res) => {
    //check if the user is moderator or not
    try {
      const user = req.user;
      const { groupId, newMemberId } = req.params;

      const group = await Groups.findById({
        _id: groupId,
      });

      if (!group) {
        throw new Error("Group does not exist");
      }

      const isUserModerator = group.moderators.find((userId) =>
        userId.equals(user._id)
      );

      if (!isUserModerator) {
        throw new Error("Not Authroized to make this change");
      }

      const isAlreadyAModerator = group.moderators.find((userId) =>
        userId.equals(newMemberId)
      );

      if (isAlreadyAModerator) {
        throw new Error("Is already a moderator");
      }

      const userExists = await User.findById({
        _id: newMemberId,
      });

      if (!userExists) {
        throw new Error("User does not exist");
      }

      const isAMember = await GroupMember.findOne({
        groupId,
        userId: newMemberId,
      });

      if (!isAMember) {
        //add to group
        const newMemberRequest = new GroupMember({
          groupId,
          userId: newMemberId,
          status: "accepted",
        });

        await newMemberRequest.save();
        console.log("new member added public group", newMemberRequest);

        group.memberCount++;

        console.log("Group member count updated successfully:", group);
      } else if (isAMember.status !== "accepted") {
        //change to accepted
        isAMember.status = "accepted";
        await isAMember.save();
        console.log("Member status changed to accepted");
      }
      //make moderator
      group.moderators = [...group.moderators, newMemberId];
      await group.save();

      console.log("moderator added", group);

      res.send(group);
    } catch (error) {
      console.log(
        "Error occured while adding moderator to group",
        error.message
      );

      res.send(error.message);
    }
  }
);

groupRouter.post(
  "/group/removeModerator/:groupId/:moderatorId",
  userAuth,
  async (req, res) => {
    //if admin
    try {
      const user = req.user;
      const { groupId, moderatorId } = req.params;
      const group = await Groups.findById({
        _id: groupId,
      });

      if (!group.createdBy.equals(user._id)) {
        console.log(
          "user is not an admin had has does not access to remove moderator"
        );
        throw new Error("do not have authorization to make this change");
      }
      console.log("user is admin had has access to remove moderator");

      //does moderator exist
      const isAModerator = group.moderators.find((id) => {
        return id.equals(moderatorId);
      });

      if (!isAModerator) {
        console.log("user is a moderator");
        throw new Error("user is not a moderator");
      }
      console.log("user is a moderator an will be removed");
      //remove moderator
      group.moderators = group.moderators.filter((id) => {
        return !id.equals(moderatorId);
      });

      await group.save();
      console.log("moderator removed");
      res.send("Moderator removed", group);
    } catch (error) {
      console.log("something went wrong", error);
      res.send("request failed : " + error.message);
    }
  }
);

groupRouter.post(
  "/group/removeMember/:groupId/:memberId",
  userAuth,
  async (req, res) => {
    try {
      const user = req.user;
      const { groupId, memberId } = req.params;

      const group = await Groups.findById({
        _id: groupId,
      });

      const isUserAuthorized = group.moderators.find((id) => {
        return id.equals(user._id);
      });

      if (!isUserAuthorized) {
        console.log("User is not authorized to make this change");
        throw new Error("User is not authorized to make this change");
      }

      const isAMember = await GroupMember.findOne({
        groupId,
        userId: memberId,
        status: "accepted",
      });

      if (!isAMember) {
        console.log("User it not a member of this group");
        throw new Error("User it not a member of this group");
      }

      const removeUserFromGroup = await GroupMember.findByIdAndDelete({
        _id: isAMember._id,
      });

      const isMemberAModerator = group.moderators.find((id) => {
        return id.equals(memberId);
      });

      if (isMemberAModerator) {
        group.moderators = group.moderators.filter((id) => {
          return !id.equals(memberId);
        });
      }

      if (!removeUserFromGroup) {
        throw new Error("someting went wrong while removing the user");
      }

      console.log("user removed");

      group.memberCount--;
      await group.save();
      console.log("Group member count updated successfully:", group);

      res.send("user removed");
    } catch (error) {
      console.log("failed to remove user from group ", error.message);
      res.send("failed to remove user from group : " + error.message);
    }
  }
);

module.exports = groupRouter;
