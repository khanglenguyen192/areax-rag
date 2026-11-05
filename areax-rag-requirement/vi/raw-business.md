# Requirement thô - Nghiệp vụ (business) - areax-rag

> Tách từ `raw.md` (28 đợt trao đổi). File này chứa phần nghiệp vụ: tính năng, vai trò, quyền, phạm vi. Phần kỹ thuật ở `raw-technical.md`.
> Chưa chuẩn hoá. Sẽ chuẩn hoá và dịch sang `en/` sau.
> Quy ước: "(đN)" là đợt trao đổi gốc. "Mặc định/giả định" là điều Claude đề xuất, người dùng chưa xác nhận rõ.

---

## 1. Lời người dùng (nguyên văn, theo thứ tự)

**Đ1 - Yêu cầu ban đầu**
> Tôi muốn một system, đầu tiên sẽ có trang login, account sẽ được init từ đầu trước, sign up flow chưa cần có ở phase này. Sau khi login xong, sẽ có trang home, tôi có thể tạo các project, mỗi project sẽ có các function tương tự như NotebookLM, cho user upload tài liệu lên, và hỏi đáp trên các tài liệu được upload. Cho phép user set user prompt (trên từng project). User sẽ chat hỏi dựa trên document được upload. Cho phép owner có thể invite/remove user vào project.

**Đ4 - OCR**
> Sẽ không cần OCR.

**Đ16 - Invite**
> Mời một account đã được tạo sẵn vào project.

**Đ17 - Quyền, prompt, lịch sử, account**
> Member cũng được upload/xoá tài liệu. Dùng 1 prompt cho 1 project, lịch sử chat sẽ chung. Account khởi tạo sẽ script seed, hiện chưa cần admin toàn cục.

**Đ18 - Prompt, add, leave, vai trò, remove**
> Mọi member sửa được prompt, hiện tại owner sẽ add user vào project luôn, member có quyền leave. Hiện tại chỉ cần owner và member. Khi remove user, vẫn giữ tin nhắn.

**Đ19 - Thread, owner, xoá**
> Nhiều thread đi, tuy nhiên user khác nhau thì chỉ thấy hội thoại của họ thôi. Owner không được leave, chỉ owner mới có quyền xoá.

**Đ20 - Chốt quyền xoá và xem thread**
> Chỉ owner mới có quyền xoá project, member vẫn xoá doc được, owner không xem thread của member được, member bị remove rồi add lại vẫn thấy thread cũ, member tự xoá thread của chính mình được.

**Đ21 - Phạm vi phase này**
> Chưa cần sao lưu dữ liệu. Ở phase này chỉ setup infra tới VPS thôi; application và các service khác sẽ chạy trên device hiện tại trước.

**Đ24 - Trích dẫn**
> Không cần trích dẫn.

**Đ27 - Tính năng, nguồn, dung lượng**
> Hiện chưa cần thêm tính năng. Thêm lấy cc từ YouTube nữa, giới hạn size cho tổng file trong project.

**Đ31 - Ngôn ngữ giao diện**
> Giao diện sẽ dùng tiếng Anh ở phase này, tuy nhiên sẽ load từ locale ra, sau này có thể có tiếng Việt.

**Đ37 - Giới hạn project, cách add user, ngôn ngữ trả lời, công khai tài liệu**
> Hiện tại mỗi project 100MB đi, owner add bằng username, câu trả lời của AI theo câu hỏi. Công khai requirement cũng được.

---

## 2. Quyết định hiện hành

### 2.1 Phạm vi phase này
- Phase này **chỉ setup infra lên VPS**. Application và service chạy trên máy cá nhân; deploy application/service lên VPS để phase sau (đ21).
- **Chưa cần thêm tính năng** ngoài những gì liệt kê dưới đây (đ27).
- **Không sao lưu dữ liệu** ở phase này; chấp nhận dữ liệu thử nghiệm có thể mất (đ21).
- **MCP server**: chỉ ghi nhận, chưa implement (đ2).
- **Không có đăng ký (sign up)** ở phase này (đ1).

- **Giao diện dùng tiếng Anh** ở phase này; chuỗi chữ lấy từ locale để sau này thêm tiếng Việt (đ31). Chi tiết kỹ thuật ở `raw-technical.md`.

### 2.2 Tài khoản
- Có trang **login**. Account **khởi tạo sẵn bằng script seed** (đ1, đ17).
- **Chưa có admin toàn cục** (đ17).
- Sau login vào **trang home**, nơi tạo và xem các project (đ1).

### 2.3 Project, thành viên, vai trò
- Một user tạo được nhiều project (đ1).
- **Chỉ có hai vai trò: owner và member.** Không có viewer (đ18).
- **Owner thêm user vào project trực tiếp** (user không cần chấp nhận). Người được thêm là **account đã tồn tại** (đ16, đ18); owner thêm bằng **username** (đ37).
- **Owner remove được member. Member leave được. Owner không được leave** (đ18, đ19).
- Khi remove hoặc leave: **thread và tin nhắn của user vẫn được giữ**. Nếu được add lại, user **thấy lại thread cũ** (đ18, đ20).

### 2.4 Nguồn dữ liệu (tài liệu)
- **Upload tài liệu** vào project; mọi thành viên thấy chung tài liệu của project (đ1).
- **Định dạng** (người dùng chấp nhận đề xuất của Claude, không phản đối): PDF có text, Docx, MD, TXT, tối đa 50MB mỗi file (đ27, xem mục 5).
- **Không OCR**: PDF scan và ảnh không có text sẽ **không đọc được**; hệ thống báo "không đọc được nội dung" (đ4, đề xuất của Claude).
- **Nguồn YouTube**: lấy phụ đề (CC) của video làm tài liệu (đ27).
- **Giới hạn tổng dung lượng file của mỗi project: 100MB** (đ27, đ37). Hiện là giá trị ban đầu, người dùng có thể đổi sau.
- **Member và owner đều upload và xoá được tài liệu** (đ17, đ20).

### 2.5 Prompt
- **Một prompt cho mỗi project**, dùng chung. **Mọi member đều sửa được** (đ17, đ18).

### 2.6 Chat
- Hỏi đáp dựa trên tài liệu của project (đ1).
- Một project có **nhiều thread**, mỗi thread có ngữ cảnh riêng (đ19).
- **Mỗi user chỉ thấy thread của chính mình**; **owner cũng không xem được thread của member** (đ19, đ20).
- **Member tự xoá thread của chính mình**; không ai xoá thread của người khác (đ20).
- **Không cần trích dẫn nguồn** trong câu trả lời (đ24).
- **Câu trả lời của AI theo ngôn ngữ của câu hỏi** (đ37), không theo ngôn ngữ giao diện.

### 2.7 Bảng quyền (đ20)

| Hành động | Owner | Member |
|---|---|---|
| Xem project, tài liệu | Có | Có |
| Upload / xoá tài liệu | Có | Có |
| Sửa prompt của project | Có | Có |
| Tạo thread, chat, xoá thread của mình | Có | Có |
| Xem thread của người khác | Không | Không |
| Add / remove member | Có | Không |
| Leave project | Không | Có |
| Xoá project | Có | Không |

### 2.8 Hệ quả nghiệp vụ khi xoá (Claude ghi nhận)
- Xoá project phải xoá toàn bộ: dữ liệu DB (project, thành viên, thread, tin nhắn), file và vector của project.
- Xoá tài liệu phải xoá cả file lẫn vector tương ứng; vì ai cũng xoá được nên UI cần bước xác nhận.

---

## 3. Đã bị thay thế (không còn hiệu lực)

- Lịch sử chat chung cả project (đ17) -> thay bằng thread riêng từng user (đ19).
- Trích dẫn nguồn (từng đề xuất ở đ23) -> bỏ (đ24).
- OCR cho PDF scan/ảnh (đ3) -> không OCR (đ4).
- Câu hỏi "owner có xoá được project không" (đ18) -> chốt: chỉ owner xoá (đ20).
- Sao lưu dữ liệu (điểm 6 trong danh sách cần bàn) -> hoãn (đ21).

---

## 4. Còn mở (nghiệp vụ)

1. ~~Owner tìm account bằng email hay username~~: **đã chốt username** (đ37).
2. ~~Giới hạn dung lượng project~~: **đã chốt 100MB** (đ37). Còn lại: cách tính dung lượng (tính kích thước file gốc; phụ đề YouTube tính theo dung lượng văn bản) và thông báo khi vượt giới hạn.
3. Có giới hạn **số file** mỗi project không?
4. Có **bật/tắt từng tài liệu làm nguồn** cho câu trả lời không? (Claude từng đề xuất; người dùng nói chưa cần thêm tính năng nên chưa rõ.)
5. **Tài liệu xử lý lỗi** (PDF scan, file hỏng, video không có phụ đề): hiển thị trạng thái và thông báo thế nào, cho thử lại không?
6. **YouTube**: cho chọn ngôn ngữ phụ đề không; chấp nhận phụ đề tự sinh chất lượng thấp không.
7. **Thread**: tên thread tự đặt hay tự sinh; giới hạn số thread.
8. **Hiển thị tên** của user đã bị remove (nếu cần hiện ở đâu đó).
9. **Giới hạn chi phí OpenAI** (số câu hỏi mỗi user, độ dài ngữ cảnh): người dùng nói sẽ giới hạn sau (đ27).
10. ~~Công khai `areax-rag-requirement/`~~: **đã chốt được công khai** (đ37).

## 5. Giả định mặc định của Claude (người dùng chưa xác nhận rõ)

- Nội dung tài liệu và câu hỏi bằng **tiếng Việt và tiếng Anh** (giao diện đã chốt tiếng Anh, đ31). Câu trả lời của AI theo ngôn ngữ câu hỏi (đã chốt, đ37).
- Định dạng file: PDF có text, Docx, MD, TXT; tối đa 50MB mỗi file; xử lý bất đồng bộ, UI hiện trạng thái từng file.
- Seed script không chứa mật khẩu thật (đọc từ env hoặc sinh ngẫu nhiên).
