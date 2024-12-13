// import { instance } from "../index.js";
import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { User } from "../models/User.js";
import crypto from "crypto";
import { Payment } from "../models/Payment.js";
import { Progress } from "../models/Progress.js";

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

// Add a course
export const addCourse = TryCatch(async (req, res) => {
  const { title, description, image, startTime, endTime, duration, category } = req.body;

  if (!title || !description || !duration || !category) {
    return res.status(400).json({ message: 'All fields except image, startTime and endTime are required.' });
  }

  const newCourse = new Courses({
    title,
    description,
    image,
    startTime,
    endTime,
    duration,
    category
  });

  await newCourse.save();

  res.status(201).json({
    message: 'Course added successfully.',
    course: newCourse,
  });
});

// Add many courses
export const addManyCourses = TryCatch(async (req, res) => {
  const { courses } = req.body;

  if (!Array.isArray(courses) || courses.length === 0) {
    return res.status(400).json({ message: 'Please provide an array of courses.' });
  }

  const createdCourses = await Courses.insertMany(courses);

  res.status(201).json({
    message: 'Courses added successfully.',
    courses: createdCourses,
  });
});

// Delete a course
export const deleteCourse = TryCatch(async (req, res) => {
  const { id } = req.params;

  const course = await Courses.findByIdAndDelete(id);

  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  res.json({
    message: 'Course deleted successfully.',
    course,
  });
});

// Delete many courses
export const deleteManyCourses = TryCatch(async (req, res) => {
  const { ids } = req.body;

  // Validate that ids is an array of ObjectId-like strings
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Please provide a valid array of course IDs.' });
  }

  // Ensure all IDs are valid ObjectId strings
  const isValidObjectId = ids.every(id => /^[a-fA-F0-9]{24}$/.test(id));
  if (!isValidObjectId) {
    return res.status(400).json({ message: 'Invalid course ID(s) provided.' });
  }

  const deletedCourses = await Courses.deleteMany({ _id: { $in: ids } });

  res.json({
    message: `${deletedCourses.deletedCount} course(s) deleted successfully.`,
    result: deletedCourses,
  });
});

// Modify course info
export const modifyCourse = TryCatch(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const updatedCourse = await Courses.findByIdAndUpdate(id, updates, { new: true });

  if (!updatedCourse) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  res.json({
    message: 'Course updated successfully.',
    course: updatedCourse,
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

  res.json({
    courses,
  });
});

export const checkout = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  const course = await Courses.findById(req.params.id);

  if (user.subscription.includes(course._id)) {
    return res.status(400).json({
      message: "You already have this course",
    });
  }

  const options = {
    amount: Number(course.price * 100),
    currency: "INR",
  };

  const order = await instance.orders.create(options);

  res.status(201).json({
    order,
    course,
  });
});

export const paymentVerification = TryCatch(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.Razorpay_Secret)
    .update(body)
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    await Payment.create({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    const user = await User.findById(req.user._id);

    const course = await Courses.findById(req.params.id);

    user.subscription.push(course._id);

    await Progress.create({
      course: course._id,
      completedLectures: [],
      user: req.user._id,
    });

    await user.save();

    res.status(200).json({
      message: "Course Purchased Successfully",
    });
  } else {
    return res.status(400).json({
      message: "Payment Failed",
    });
  }
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
