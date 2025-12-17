const express = require("express");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const rateLimit = require("express-rate-limit");

const app = express();

//basic verison of rate limiting
const limiter = rateLimit.rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

app.use(limiter);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const initializeSocket = require("./utils/socket");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const connectionRouter = require("./routes/connectionRouter");
const postsRouter = require("./routes/postsRouter");
// const groupRouter = require("./routes/groupRouter");
const searchRouter = require("./routes/searchRouter");
const discussionRouter = require("./routes/discussionRouter");
const followerRouter = require("./routes/followRouter");
const chatRouter = require("./routes/chatRouter");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", connectionRouter);
app.use("/", postsRouter);
// app.use("/", groupRouter);
app.use("/", searchRouter);
app.use("/", discussionRouter);
app.use("/", followerRouter);
app.use("/", chatRouter);

const server = http.createServer(app);
initializeSocket(server);

connectDB()
  .then(() => {
    console.log("Database connection established...");
    server.listen(process.env.PORT, () => {
      console.log("server started on " + process.env.PORT);
    });
  })
  .catch((error) => console.log(error.message));
