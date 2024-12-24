import multer from "multer";
import { v4 as uuid } from "uuid";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads");
  },
  filename(req, file, cb) {
    const id = uuid();
    const extName = file.originalname.split(".").pop();
    const fileName = `${id}.${extName}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "application/pdf"]; // Các loại file được phép
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type"), false); // Nếu loại file không hợp lệ, trả về lỗi
  }
  cb(null, true); // Nếu loại file hợp lệ, cho phép tải lên
};

export const uploadFiles = multer({ storage, fileFilter }).single("file");
