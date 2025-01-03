// import { instance } from "../index.js";
import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { User } from "../models/User.js";
import { Progress } from "../models/Progress.js";
import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import { handleUpload } from "../config/cloudinary2.js";
import {Notification} from "../models/Notification.js";
import { sendNotificationMail } from "../middlewares/sendMail.js";
import { getReceiverSocketId, io } from "../config/socket.js";

export const getAllCourses = TryCatch(async (req, res) => {
  const courses = await Courses.find();
  res.json({
    courses,
  });
});

export const getSingleCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  res.json({
    course,
  });
});

export const getCourseByName = TryCatch(async (req, res) => {
  const { name } = req.query;
  const courses = await Courses.find({
    $or: [
      { title: { $regex: name, $options: "i" } },
      { description: { $regex: name, $options: "i" } },
    ],
  });
  if (courses.length === 0) {
    return res.status(404).json({ message: "No courses found" });
  }

  res.status(200).json({ courses });
});

export const getParticipants = TryCatch(async (req, res) => {
  const participants = await Enrollment.findOne({ course_id: req.params.id }).populate("participants.participant_id", "name email _id");

  return res.status(200).json({
    participants: participants.participants,
  });
});

export const fetchLectures = TryCatch(async (req, res) => {
  const lectures = await Lecture.find({ course: req.params.id });

  const user = await User.findById(req.user._id);

  if (user.role === "admin") {
    return res.json({ lectures });
  }

  if (!user.subscription.includes(req.params.id))
    return res.status(400).json({
      message: "You have not subscribed to this course",
    });

  res.json({ lectures });
});

export const fetchLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);

  const user = await User.findById(req.user._id);

  if (user.role === "admin") {
    return res.json({ lecture });
  }

  if (!user.subscription.includes(lecture.course))
    return res.status(400).json({
      message: "You have not subscribed to this course",
    });

  res.json({ lecture });
});

export const getMyCourses = TryCatch(async (req, res) => {
  const courses = await Courses.find({ _id: req.user.subscription });

  res.status(200).json({ courses });
});

export const addProgress = TryCatch(async (req, res) => {
  const progress = await Progress.findOne({
    user: req.user._id,
    course: req.query.course,
  });

  const { lectureId } = req.query;

  if (progress.completedLectures.includes(lectureId)) {
    return res.json({
      message: "Progress recorded",
    });
  }

  progress.completedLectures.push(lectureId);

  await progress.save();

  res.status(201).json({
    message: "new Progress added",
  });
});

export const getYourProgress = TryCatch(async (req, res) => {
  const progress = await Progress.find({
    user: req.user._id,
    course: req.query.course,
  });

  if (!progress) return res.status(404).json({ message: "null" });

  const allLectures = (await Lecture.find({ course: req.query.course })).length;

  const completedLectures = progress[0].completedLectures.length;

  const courseProgressPercentage = (completedLectures * 100) / allLectures;

  res.json({
    courseProgressPercentage,
    completedLectures,
    allLectures,
    progress,
  });
});

export const sendNotificationToCourseStudents = TryCatch(async (req, res) => {
  const { courseId, subject, message } = req.body;
  const senderId = req.user._id;

  if (!courseId || !senderId || !subject || !message) {
    return res.status(400).json({
      message: "Course ID, sender ID, subject, and message are required.",
    });
  }

  let file = null;
  if(req.file){
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const cldRes = await handleUpload(dataURI, "courses");
    file = {
      filename: req.file.originalname,
      path: cldRes.secure_url,
    };
  }

  // Find the course enrollment and populate participants
  const enrollment = await Enrollment.findOne({ course_id: courseId }).populate(
    "participants.participant_id",
    "email _id"
  );

  if (!enrollment) {
    return res.status(404).json({ message: "Course not found." });
  }

  // Filter students only
  const students = enrollment.participants.filter((p) => p.role === "student");

  if (students.length === 0) {
    return res.status(404).json({ message: "No students found in the course." });
  }

  // Create notification in the database
  const recipientIds = students.map((s) => s.participant_id._id);
  const notificationData = {
    sender: senderId,
    recipients: recipientIds,
    subject,
    message,
    file,
  };

  const notification = await Notification.create(notificationData);

  // Notify students via email
  const recipientEmails = students.map((s) => s.participant_id.email);
  let data;
  if(file){
    data = {sender: senderId, recipientEmails, message, file};
  }else{
    data = {sender: senderId, recipientEmails, message};
  }
  await sendNotificationMail(subject, data);

  // Notify students via socket
  // students.forEach((student) => {
  //   const studentSocketId = getReceiverSocketId(student.participant_id._id);
  //   if (studentSocketId) {
  //     io.to(studentSocketId).emit("newNotification", {
  //       notificationId: notification._id,
  //       subject,
  //       message,
  //       createdAt: notification.createdAt,
  //     });
  //   }
  // });

  res.status(200).json({ 
    message: "Notification sent successfully.",
    notification: notification,
   });
});