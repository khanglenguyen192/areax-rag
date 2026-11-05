# 05 - MCP server

> Nhãn: **Đã chốt** / **Đề xuất**.

## 1. Trạng thái

- MCP server sẽ nằm ở `areax-rag-mcp/`. (Đã chốt)
- **Chỉ ghi nhận ở phase này, chưa implement.** (Đã chốt)
- Thư mục chỉ cần `README.md` ghi chú rằng thành phần này chưa làm. (Đề xuất)

## 2. Ràng buộc đã biết

- MCP là **internal**, không public ra internet; chỉ application là public. (Đã chốt)
- Khi implement, mcp là image thứ ba (cạnh `application` và `service`). (Đã chốt)
- Quy ước chung vẫn áp dụng: tài liệu tiếng Anh, có `README.md`, `docs/`, coding standard. (Đề xuất cho coding standard riêng của mcp)
- Quyền truy cập dữ liệu phải theo cùng quy tắc project: owner/member; thread chỉ chủ thread xem được. (Đề xuất)

## 3. Chưa bàn (để phase sau)

- MCP phơi bày những công cụ nào (ví dụ hỏi đáp trên một project, liệt kê tài liệu).
- Cách xác thực client MCP và ánh xạ sang user/project.
- Ngôn ngữ và thư viện (Python hay TypeScript).
- Cách triển khai và mở truy cập (vì internal, cần tunnel hoặc reverse proxy riêng).
