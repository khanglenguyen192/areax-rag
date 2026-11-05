# 00 - Tổng quan

> Tài liệu requirement đã chuẩn hoá của `areax-rag`. Bản gốc ghi lại quá trình trao đổi nằm ở `raw-business.md` và `raw-technical.md` (cùng thư mục).
> Nhãn trạng thái: **Đã chốt** = người dùng đã xác nhận. **Đề xuất** = đề xuất của Claude, người dùng chưa xác nhận rõ.

## 1. Mục tiêu

Một hệ thống web RAG kiểu NotebookLM. Người dùng tạo **project**, tải **tài liệu** lên, rồi **hỏi đáp** trên các tài liệu đó. Mỗi project có một **prompt** chung. Nhiều người có thể cùng làm việc trong một project.

Dự án gồm ba phần: **ứng dụng web có giao diện**, **MCP server** và **hạ tầng + deploy**.

## 2. Phạm vi phase này (Đã chốt)

- **Chỉ setup hạ tầng lên VPS**: Postgres, Kafka, Floci (AWS ảo) và tài nguyên AWS tạo bằng CloudFormation. Hạ tầng do người dùng tự chạy tay.
- **Application và Python service chạy trên máy cá nhân**, kết nối VPS qua SSH tunnel. Đưa lên VPS ở phase sau.
- **MCP server**: chỉ ghi nhận yêu cầu, chưa implement.
- **Chưa làm**: đăng ký tài khoản (sign up), admin toàn cục, trích dẫn nguồn, OCR, sao lưu dữ liệu, môi trường staging, CI/CD, quality gate, HTTPS và domain.

## 3. Thành phần và thư mục

Monorepo công khai tại `git@github.com:khanglenguyen192/areax-rag.git`. Branch mặc định `develop`, branch deploy `deployment/prod`.

| Thư mục | Vai trò | Ngôn ngữ / công nghệ |
|---|---|---|
| `areax-rag-application/` | Giao diện và server (BE) | Next.js, TypeScript, MUI + Bootstrap, SCSS, Prisma, Auth.js |
| `areax-rag-service/` | Các service xử lý: ingestion, chat | Python, Kafka consumer |
| `areax-rag-mcp/` | MCP server (chỉ ghi nhận) | Chưa chốt |
| `areax-rag-infra/` | Hạ tầng: Postgres, Kafka, Floci, CloudFormation, script | Docker Compose, bash, CloudFormation |
| `areax-rag-requirement/` | Requirement (`vi/` và `en/`) | Markdown |

## 4. Công nghệ chính (Đã chốt)

Next.js + TypeScript (atomic design), MUI + Bootstrap, SCSS, Postgres + Prisma, Auth.js (Credentials) + bcrypt, Python service, Kafka, SSE, Floci (S3, S3 Vectors, CloudFormation), OpenAI API (embedding `text-embedding-3-small`, LLM model rẻ).

## 5. Quy ước tài liệu và code (Đã chốt)

- Chỉ `areax-rag-requirement/` có hai bản **vi** và **en** cùng tên file. Mọi tài liệu khác viết **tiếng Anh**.
- Mỗi thư mục code có `README.md`, folder `docs/` và file coding standard riêng.
- Repo công khai: không commit API key, mật khẩu, SSH key, `.env` hay IP của VPS.

## 6. Thuật ngữ

| Từ | Nghĩa |
|---|---|
| Project | Không gian làm việc có tài liệu, prompt, thành viên |
| Owner / Member | Hai vai trò trong project |
| Source | Một tài liệu trong project: file tải lên hoặc phụ đề YouTube |
| Thread | Một hội thoại chat; thuộc về một user trong một project |
| Ingestion | Quá trình đọc tài liệu, cắt chunk, tạo embedding, lưu vector |

## 7. Mục lục

1. [01 - Yêu cầu chức năng](01-functional-requirements.md)
2. [02 - Yêu cầu phi chức năng](02-non-functional-requirements.md)
3. [03 - Kiến trúc](03-architecture.md)
4. [04 - Giao diện](04-ui.md)
5. [05 - MCP](05-mcp.md)
6. [06 - Triển khai](06-deployment.md)
7. [99 - Câu hỏi còn mở](99-open-questions.md)
