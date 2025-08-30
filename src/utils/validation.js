const validator = require("validator");

const validationSignUp = (req) => {
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName) {
    throw new Error("Name is not valid");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Email is not valid");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Password is weak");
  }
};

const validationProfileEdit = (req) => {
  const allowedEdits = [
    "firstName",
    "lastName",
    "age",
    "about",
    "skills",
    "college",
  ];

  const isEditAllowed = Object.keys(req.body).every((field) => {
    return allowedEdits.includes(field);
  });

  return isEditAllowed;
};

const validatePosts = (req) => {
  const { title, description } = req.body;
  if (
    typeof title === "string" &&
    validator.isLength(title, { min: 3, max: 75 }) &&
    typeof description === "string" &&
    validator.isLength(description, { min: 3, max: 1500 })
  ) {
    return true;
  }
  return false;
};

const validateGroupCreation = (req) => {
  const { groupName, groupInfo, isPrivate } = req.body;
  if (
    typeof groupName === "string" &&
    validator.isLength(groupName, { min: 3, max: 50 }) &&
    typeof groupInfo === "string" &&
    validator.isLength(groupInfo, { min: 3, max: 200 }) &&
    typeof isPrivate === "boolean"
  ) {
    return true;
  }
  return false;
};

module.exports = {
  validationSignUp,
  validationProfileEdit,
  validatePosts,
  validateGroupCreation,
};
