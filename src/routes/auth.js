const express = require("express");
const authRouter = express.Router();
const {
  SignupController,
  LoginController,
  Logout,
} = require("../controller/AuthController");

authRouter.post("/signup", SignupController);

authRouter.post("/login", LoginController);

authRouter.get("/logout", Logout);

module.exports = authRouter;
