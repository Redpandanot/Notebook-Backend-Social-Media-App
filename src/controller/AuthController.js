const { validationSignUp } = require("../utils/validation");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcrypt");

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};

const SignupController = async (req, res) => {
  try {
    validationSignUp(req);

    const { firstName, lastName, emailId, password } = req.body;

    const email = emailId.toLowerCase();

    const userExists = await User.findOne({
      emailId: email,
    });

    if (userExists) {
      return res
        .status(400)
        .json({ error: "EmailId already exists, please login" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    console.log("password hashed");

    const user = lastName
      ? new User({
          firstName,
          lastName,
          emailId: email,
          password: hashedPassword,
        })
      : new User({
          firstName,
          emailId: email,
          password: hashedPassword,
        });

    await user.save();
    console.log("user added , id: ", user._id);

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    setAuthCookie(res, token);
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      age: user.age,
      gender: user.gender,
      college: user.college,
      photo: {
        url: user.photo.url,
      },
      about: user.about,
      skills: user.skills,
    });
  } catch (err) {
    if (
      err.message.includes("Name") ||
      err.message.includes("Email") ||
      err.message.includes("Password")
    ) {
      return res.status(400).json({ error: err.message });
    }
    console.error(err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const LoginController = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res.status(400).json({ error: "Email and password are missing" });
    }
    const user = await User.findOne({ emailId: emailId.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return res.status(400).json({ error: "Invalid Credentials" });
    }
    const verifyPassword = await bcrypt.compare(password, user.password);

    if (!verifyPassword) {
      return res.status(400).json({ error: "Invalid Credentials" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    setAuthCookie(res, token);
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      age: user.age,
      gender: user.gender,
      college: user.college,
      photo: {
        url: user.photo.url,
      },
      about: user.about,
      skills: user.skills,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const Logout = async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(200).json({ message: "No active session" });
    }
    res.cookie("token", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  SignupController,
  LoginController,
  Logout,
};
