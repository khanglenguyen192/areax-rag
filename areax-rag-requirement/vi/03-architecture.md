# 03 - Kiến trúc

> Nhãn: **Đã chốt** / **Đề xuất**.

## 1. Tổng thể

```
Trình duyệt ──HTTP/SSE──> Application (Next.js)  [public]
                              │  Prisma         │  Kafka producer/consumer
                              ▼                 ▼
                         Postgres  <───────>  Kafka  <──> Python service (ingestion, chat)
                                                              │        │
                                                              ▼        ▼
                                                     Floci: S3 + S3 Vectors      OpenAI API
```

Chỉ **Application** public. Mọi thứ còn lại là internal. (Đã chốt)

## 2. Thành phần

| Thành phần | Chức năng | Trạng thái |
|---|---|---|
| Application (Next.js) | UI, API (route handler), Auth.js, Prisma, SSE, Kafka producer/consumer | Đã chốt |
| Service `ingestion` | Đọc tài liệu -> cắt chunk -> embedding -> ghi vector và trạng thái | Đề xuất |
| Service `chat` | Truy xuất vector -> gọi LLM stream -> đẩy token vào Kafka -> lưu câu trả lời | Đề xuất |
| Postgres | Dữ liệu nghiệp vụ (user, project, thành viên, tài liệu, thread, tin nhắn) | Đã chốt |
| Kafka | Truyền câu hỏi và token câu trả lời | Đã chốt |
| Floci | S3 (file), S3 Vectors (vector), CloudFormation | Đã chốt |
| OpenAI API | Embedding `text-embedding-3-small`, LLM model rẻ | Đã chốt |

Hai service Python là Kafka consumer, không có HTTP. (Đề xuất)

## 3. Luồng chat (Đã chốt)

1. UI gửi câu hỏi bằng **HTTP POST**.
2. Application kiểm tra quyền (từ Postgres), rồi đẩy câu hỏi vào **Kafka**.
3. Service `chat` truy xuất đoạn liên quan trong S3 Vectors, gọi LLM, đẩy **từng token** vào Kafka.
4. Application nhận token từ Kafka và đẩy xuống UI qua **SSE**.
5. Khi kết thúc stream, câu trả lời hoàn chỉnh được **lưu vào Postgres**. Lịch sử chat không phụ thuộc luồng SSE.

Chi tiết:
- SSE chỉ đẩy cho **user sở hữu thread**. Mỗi tab mở **một** luồng SSE cho cả user (HTTP/1.1 giới hạn khoảng 6 kết nối mỗi origin).
- Kafka consumer trong Next.js khởi tạo **một lần** khi server khởi động, rồi chia tin theo user/thread. Chỉ phù hợp một instance.
- Mỗi token là một message Kafka. Cần gom nhỏ, partition key theo thread, tín hiệu kết thúc và lỗi. (Đề xuất, chưa thiết kế chi tiết)
- Cần cách nhận bù khi mất kết nối (`Last-Event-ID`) hoặc tải lại câu trả lời đã lưu. (Đề xuất)
- Khung sự kiện SSE thống nhất: loại `token`, `done`, `error`, kèm `threadId`/`messageId`; lỗi dùng cùng mã lỗi với API. (Đề xuất)

## 4. Luồng upload và ingestion (Đề xuất)

1. UI xin **presigned URL** từ application. Application kiểm tra quyền và **tổng dung lượng project** (<= 100MB) trước khi cấp.
2. UI tải file thẳng lên **S3** (Floci), rồi báo lại application.
3. Application xác nhận kích thước thật (S3 HEAD), lưu bản ghi tài liệu, phát message **Kafka**. (Floci không đẩy event S3 sang Kafka, nên application là bên phát.)
4. Service `ingestion` đọc file, trích văn bản, cắt chunk, gọi OpenAI embedding, ghi vector vào **S3 Vectors** kèm metadata `project_id`, `document_id`, và cập nhật trạng thái tài liệu trong Postgres.
5. Nguồn YouTube: lấy phụ đề bằng `youtube-transcript-api`, sau đó đi tiếp từ bước 4.
6. Xoá tài liệu: xoá file S3 và vector theo `document_id`. Xoá project: xoá tất cả.

Cần xử lý đua hai upload đồng thời cùng làm vượt 100MB (khoá hoặc kiểm tra lại trong transaction).

## 5. Lưu trữ vector (Đề xuất)

- Dùng **S3 Vectors** của Floci, không tự dựng index.
- **Một index dùng chung** (1536 chiều, cosine) tạo sẵn bằng CloudFormation; lọc theo `project_id` bằng filter của S3 Vectors (lọc trước khi xếp hạng). Phương án khác: mỗi project một index (tạo lúc runtime, ngoài CloudFormation).
- Lưu tên model embedding và số chiều cùng index; đổi model thì index lại.

## 6. Cơ sở dữ liệu và quyền sở hữu schema

- **Postgres** là nguồn dữ liệu nghiệp vụ. (Đã chốt)
- **Prisma** là ORM của application; **application sở hữu schema và migration**. (Prisma đã chốt; quyền sở hữu là đề xuất)
- **Python service ghi thẳng vào Postgres** (trạng thái tài liệu, lưu câu trả lời) nhưng không dùng Prisma; cần quy ước bảng nào do ai ghi và cách giữ schema khớp. (Đã chốt ghi thẳng; quy ước còn mở)

## 7. Xác thực và phân quyền

- **Auth.js** với Credentials provider (username + mật khẩu **bcrypt**). Không bật đăng ký. (Đã chốt)
- JWT chỉ nhận diện user; **quyền kiểm tra từ Postgres mỗi request**; kiểm tra thêm cờ account còn hoạt động. (Đã chốt hướng)
- Mọi truy cập của người dùng đi qua application; application kiểm tra quyền trước khi phát Kafka.

## 8. Khung response API (Đã chốt)

Mọi API của application (cả thành công và lỗi) dùng cùng một khung; trường null/undefined bị bỏ khỏi JSON:

```ts
interface ApiResponse<T = unknown> {
  status: number;        // same as the HTTP status
  code: string;          // "OK" on success, stable UPPER_SNAKE code on error
  message: string;       // for debugging, not shown to users
  requestId: string;     // unique per request, also sent as X-Request-Id
  timestamp: string;     // ISO-8601 UTC
  data?: T;
  errors?: { field: string; code: string }[]; // validation errors only
}
```

- Dùng **HTTP status đúng nghĩa**; phân biệt thành công/lỗi bằng `status` (< 400 là thành công).
- `code` ổn định để UI dịch theo locale; thành công dùng mã cố định như `OK`, `CREATED`.
- Phân trang đặt trong `data`: `{ items, page, pageSize, total }`.
- Một helper duy nhất tạo response và bắt lỗi; không lộ stack trace.
- Danh sách mã lỗi đặt ở một file dùng chung và ghi trong `docs/`.
- Chưa dùng versioning URL (`/api/v1`).
- Phạm vi: API của application. Giao tiếp Kafka có **hợp đồng message riêng** (đặt chung trong repo; còn mở).

## 9. Image Docker (Đã chốt)

- Toàn dự án **2 image**: `application` (Node) và `service` (Python, dùng chung cho mọi Python service); thêm `mcp` khi implement.
- Một Dockerfile ở gốc `areax-rag-service/`; một package Python `areax_service` chứa phần dùng chung và từng service; các container khác nhau ở `command` (`python -m areax_service.ingestion`, `python -m areax_service.chat`).
- Compose chạy cùng một image nhiều lần, mỗi container có giới hạn RAM và restart riêng.
- Không gộp application và service vào một image.
- Đánh đổi chấp nhận: image lớn hơn, deploy tạo lại mọi container service cùng lúc, dùng chung phiên bản thư viện. Tách lại khi một service cần thư viện rất nặng hoặc scale riêng.

## 10. Cấu trúc service Python (Đề xuất)

Một package `areax_service` (bố cục `src/`), chia tầng theo kiểu **ports và adapters**; tầng ngoài phụ thuộc tầng trong, không ngược lại:

```
areax-rag-service/
  pyproject.toml, Dockerfile, README.md, CODING_STANDARD.md, docs/
  src/areax_service/
    core/         # cấu hình gốc, logging, lỗi, tắt máy an toàn
    domain/       # luật nghiệp vụ thuần (trạng thái tài liệu, khoá vector)
    contracts/    # mô hình message Kafka, tên topic
    ports/        # interface (Protocol) cho từng hệ thống bên ngoài
    adapters/     # Kafka, Postgres, S3/S3 Vectors, OpenAI, extractor, YouTube (nơi duy nhất import SDK)
    ingestion/    # python -m areax_service.ingestion  (use case, handler, bootstrap)
    chat/         # python -m areax_service.chat       (use case, handler, bootstrap)
```

- Logic nghiệp vụ chỉ nói chuyện với **ports**; chỉ `adapters/` import `boto3`, `psycopg`, `confluent_kafka`, `openai`.
- `ingestion` và `chat` không import lẫn nhau, và không import `adapters/` ngoại trừ `bootstrap.py` của chính nó.
- Quy tắc tầng được kiểm tra bằng `import-linter` (tạm). Chi tiết: `areax-rag-service/CODING_STANDARD.md` và `docs/architecture.md`.

Tham khảo `ocr-rag` (phía local, ngoài repo): FastAPI + Pydantic Settings, `pymupdf4llm` cho PDF văn bản, `youtube-transcript-api` cho YouTube. Phần OCR không dùng.

## 11. Giới hạn đã biết của Floci

- **S3 Vectors** hỗ trợ: tạo bucket/index, put/get/delete/query vector, filter metadata (`$eq`, `$in`, `$and`, `$or`...), 1..4096 chiều. Không mã hoá KMS thật. Chưa rõ định dạng lưu và hiệu năng.
- **S3**: multipart (part không cuối >= 5 MiB), presigned URL, CORS, event notification (SQS/SNS/Lambda). Bucket policy không được thực thi mặc định.
- **CloudFormation**: hỗ trợ S3, S3 Vectors, IAM, SQS, SNS... Loại không hỗ trợ bị bỏ qua (chỉ log WARN); nên đặt `FLOCI_SERVICES_CLOUDFORMATION_ALLOW_STUB_UNSUPPORTED_RESOURCE_TYPES=false`. `aws cloudformation deploy` chưa được tài liệu xác nhận, cần thử.
- Không có hạn mức dung lượng riêng; giới hạn là ổ đĩa VPS. Chưa rõ chế độ `hybrid` có giữ dữ liệu trong RAM không; cần đo.
- Mount `/var/run/docker.sock` cấp quyền rất cao; cần xem có thật sự cần không.
