import { v2 as cloudinary } from "cloudinary";

export const cloudinaryConfig = cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

export async function handleUpload(file, folder) {
const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
    folder: folder,
});
return res;
}
