const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("hello world");
});

app.get("/h", (req, res) => {
  res.send("hello worhello worldhello worldhello world");
});

app.listen(3000, (req, res) => {
  console.log("Serve Started on 3000");
});
