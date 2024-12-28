import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const isAuth = async (req, res, next) => {
  try {
    const token = req.headers.token;

    if (!token)
      return res.status(403).json({
        message: "Please Login",
      });

    const decodedData = jwt.verify(token, process.env.Jwt_Sec);

    req.user = await User.findById(decodedData._id);

    next();
  } catch (error) {
    res.status(500).json({
      message: "Login First",
    });
  }
};

export const isAdmin = (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin")
      return res.status(403).json({
        message: "You are not admin",
      });

    next();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const isStudent = (req, res, next) => {
  try {
    if (req.user.role !== "student")
      return res.status(403).json({
        message: "You are not student",
      });

    next();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const isLecturer = (req, res, next) => {
  try {
    if (req.user.role !== "lecturer")
      return res.status(403).json({
        message: "You are not lecturer",
      });

    next();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const isLecturerOrStudent = (req, res, next) => {
  if (req.user.role === 'lecturer' || req.user.role === 'student') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Only lecturers and students can view grades' });
};