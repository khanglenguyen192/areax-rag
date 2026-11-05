# 99 - Câu hỏi còn mở

> Tổng hợp những điểm chưa chốt sau khi chuẩn hoá. Điểm đã chốt nằm ở các file 00 đến 06.

## A. Cần người dùng quyết

1. **Mặc định README**: mỗi subfolder service Python có README riêng (ngắn)? `areax-rag-mcp/` chỉ có README ghi chú? (Đề xuất: có, và có.)
2. **Định dạng file và 50MB mỗi file** (FR-13): xác nhận chính thức. Có giới hạn **số file** mỗi project không?
3. **Tên model LLM** (đặt ở env) và các tham số truy xuất: kích thước chunk, overlap, top-k, giới hạn token đầu ra, số tin nhắn lịch sử mỗi lượt. Người dùng nói sẽ giới hạn chi phí sau.
4. **Bật/tắt từng tài liệu làm nguồn** cho câu trả lời: có hay không? (Người dùng nói chưa cần thêm tính năng.)
5. **Xử lý lỗi tài liệu**: PDF scan, file hỏng, video không có phụ đề; có cho thử lại không; có cho chọn ngôn ngữ phụ đề YouTube không.
6. **Thread**: tên tự đặt hay tự sinh; giới hạn số thread.
7. **Cách tính dung lượng 100MB** và thông báo khi vượt (FR-16).
8. **Coding standard**: đã viết cho `application`, `service`, `infra` (file `CODING_STANDARD.md` ở gốc mỗi thư mục; `areax-rag-service/` dùng một file chung). Còn mở: `mcp` có cần riêng không (chờ chọn ngôn ngữ); nội dung `docs/` (đề xuất: architecture, setup, biến môi trường, hợp đồng message, runbook). Các mục đánh dấu "provisional" trong coding standard cần bạn duyệt.
9. **Mở cổng**: giữ giả định không mở cổng nào ra internet ngoài application? (Mặc định: không mở.)
10. **Comment, commit message, tên biến** bằng tiếng Anh: xác nhận.
11. ~~Thư mục `hooks`~~: **đã chốt (đ46)**: `src/hooks/` chứa **React hook** (`useXxx`), không phải webhook. Hook dùng chung ở `hooks/common/`, hook lấy dữ liệu theo từng feature ở `hooks/<feature>/`. Claude từng hiểu nhầm là webhook.
12. **Tên topic Kafka** trong `areax-rag-infra/compose/kafka/topics.txt` là tên tạm; cần chốt cùng hợp đồng Kafka.
13. **Công cụ của application** (đang đánh dấu tạm trong coding standard): lint/format dùng ESLint + Prettier hay Biome; có dùng Storybook không; commit hooks và commitlint; npm hay pnpm. (Đã chốt: **không dùng TanStack Query**, **không cần test** cho application, đ41.)
14. **Công cụ của service Python** (đang đánh dấu tạm): `uv` hay `pip-tools` để khoá phiên bản; có dùng `import-linter` để ép kiến trúc tầng không; `pip-audit`; thư viện Kafka (ví dụ `confluent-kafka`) và driver Postgres (`psycopg` 3 hay SQLAlchemy Core); vòng lặp consumer đồng bộ (mặc định) hay dùng thread/`asyncio`; cách health check bằng heartbeat.

## B. Thiết kế kỹ thuật cần chốt

1. **Vector index**: một index dùng chung lọc `project_id` (đề xuất) hay mỗi project một index.
2. **Hợp đồng Kafka**: danh sách topic, schema message, partition key theo thread, gom token, tín hiệu kết thúc/lỗi, retry/DLQ, idempotency, truyền `requestId` làm correlation id.
3. **Nhận bù SSE**: dùng `Last-Event-ID` hay tải lại câu trả lời đã lưu.
4. **Luồng upload** (mục 4 của `03-architecture.md`): xác nhận; xử lý đua hai upload đồng thời.
5. **Ranh giới ghi Postgres**: bảng nào do application, bảng nào do service Python ghi; cách Python truy cập (SQL trực tiếp hay SQLAlchemy); cách phát hiện schema lệch.
6. **Cấu trúc monorepo**: thư mục chung cho hợp đồng message, compose cho local, quản lý `.env`, `.gitignore` trước commit đầu.
7. **UI**: cách dùng MUI + Bootstrap; thư viện i18n và lấy dữ liệu.
8. **Danh sách mã lỗi** và mã thành công cụ thể.
9. **Phiên bản Auth.js** cần kiểm tra khi bắt đầu code.
10. **Docker Hub**: kiểm tra chính sách private repo của gói free trước khi chốt cách dùng một repo.

## C. Cần thử hoặc đo

1. Kafka hai listener qua SSH tunnel.
2. `aws cloudformation deploy` trên Floci (S3 bucket, vector bucket, index).
3. RAM của Floci ở `hybrid`; đĩa và RAM VPS (chưa có kết quả `ssh floci 'df -h /; free -m; docker stats --no-stream'`). Từ đó biết VPS chứa được bao nhiêu project 100MB. Ước tính thô (chưa đo): ở mức trần, vector mỗi project vài trăm MB.
4. `youtube-transcript-api` trên VPS.
5. Mức cần thiết của mount `/var/run/docker.sock` cho Floci.

## D. Việc cần làm (không phải câu hỏi)

- ~~Viết bash script deploy CloudFormation và template (S3 bucket, vector bucket, index)~~: **đã viết** (`areax-rag-infra/scripts/deploy-cloudformation.sh`, `cloudformation/storage.yml`). Đã kiểm tra cú pháp và luồng bằng `aws` giả; **chưa thử trên Floci thật**.
- ~~Viết `README.md` và `docs/` cho từng thư mục code~~: **đã viết** cho application, service, mcp, infra. Coding standard đã viết cho application, service, infra; mcp chưa có. Application và service mới chỉ có tài liệu, chưa có code.
- Khởi tạo git và đẩy lên remote khi người dùng yêu cầu.
- Rà `.gitignore` và nội dung tài liệu trước commit đầu (repo công khai; đã quét thấy không có IP VPS, secret hay email).
