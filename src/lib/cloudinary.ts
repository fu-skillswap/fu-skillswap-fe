/**
 * Upload trực tiếp từ FE lên Cloudinary (unsigned upload preset), không qua BE.
 *
 * Luồng:
 *  1. User chọn file ở FE.
 *  2. FE gọi `uploadToCloudinary(file)` -> upload thẳng lên Cloudinary.
 *  3. Cloudinary trả về URL công khai + metadata (publicId, bytes, format...).
 *  4. FE gửi metadata đó (fileUrl, publicId, contentType, sizeBytes, originalFilename)
 *     về BE để lưu vào DB — xem `src/api/media.ts`.
 *
 * Cấu hình cần thiết trong .env (xem .env.example):
 *  - VITE_CLOUDINARY_CLOUD_NAME
 *  - VITE_CLOUDINARY_UPLOAD_PRESET (phải là unsigned preset, tạo trong Cloudinary Console)
 */

export type CloudinaryResourceType = 'image' | 'video' | 'auto';

export interface CloudinaryUploadResult {
  /** URL công khai (https) của file đã upload — lưu cái này vào DB. */
  fileUrl: string;
  /** Public ID trên Cloudinary — cần để sau này xoá/transform ảnh. */
  publicId: string;
  /** Loại nội dung, ví dụ "image/jpeg". */
  contentType: string;
  /** Kích thước file (bytes). */
  sizeBytes: number;
  /** Tên file gốc lúc user chọn upload. */
  originalFilename: string;
  /** Định dạng Cloudinary trả về (jpg, png, pdf...). */
  format: string;
  width?: number;
  height?: number;
}

export interface UploadToCloudinaryOptions {
  resourceType?: CloudinaryResourceType;
  /** Callback % tiến trình upload (0-100), dùng để hiện progress bar. */
  onProgress?: (percent: number) => void;
  /** Cho phép hủy upload đang chạy. */
  signal?: AbortSignal;
}

function getCloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Thiếu cấu hình Cloudinary. Vui lòng khai báo VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET trong file .env.'
    );
  }

  return { cloudName, uploadPreset };
}

/**
 * Upload 1 file thẳng lên Cloudinary từ phía FE (unsigned upload).
 * Dùng XMLHttpRequest (thay vì fetch) để có thể theo dõi % tiến trình upload.
 */
export function uploadToCloudinary(
  file: File,
  options: UploadToCloudinaryOptions = {}
): Promise<CloudinaryUploadResult> {
  const { resourceType = 'auto', onProgress, signal } = options;
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        let message = `Upload Cloudinary thất bại (HTTP ${xhr.status}).`;
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed?.error?.message) message = parsed.error.message;
        } catch {
          // ignore parse error, dùng message mặc định
        }
        reject(new Error(message));
        return;
      }

      try {
        const data = JSON.parse(xhr.responseText);
        resolve({
          fileUrl: data.secure_url,
          publicId: data.public_id,
          contentType: data.resource_type && data.format ? `${data.resource_type}/${data.format}` : file.type,
          sizeBytes: data.bytes ?? file.size,
          originalFilename: data.original_filename || file.name,
          format: data.format,
          width: data.width,
          height: data.height,
        });
      } catch {
        reject(new Error('Không đọc được phản hồi từ Cloudinary.'));
      }
    };

    xhr.onerror = () => reject(new Error('Lỗi kết nối khi upload lên Cloudinary.'));
    xhr.onabort = () => reject(new Error('Đã hủy upload.'));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
      } else {
        signal.addEventListener('abort', () => xhr.abort());
      }
    }

    xhr.send(formData);
  });
}
