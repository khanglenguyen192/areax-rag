# 02 - Yêu cầu phi chức năng

> Nhãn: **Đã chốt** / **Đề xuất**.

## 1. Tài nguyên và hiệu năng

- **NFR-1** VPS có khoảng **4GB RAM, 2 core**. Ở phase này VPS chỉ chạy Postgres, Kafka, Floci. Mọi container cần **giới hạn RAM** riêng. (Đã chốt VPS; giới hạn RAM là đề xuất)
- **NFR-2** Câu trả lời hiển thị **dần theo từng token**, không chờ trả một lần. (Đã chốt)
- **NFR-3** Mỗi project tối đa **100MB** tài liệu. Giới hạn có thể đổi bằng cấu hình. (Đã chốt)
- **NFR-4** Độ trễ stream tăng do đi qua SSH tunnel tới VPS; chấp nhận được cho chat. (Đã chốt)

## 2. Bảo mật

- **NFR-5** **Chỉ application (Next.js) public ra ngoài.** Postgres, Kafka, Floci, Python service, MCP đều internal. (Đã chốt)
- **NFR-6** Mọi cổng trên VPS **chỉ bind `127.0.0.1`**; truy cập từ máy cá nhân qua SSH tunnel. Lý do: Docker publish cổng bỏ qua `ufw`. (Đã chốt)
- **NFR-7** Mật khẩu băm bằng **bcrypt**. (Đã chốt)
- **NFR-8** **Quyền owner/member kiểm tra từ Postgres ở mỗi request**; JWT chỉ nhận diện user, không chứa quyền. Nhờ đó remove member có hiệu lực ngay. (Đã chốt hướng, chi tiết là đề xuất)
- **NFR-9** Application kiểm tra quyền **trước khi** phát message Kafka vì service nội bộ tin vào message. (Đề xuất)
- **NFR-10** Secret (API key, mật khẩu DB...) nằm trong biến môi trường, `.env` (gitignore) hoặc GitHub Secrets. Không commit. Repo công khai nên cần rà `.gitignore` trước commit đầu tiên. (Đã chốt)
- **NFR-11** SSH vào VPS dùng key, tắt đăng nhập bằng mật khẩu. (Đề xuất)
- **NFR-12** **Rủi ro đã biết:** chưa có HTTPS (chưa có domain), nên trang login chạy qua HTTP. Domain sẽ mua sau, khi đó thêm reverse proxy và chứng chỉ. (Đã chốt)

## 3. Độ tin cậy và dữ liệu

- **NFR-13** **Không sao lưu dữ liệu** ở phase này; chấp nhận dữ liệu thử nghiệm có thể mất. (Đã chốt)
- **NFR-14** Floci chạy chế độ `hybrid` (ghi đĩa bất đồng bộ, có thể mất thay đổi gần nhất nếu tắt đột ngột). Bắt buộc đặt `FLOCI_STORAGE_MODE` vì image mặc định là `memory` (mất hết khi restart). (Đã chốt)
- **NFR-15** Mất SSH tunnel làm application/service trên máy cá nhân lỗi kết nối; client cần tự kết nối lại. (Đề xuất)

## 4. Chi phí

- **NFR-16** Dùng OpenAI cho cả embedding và LLM; LLM chọn **model rẻ**. Tên model, giới hạn chi phí chi tiết do người dùng đặt sau. (Đã chốt)
- **NFR-17** Model đặt ở **biến môi trường** để đổi không cần sửa code. Đổi model embedding yêu cầu **index lại** vector. (Đã chốt)
- **NFR-18** Kiểm soát chi phí (đề xuất): giới hạn số đoạn đưa vào ngữ cảnh, token đầu ra và số tin nhắn lịch sử mỗi lượt.

## 5. Quốc tế hoá

- **NFR-19** Giao diện **tiếng Anh** ở phase này. **Mọi chuỗi hiển thị lấy từ file locale**, không hard-code, để sau này thêm tiếng Việt. (Đã chốt)
- **NFR-20** Server trả **mã lỗi** để UI dịch theo locale, không trả chuỗi cứng. (Đã chốt)

## 6. Thống nhất API

- **NFR-21** Mọi API của BE dùng **một khung response chung** `ApiResponse<T>` (xem `03-architecture.md`). (Đã chốt)
- **NFR-22** Mỗi request có `requestId` để lần theo log. (Đã chốt trong khung; truyền sang Kafka là đề xuất)

## 7. Khả năng bảo trì

- **NFR-23** Atomic design cho UI; best practice cho server. Mỗi thư mục code có **coding standard** riêng, `docs/` và `README.md`. (Đã chốt)
- **NFR-24** Mọi tài liệu ngoài `areax-rag-requirement/` viết bằng **tiếng Anh**. (Đã chốt)
- **NFR-25** Chưa có quality gate, CI/CD và **test tự động** ở phase này (cả application lẫn service); kiểm tra bằng tay. Nếu sau này thêm test, test phải mock OpenAI. (Đã chốt hoãn; mock là đề xuất)
