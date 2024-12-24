import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructorFile: { type: String, required: true },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true }, // Thêm thông tin khóa học
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  submissions: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      fileUrl: { type: String, required: true },
    },
  ],
}, { timestamps: true });

export const Assignment = mongoose.model("Assignment", assignmentSchema);
