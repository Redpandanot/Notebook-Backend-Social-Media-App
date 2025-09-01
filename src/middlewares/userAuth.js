const User = require("../models/user");
const jwt = require("jsonwebtoken");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

    const { _id, iat } = decodedObj;
    const user = await User.findById(_id);
    if (!user) {
      res.clearCookie("token");
      return res.status(401).json({ error: "Authentication required" });
    }

    // Convert iat (seconds) to milliseconds for comparison with passwordChangedAt (Date object)
    const iatMilliseconds = iat * 1000;
    if (
      user.passwordChangedAt &&
      user.passwordChangedAt.getTime() > iatMilliseconds
    ) {
      // Password has been changed after the token was issued
      res.clearCookie("token");
      return res
        .status(401)
        .json({ error: "Password changed, please login again" });
    }

    req.user = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      age: user.age,
      gender: user.gender,
      college: user.college,
      photo: user.photo,
      about: user.about,
      skills: user.skills,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    next();
  } catch (error) {
    res.clearCookie("token");
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = userAuth;
