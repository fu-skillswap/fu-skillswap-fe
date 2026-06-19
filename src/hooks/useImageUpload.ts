// =====================================================================
// src/hooks/useImageUpload.ts
// =====================================================================
// Hook dùng chung cho mọi nơi cần upload ảnh/tệp ở FE:
//   1. User chọn file.
//   2. Hook upload thẳng file lên Cloudinary (không qua BE).
//   3. Hook gửi metadata (fileUrl, publicId, contentType, sizeBytes,
//      originalFilename) về BE để lưu DB (best-effort, xem src/api/media.ts).
//
// Dùng cho: avatar (Profile), ảnh đính kèm bài đăng (Forum/Dashboard),
// minh chứng xác thực mentor (nếu cần dùng luồng Cloudinary trực tiếp).

import { useCallback, useState } from 'react';
import { uploadToCloudinary, type CloudinaryUploadResult, type CloudinaryResourceType } from '../lib/cloudinary';
import { saveMediaToBackend, type MediaUsage } from '../api/media';

export interface UseImageUploadOptions {
  usage?: MediaUsage;
  resourceType?: CloudinaryResourceType;
  /** Giới hạn kích thước file (bytes). Mặc định 10MB. */
  maxSizeBytes?: number;
  /** Danh sách MIME type cho phép. Mặc định: ảnh phổ biến. */
  acceptedTypes?: string[];
}

export interface UseImageUploadResult {
  uploading: boolean;
  progress: number;
  error: string | null;
  result: CloudinaryUploadResult | null;
  /** Chọn + upload 1 file. Trả về kết quả Cloudinary nếu thành công, null nếu lỗi. */
  upload: (file: File) => Promise<CloudinaryUploadResult | null>;
  reset: () => void;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadResult {
  const {
    usage,
    resourceType = 'image',
    maxSizeBytes = DEFAULT_MAX_SIZE,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CloudinaryUploadResult | null>(null);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<CloudinaryUploadResult | null> => {
      setError(null);

      if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
        setError(`Định dạng file không hỗ trợ (${file.type || 'không xác định'}).`);
        return null;
      }
      if (file.size > maxSizeBytes) {
        setError(`File quá lớn (tối đa ${Math.round(maxSizeBytes / 1024 / 1024)}MB).`);
        return null;
      }

      setUploading(true);
      setProgress(0);

      try {
        const uploaded = await uploadToCloudinary(file, {
          resourceType,
          onProgress: setProgress,
        });

        setResult(uploaded);

        // Gửi metadata về BE — best-effort, không chặn luồng FE nếu BE chưa sẵn sàng.
        void saveMediaToBackend(uploaded, usage);

        return uploaded;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload thất bại, vui lòng thử lại.';
        setError(message);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [acceptedTypes, maxSizeBytes, resourceType, usage]
  );

  return { uploading, progress, error, result, upload, reset };
}
