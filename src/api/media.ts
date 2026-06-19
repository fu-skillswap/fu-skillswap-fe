// =====================================================================
// src/api/media.ts — gửi metadata file đã upload Cloudinary về BE để lưu DB
// =====================================================================
//
// LƯU Ý: Endpoint BE bên dưới (`/api/me/media`) là PLACEHOLDER — BE chưa
// có route này tại thời điểm viết code FE (sẽ bổ sung sau). Hàm này được
// viết "best-effort": nếu BE trả 404/lỗi, lỗi sẽ được nuốt (chỉ log warn)
// để không làm gãy luồng upload ảnh ở FE — ảnh vẫn nằm trên Cloudinary và
// `fileUrl` vẫn dùng được ngay, chỉ là chưa được BE ghi nhận vào DB.
//
// Khi BE có endpoint thật, chỉ cần sửa `MEDIA_ENDPOINT` (và bỏ phần
// try/catch nuốt lỗi nếu muốn báo lỗi rõ ràng cho người dùng).

import { http } from './http';
import type { CloudinaryUploadResult } from '../lib/cloudinary';

/** Mục đích sử dụng file — giúp BE phân loại (avatar / forum / mentor-doc...). */
export type MediaUsage = 'AVATAR' | 'FORUM_POST' | 'MENTOR_VERIFICATION' | 'OTHER';

export interface SaveMediaPayload {
  fileUrl: string;
  publicId: string;
  contentType: string;
  sizeBytes: number;
  originalFilename: string;
  usage?: MediaUsage;
}

export interface SaveMediaResponse {
  id?: string;
  fileUrl: string;
  publicId: string;
}

const MEDIA_ENDPOINT = '/api/me/media';

function toPayload(result: CloudinaryUploadResult, usage?: MediaUsage): SaveMediaPayload {
  return {
    fileUrl: result.fileUrl,
    publicId: result.publicId,
    contentType: result.contentType,
    sizeBytes: result.sizeBytes,
    originalFilename: result.originalFilename,
    usage,
  };
}

/**
 * Gửi metadata file (đã upload Cloudinary) về BE để lưu vào DB.
 * Best-effort: nếu BE chưa có endpoint này, lỗi sẽ chỉ log warn, không throw,
 * vì FE vẫn cần dùng được `fileUrl` ngay (đã có trên Cloudinary).
 */
export async function saveMediaToBackend(
  result: CloudinaryUploadResult,
  usage?: MediaUsage
): Promise<SaveMediaResponse | null> {
  try {
    return await http.post<SaveMediaResponse>(MEDIA_ENDPOINT, toPayload(result, usage));
  } catch (err) {
    console.warn(
      `[media] BE chưa lưu được metadata file (endpoint ${MEDIA_ENDPOINT} có thể chưa tồn tại). ` +
        'File vẫn đã upload thành công lên Cloudinary.',
      err
    );
    return null;
  }
}
