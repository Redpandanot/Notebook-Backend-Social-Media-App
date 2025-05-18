const User = require("../models/user");
const jwt = require("jsonwebtoken");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Invalid token");
    }
    const decodedObj = jwt.verify(token, process.env.JWT_SECRECT);

    const { _id, iat } = decodedObj;
    const user = await User.findById({ _id });
    if (!user) {
      res.send("Please sign up");
    }

    // Convert iat (seconds) to milliseconds for comparison with passwordChangedAt (Date object)
    const iatMilliseconds = iat * 1000;
    if (user.passwordChangedAt > iatMilliseconds) {
      // Password has been changed after the token was issued
      res.clearCookie("token");
      throw new Error("Invalid token please login");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(400).send(error.message);
  }
};

module.exports = userAuth;
