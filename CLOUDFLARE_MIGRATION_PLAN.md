# Kế hoạch chuyển FE (fu-skillswap-fe) từ Vercel sang Cloudflare Pages

## 1. Hiện trạng (đã rà soát trong repo)

- FE: Vite + React 19 + TypeScript, build ra `dist/`, build command `npm run build`, output `dist`.
- `vercel.json` đang làm 2 việc:
  1. Rewrite `/api/:path*` → `http://103.200.23.169:8080/api/:path*` (proxy server-side để tránh mixed content HTTPS→HTTP và tránh CORS, vì request từ browser là same-origin với domain Vercel).
  2. SPA fallback: mọi route khác → `/index.html`.
- `src/api/client.ts`: nếu có `VITE_API_BASE_URL` thì dùng giá trị đó; nếu không và đang chạy HTTPS thì dùng baseURL rỗng (dựa vào rewrite ở trên); nếu chạy HTTP (dev local) thì gọi thẳng `http://103.200.23.169:8080`.
- BE (Spring Boot) CORS hiện chỉ cho phép origin `localhost:3000/5173/8080` qua biến `CORS_ALLOWED_ORIGIN_PATTERNS` — domain Vercel/Cloudflare production **chưa** có trong allowlist này (cần bổ sung khi BE được gọi trực tiếp, không qua rewrite).
- Phát hiện quan trọng: mọi request thử tới `103.200.23.169:8080` từ hạ tầng ngoài (sandbox của tôi, có thể cả Vercel rewrite) đều bị chặn/treo — nghi backend đang giới hạn theo IP nguồn (firewall/security group). Cần xác nhận và mở allowlist này, **độc lập với việc chọn Vercel hay Cloudflare** — nếu không sửa, FE trên Cloudflare cũng sẽ gặp lỗi tương tự khi gọi BE.

## 2. Tương đương trên Cloudflare Pages

| Vercel | Cloudflare Pages |
|---|---|
| `vercel.json` rewrites `/api/*` | `public/_redirects` với dòng `/api/* http://103.200.23.169:8080/api/:splat 200` HOẶC một Pages Function tại `functions/api/[[path]].ts` để proxy (linh hoạt hơn, có thể set header, retry, timeout). |
| `vercel.json` SPA fallback | `public/_redirects`: `/* /index.html 200` |
| Build command/Output dir trong Vercel dashboard | Cloudflare Pages project settings: Build command `npm run build`, Build output directory `dist` |
| Env vars (`VITE_API_BASE_URL`) trong Vercel dashboard | Cloudflare Pages → Settings → Environment variables (set riêng cho Production/Preview) |
| Vercel preview deployments theo branch/PR | Cloudflare Pages cũng tự tạo preview deployment theo branch/PR (tương tự) |

Lưu ý: Cloudflare Pages **không hỗ trợ rewrite proxy tới origin ngoài qua `_redirects` với HTTP (chỉ hỗ trợ redirect 301/302/200 dạng "serve trang khác trong cùng site", không proxy connect tới origin bên ngoài như Vercel rewrite làm)**. Vì vậy cách chắc ăn nhất là dùng **Pages Functions** (Cloudflare Workers chạy kèm Pages) để tự viết route proxy `/api/*` → backend, tương đương `vercel.json` rewrite hiện tại.

## 3. Các bước thực hiện

1. **Chuẩn bị Pages Function proxy** (thay cho vercel rewrite):
   - Tạo `functions/api/[[path]].ts` trong `fu-skillswap-fe`, forward request nguyên vẹn (method, headers, body) tới `${BACKEND_URL}/api/...`, trả response về nguyên vẹn.
   - Đưa `BACKEND_URL` vào Cloudflare env var (không hardcode IP trong code, để dễ đổi khi backend đổi host).
2. **Thêm `public/_redirects`** chỉ còn dòng SPA fallback: `/* /index.html 200`.
3. **Tạo project Cloudflare Pages**:
   - Kết nối repo Git (GitHub) — connect cùng repo `fu-skillswap-fe`.
   - Build command: `npm run build`; Output directory: `dist`; Node version: khớp với hiện tại (Node 22 theo lockfile/engine nếu có khai báo, nếu chưa khai báo thì set qua biến `NODE_VERSION` hoặc file `.nvmrc`).
   - Khai báo env var `BACKEND_URL` (và `VITE_API_BASE_URL` nếu vẫn muốn build-time override).
4. **Cập nhật BE**:
   - Thêm domain Cloudflare Pages (`*.pages.dev` lúc test, domain thật lúc go-live) vào `CORS_ALLOWED_ORIGIN_PATTERNS` — phòng trường hợp FE gọi trực tiếp BE (không qua proxy) hoặc Pages Function gọi qua server-side (không bị CORS nhưng nên đồng bộ).
   - Mở firewall/security group BE cho phép traffic từ Cloudflare (Cloudflare có dải IP công khai cần whitelist nếu BE đang lọc theo IP — xem https://www.cloudflare.com/ips/). Đây là việc bắt buộc phải làm trước khi cutover, nếu không proxy sẽ lỗi giống bên Vercel hiện tại.
5. **Deploy thử lên domain tạm `*.pages.dev`**, test toàn bộ luồng: đăng nhập (Google OAuth — cần thêm domain mới vào danh sách Authorized redirect URI/JS origin trên Google Cloud Console), tìm mentor, đặt lịch, upload tài liệu xác minh mentor (Cloudinary/R2)...
6. **Cutover DNS**: trỏ domain chính (nếu có domain riêng, ví dụ skillswap.vn) sang Cloudflare Pages thay vì Vercel; nếu domain đang quản lý trên Cloudflare DNS thì chỉ cần thêm custom domain trong Pages project.
7. **Rollback plan**: giữ project Vercel hoạt động song song trong giai đoạn chuyển tiếp (không xoá ngay); nếu Cloudflare gặp lỗi, trỏ DNS lại Vercel trong vài phút.
8. **Dọn dẹp**: sau khi ổn định 1–2 tuần, gỡ project Vercel hoặc chuyển về dạng "cold standby".

## 4. Việc cần làm trước (không phụ thuộc Cloudflare hay Vercel)

- Xác nhận & mở allowlist IP/firewall trên VPS backend cho traffic từ bên ngoài mạng nội bộ (Vercel, Cloudflare, người dùng thật ở các mạng khác nhau) — đây là nguyên nhân nghi vấn chính khiến FE trên Vercel hiện không gọi được BE.
- Xem xét gắn domain + HTTPS thật cho backend (vd `api.skillswap.vn` qua Cloudflare Tunnel hoặc Let's Encrypt) thay vì gọi thẳng IP:8080 plain HTTP — giúp tránh mixed content, ổn định hơn khi đổi hạ tầng, và Cloudflare có thể proxy thẳng (orange-cloud) mà không cần Pages Function tự viết.
