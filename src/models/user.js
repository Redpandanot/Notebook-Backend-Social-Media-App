const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
      // minlength: 1,
      maxlength: 30,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email Id");
        }
      },
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    age: {
      type: Number,
      min: 17,
    },
    gender: {
      type: String,
      lowercase: true,
      validate(value) {
        if (
          ![
            "male",
            "female",
            "transgender",
            "nonbinary",
            "prefer not to say",
          ].includes(value)
        ) {
          throw new Error("Gender data is not valid");
        }
      },
    },
    college: {
      type: String,
      lowercase: true,
      trim: true,
      minLength: 3,
      maxLength: 30,
    },
    photo: {
      type: {
        url: {
          type: String,
          validate(value) {
            if (!validator.isURL(value)) {
              throw new Error("Invalid URL");
            }
          },
        },
        public_id: {
          type: String,
        },
      },
      required: false,
      default: {
        url: "https://res.cloudinary.com/doknrbhso/image/upload/v1746265741/samples/animals/cat.jpg",
        public_id: "default_placeholder",
      },
    },
    about: {
      type: String,
      default: "Add info about yourself",
      trim: true,
    },
    skills: {
      type: [String],
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ firstName: 1, lastName: 1 });

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
