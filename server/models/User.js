import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profile: {
      type: {
        firstName: { type: String, default: "" },
        lastName: { type: String, default: "" },
        phoneNumber: { type: String, default: "" },
        dateOfBirth: { type: Date },
        gender: { type: String, default: "" },
        address: { type: String, default: "" },
        levelEducation: String,
        typeEducation: String,
        major: String,
        faculty: String,
      },
      default: {}, // Default to an empty object
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    mainrole: {
      type: String,
      default: "student",
      enum: ["lecturer", "student", "admin", "superadmin"],
    },
    subscription: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Courses",
      },
    ],
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", schema);
