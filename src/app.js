const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const connectionRouter = require("./routes/connectionRouter");
const postsRouter = require("./routes/postsRouter");
const groupRouter = require("./routes/groupRouter");
const searchRouter = require("./routes/searchRouter");
const discussionRouter = require("./routes/discussionRouter");
const followerRouter = require("./routes/followRouter");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", connectionRouter);
app.use("/", postsRouter);
app.use("/", groupRouter);
app.use("/", searchRouter);
app.use("/", discussionRouter);
app.use("/", followerRouter);

connectDB()
  .then(() => {
    console.log("Database connection established...");
    app.listen(process.env.PORT, () => {
      console.log("server started on " + process.env.PORT);
    });
  })
  .catch((error) => console.log(error.message));
