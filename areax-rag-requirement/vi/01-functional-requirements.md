# 01 - Yêu cầu chức năng

> Nhãn: **Đã chốt** / **Đề xuất** (xem `00-overview.md`). Mã FR dùng để tham chiếu.

## 1. Tài khoản và đăng nhập

- **FR-1** Có trang **login** bằng username và mật khẩu. (Đã chốt)
- **FR-2** Tài khoản **khởi tạo sẵn bằng script seed**. Không có đăng ký (sign up) ở phase này. (Đã chốt)
- **FR-3** **Chưa có admin toàn cục.** (Đã chốt)
- **FR-4** Seed script không chứa mật khẩu thật: đọc từ biến môi trường hoặc sinh ngẫu nhiên. (Đề xuất)
- **FR-5** Username là duy nhất; so sánh không phân biệt hoa thường. (Đề xuất)

## 2. Trang home và project

- **FR-6** Sau khi login, user vào **trang home** hiển thị các project mình tham gia. (Đã chốt)
- **FR-7** User **tạo được project**; người tạo là **owner**. (Đã chốt)

## 3. Thành viên và vai trò

- **FR-8** Chỉ có hai vai trò: **owner** và **member**. Không có viewer. (Đã chốt)
- **FR-9** Owner **thêm user vào project trực tiếp** bằng **username**; user không cần chấp nhận. Chỉ thêm được account đã tồn tại. (Đã chốt)
- **FR-10** Owner **remove** được member. Member **leave** được. **Owner không được leave.** (Đã chốt)
- **FR-11** Khi remove hoặc leave: thread và tin nhắn của user **vẫn được giữ**. Nếu được thêm lại, user **thấy lại thread cũ**. (Đã chốt)

## 4. Nguồn dữ liệu (tài liệu)

- **FR-12** Thành viên **upload tài liệu** vào project; mọi thành viên thấy chung tài liệu của project. (Đã chốt)
- **FR-13** Định dạng hỗ trợ: **PDF có text, Docx, MD, TXT**, tối đa **50MB mỗi file**. (Đề xuất)
- **FR-14** **Không OCR.** PDF scan hoặc ảnh không có text hiển thị trạng thái "không đọc được nội dung". (Đã chốt không OCR; cách hiển thị là đề xuất)
- **FR-15** Hỗ trợ nguồn **YouTube**: lấy **phụ đề (CC)** của video làm tài liệu. (Đã chốt)
- **FR-16** Tổng dung lượng file của mỗi project **tối đa 100MB**; giá trị đặt ở cấu hình để đổi được. Phụ đề YouTube tính theo dung lượng văn bản. (Đã chốt 100MB; cách tính là đề xuất)
- **FR-17** **Owner và member đều xoá được tài liệu.** Xoá tài liệu xoá cả file lẫn vector tương ứng; UI cần bước xác nhận. (Đã chốt)
- **FR-18** Tài liệu được xử lý **bất đồng bộ**; UI hiển thị trạng thái từng tài liệu (đang xử lý, sẵn sàng, lỗi). (Đề xuất)

## 5. Prompt của project

- **FR-19** Mỗi project có **một prompt chung**, dùng cho mọi câu hỏi trong project. (Đã chốt)
- **FR-20** **Mọi member đều sửa được prompt**, không chỉ owner. (Đã chốt)

## 6. Chat

- **FR-21** User hỏi đáp dựa trên tài liệu của project. (Đã chốt)
- **FR-22** Một project có **nhiều thread**; mỗi thread có ngữ cảnh riêng. User tạo thread mới được. (Đã chốt)
- **FR-23** **Mỗi user chỉ thấy thread của chính mình.** Owner cũng không xem được thread của member. (Đã chốt)
- **FR-24** User **xoá được thread của chính mình**; không ai xoá thread của người khác. (Đã chốt)
- **FR-25** Câu trả lời **stream từng token**. (Đã chốt)
- **FR-26** Câu trả lời **theo ngôn ngữ của câu hỏi**. (Đã chốt)
- **FR-27** **Không cần trích dẫn nguồn.** (Đã chốt)
- **FR-28** Ngữ cảnh gửi cho LLM gồm: prompt chung của project, tin nhắn trong thread đó, và các đoạn truy xuất từ tài liệu của project. (Đề xuất)

## 7. Xoá project

- **FR-29** **Chỉ owner xoá được project.** Xoá project xoá toàn bộ: dữ liệu DB (project, thành viên, thread, tin nhắn), file và vector. (Đã chốt)

## 8. Bảng quyền

| Hành động | Owner | Member |
|---|---|---|
| Xem project, tài liệu | Có | Có |
| Upload / xoá tài liệu | Có | Có |
| Sửa prompt của project | Có | Có |
| Tạo thread, chat, xoá thread của mình | Có | Có |
| Xem thread của người khác | Không | Không |
| Thêm / remove member | Có | Không |
| Leave project | Không | Có |
| Xoá project | Có | Không |

## 9. Ngoài phạm vi

Đăng ký tài khoản, admin toàn cục, trích dẫn nguồn, OCR, tính năng bổ sung kiểu NotebookLM (tóm tắt tự động, gợi ý câu hỏi...), giới hạn chi phí OpenAI theo user (người dùng sẽ làm sau).
