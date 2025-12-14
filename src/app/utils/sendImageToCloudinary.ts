import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import config from '../config';
import { UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

// For local file path upload
export const sendImageToCloudinary = (
  imageName: string,
  path: string,
): Promise<Record<string, unknown>> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      path,
      { public_id: imageName },
      function (error, result) {
        if (error) {
          return reject(error);
        }
        resolve(result as UploadApiResponse);
      },
    );
  });
};

// For buffer upload (Vercel serverless compatible)
export const sendImageToCloudinaryFromBuffer = (
  imageName: string,
  buffer: Buffer,
): Promise<Record<string, unknown>> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: imageName },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result as UploadApiResponse);
      },
    );
    uploadStream.end(buffer);
  });
};

// Use memory storage for Vercel serverless (no filesystem access)
const storage = multer.memoryStorage();

export const upload = multer({ storage: storage });
