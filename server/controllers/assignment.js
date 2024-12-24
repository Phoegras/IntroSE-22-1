import TryCatch from "../middlewares/TryCatch.js";
import cloudinary from "../config/cloudinary.js";
import { Assignment } from "../models/Assignment.js";

export const createAssignment = TryCatch(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Upload file lên Cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    resource_type: "auto", // Để hỗ trợ các định dạng khác ngoài ảnh, như PDF
  });

  // Kiểm tra courseId
  if (!req.body.courseId) {
    return res.status(400).json({ message: "Course ID is required" });
  }

  // Tạo assignment sau khi upload thành công
  const assignment = await Assignment.create({
    title: req.body.title,
    description: req.body.description,
    instructorFile: result.secure_url,
    startDate: req.body.dueDate,
    dueDate: req.body.dueDate,
    courseId: req.body.courseId, // Thêm thông tin khóa học
    instructor: req.user._id,
  });

  res.status(201).json({ message: "Assignment created", assignment });
});

export const submitAssignment = TryCatch(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Upload file của sinh viên lên Cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    resource_type: "auto",
  });

  // Lấy bài tập bằng ID
  const assignment = await Assignment.findById(req.body.assignmentId);

  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  // Thêm thông tin nộp bài
  assignment.submissions.push({
    student: req.user._id,
    fileUrl: result.secure_url,
  });

  await assignment.save();

  res.status(200).json({ 
    message: "Assignment submitted", 
    assignment: {
      ...assignment.toObject(),
      courseId: assignment.courseId, // Đảm bảo trường courseId có trong phản hồi
    },
  });
});

export const getInstructorAssignments = TryCatch(async (req, res) => {
  const { courseId } = req.params;

  // Lấy danh sách bài tập của giảng viên trong khóa học
  const assignments = await Assignment.find({ 
    courseId, 
    instructor: req.user._id 
  });

  res.status(200).json({
    message: "Assignments fetched successfully",
    assignments,
  });
});

export const getStudentAssignments = TryCatch(async (req, res) => {
  const { courseId } = req.params;

  // Lấy danh sách bài tập theo khóa học
  const assignments = await Assignment.find({ courseId });

  res.status(200).json({
    message: "Assignments fetched successfully",
    assignments,
  });
});

export const getAssignmentDetails = TryCatch(async (req, res) => {
  const { assignmentId } = req.params;

  const assignment = await Assignment.findById(assignmentId)
    .populate("instructor", "name email")
    .populate("submissions.student", "name email");

  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  res.status(200).json({
    message: "Assignment details fetched successfully",
    assignment,
  });
});

export const updateAssignment = TryCatch(async (req, res) => {
  const { assignmentId } = req.params;

  const updateData = {
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
  };

  const assignment = await Assignment.findByIdAndUpdate(assignmentId, updateData, {
    new: true,
  });

  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  res.status(200).json({
    message: "Assignment updated successfully",
    assignment,
  });
});


export const deleteAssignment = TryCatch(async (req, res) => {
  const { assignmentId } = req.params;

  const assignment = await Assignment.findByIdAndDelete(assignmentId);

  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  res.status(200).json({ message: "Assignment deleted successfully" });
});


