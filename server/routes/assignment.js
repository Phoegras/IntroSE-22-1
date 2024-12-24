import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { uploadFiles } from "../middlewares/multer.js";
import { 
  createAssignment,
  submitAssignment,
  getInstructorAssignments,
  getStudentAssignments,
  getAssignmentDetails,
  deleteAssignment,
  updateAssignment,
} from "../controllers/assignment.js";

const router = express.Router();

// Tạo assignment mới (giảng viên tải file lên)
router.post("/assignment", isAuth, uploadFiles, createAssignment);

// Nộp bài tập
router.post("/assignment/submit", isAuth, uploadFiles, submitAssignment);

// Lấy danh sách bài tập của giảng viên theo khóa học
router.get("/assignment/instructor/:courseId", isAuth, getInstructorAssignments);

// Lấy danh sách bài tập của sinh viên theo khóa học
router.get("/assignment/student/:courseId", isAuth, getStudentAssignments);

// Lấy chi tiết bài tập
router.get("/assignment/:assignmentId", isAuth, getAssignmentDetails);

// Xóa bài tập
router.delete("/assignment/:assignmentId", isAuth, deleteAssignment);

// Cập nhật bài tập
router.put("/assignment/:assignmentId", isAuth, updateAssignment);

export default router;
