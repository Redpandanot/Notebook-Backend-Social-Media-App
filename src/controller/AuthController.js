const { validationSignUp } = require("../utils/validation");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcrypt");

const SignupController = async (req, res) => {
  try {
    validationSignUp(req);

    const { firstName, lastName, emailId, password } = req.body;

    const userExists = await User.findOne({
      emailId,
    });

    if (userExists) {
      return res
        .status(400)
        .json({ error: "EmailId already exists, please login" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("password hashed");

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
    });
    await user.save();
    console.log("user added , id: ", user._id);

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
    });
    res.json({
      _id: user._id,
      firstName: user.firstName,
      emailId: user.emailId,
    });
  } catch (error) {
    console.error("Signup error: ", error);
    res.status(500).json({ error: error.message });
  }
};

const LoginController = async (req, res) => {
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

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
    });
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
        _id: user.photo._id,
      },
      about: user.about,
      skills: user.skills,
    });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const Logout = async (req, res) => {
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
};

module.exports = {
  SignupController,
  LoginController,
  Logout,
};
