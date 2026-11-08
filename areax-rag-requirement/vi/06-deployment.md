# 06 - Triển khai

> Nhãn: **Đã chốt** / **Đề xuất**. Không ghi IP VPS, tên user SSH hay secret vào tài liệu (repo công khai).

## 1. Môi trường (Đã chốt)

- Chỉ có **local (dev)** và **VPS (prod)**. Không có staging.
- VPS: khoảng 4GB RAM, 2 core. Có alias SSH `floci` trên máy cá nhân.

## 2. Phase này: hạ tầng lên VPS (Đã chốt)

- VPS chạy **Postgres, Kafka, Floci**. Người dùng **tự chạy tay** (Docker Compose); **không có CI/CD cho hạ tầng**.
- Tài nguyên AWS ảo (bucket S3, vector bucket, index) tạo bằng **CloudFormation**; template đặt trong `areax-rag-infra/`.
- Cần một **bash script deploy CloudFormation** (đặt trong `areax-rag-infra/`): chạy từ máy cá nhân qua tunnel (`--endpoint-url http://localhost:4566`), **chạy lặp lại được** (tạo mới hoặc cập nhật), không chứa secret hay IP thật.
- Application và Python service chạy trên máy cá nhân, kết nối VPS qua tunnel.
- `areax-rag-infra/` có `README.md` và `docs/` hướng dẫn chạy lặp lại được, kèm **compose cho Postgres, Kafka, Floci** (`compose/`) và các script `infra.sh`, `init-kafka-topics.sh`, `tunnel.sh`, `deploy-cloudformation.sh`. Postgres tự tạo role và database cho application ở lần khởi động đầu; Kafka tạo topic từ `compose/kafka/topics.txt` (tên topic chỉ là tạm). (Đã chốt hướng; **chưa thử trên VPS thật**, danh sách cần thử ở `areax-rag-infra/docs/known-risks.md`)
- Thay đổi trong `areax-rag-infra/` **không kích hoạt redeploy** application/service. (Đã chốt)

## 3. Mạng và cổng (Đã chốt)

Mọi cổng trên VPS chỉ bind `127.0.0.1`, **không mở ra internet**. Truy cập qua SSH tunnel (`-L`).

| Dịch vụ | Cổng trên VPS | Cổng tunnel trên máy cá nhân |
|---|---|---|
| Postgres | 5432 | 5432 (hoặc 5433 nếu máy đã có Postgres) |
| Kafka (listener EXTERNAL) | 9094 | 9094 |
| Floci | 4566 | 4566 |

- **Kafka dùng hai listener** (một broker): `INTERNAL` (ví dụ `kafka:9092`) cho container trên VPS; `EXTERNAL` (9094) với `advertised.listeners=localhost:9094`, publish chỉ `127.0.0.1:9094`. Client trên máy cá nhân dùng bootstrap `localhost:9094`. Chỉ đúng khi một broker. (Đề xuất, **chưa thử thực tế**)
- SSH config nên có `ServerAliveInterval`, `ServerAliveCountMax`; cân nhắc `autossh` để tự nối lại. (Đề xuất)
- Floci chạy `FLOCI_STORAGE_MODE=hybrid`, dữ liệu ở volume riêng. Kiểm tra lại việc mount `/var/run/docker.sock`.

## 4. CI/CD (đã viết workflow cho application; phần còn lại hoãn)

Workflow của **application** đã viết (`.github/workflows/application-deploy.yml`, mô tả trong `areax-rag-application/docs/deployment.md`) nhưng **chưa chạy lần nào**. Service, mcp và infra chưa có. Hướng (Đã chốt hướng chung, chi tiết là đề xuất):

- Branch làm việc `develop`; merge vào `deployment/prod` thì deploy. **Không có quality gate.** (Đã chốt)
- **Mỗi thành phần một workflow** (application, service, mcp, infra) với `on.push.paths`, có `workflow_dispatch` để chạy tay. (Đã chốt: chạy riêng theo thư mục)
- Registry **Docker Hub**, **một repo** phân biệt bằng tag theo thành phần (application dùng `application-<sha>`, service sẽ dùng `service-<sha>`). Chính sách private repo của gói free chưa kiểm chứng. (Đã chốt registry; cách dùng repo là đề xuất)
- **Build trên runner của GitHub**, không build trên VPS. Gắn tag theo git SHA. (Đề xuất)
- Deploy qua **SSH**: `docker compose pull && docker compose up -d`. Không đặt self-hosted runner trên VPS. (Đề xuất)
- Trên VPS, `docker login` một lần bằng token chỉ đọc; runner dùng token ghi riêng lưu trong GitHub Secrets. Repo công khai nên VPS clone qua HTTPS không cần credential. (Đề xuất)
- `concurrency` group, health check sau deploy, migration trước khi khởi động bản mới, rollback bằng deploy lại tag SHA cũ. (Đề xuất)
- Giới hạn ai được merge vào `deployment/prod`. (Đề xuất)

## 5. Domain và HTTPS (hoãn)

Chưa có domain; sẽ mua sau. Khi có: thêm reverse proxy (Caddy/Nginx) và chứng chỉ cho UI và SSE. Trước đó chạy HTTP (rủi ro đã ghi ở `02-non-functional-requirements.md`).

## 6. Repo công khai

- Không commit API key, mật khẩu, SSH key, `.env`, IP VPS. Rà `.gitignore` trước commit đầu tiên.
- Cấu hình trong `areax-rag-infra/` không chứa IP hay secret thật; giá trị nhạy cảm chỉ nằm ở GitHub Secrets hoặc `.env` trên VPS.
- Chưa `git init`/push; làm khi người dùng yêu cầu.

## 7. Cần thử thực tế

1. Kafka hai listener qua SSH tunnel từ máy cá nhân.
2. `aws cloudformation deploy` trên Floci với `AWS::S3::Bucket` và `AWS::S3Vectors::Index`.
3. RAM thực tế của Floci ở chế độ `hybrid`; đĩa và RAM còn trống của VPS (`df -h /`, `free -m`, `docker stats`).
4. `youtube-transcript-api` khi chạy trên VPS (IP có thể bị chặn).
