# Requirement thô - Kỹ thuật (technical) - areax-rag

> Tách từ `raw.md` (28 đợt trao đổi). File này chứa phần kỹ thuật: stack, kiến trúc, hạ tầng, CI/CD, quy ước. Phần nghiệp vụ ở `raw-business.md`.
> Chưa chuẩn hoá. Sẽ chuẩn hoá và dịch sang `en/` sau.
> Quy ước: "(đN)" là đợt trao đổi gốc. Mục "Đề xuất" là của Claude, người dùng chưa chốt. Thông tin tra từ web/kiến thức Claude có ghi rõ "chưa kiểm chứng".
> Không ghi API key, IP VPS, tên user SSH vào tài liệu (repo public).

---

## 1. Lời người dùng (nguyên văn, theo thứ tự)

**Đ2 - Yêu cầu kỹ thuật**
> Khi dựng UI system, code sẽ nằm ở `areax-rag-application/`, tôi chỉ cần dựng Next.js, dùng TypeScript, follow atomic design, dùng MUI, Bootstrap, DB dùng là Postgres.
> Các service liên quan đến Python như extract, embedding, retrieval,... thì nằm ở `areax-rag-service/`, có thể build các service riêng biệt (tạo subfolder).
> Tôi có virtualize AWS thông qua Floci, vậy nên vector storage hãy dùng S3, file được upload lên cũng sẽ upload lên S3 luôn. Có CloudFormation để tạo các service liên quan đến AWS.
> Các message khi type sẽ được gửi về Kafka, và khi retrieve ra câu trả lời cũng trả về Kafka, sau đó truyền lên UI qua WebSocket. *(WebSocket đã bị thay bằng SSE ở đ14)*
> Tôi có VPS server, khoảng 4GB RAM, 2 core. Postgres, application, Floci, Kafka sẽ được host ở đây.
> Về MCP server, sẽ tạo ở `areax-rag-mcp/`. Tuy nhiên, chỉ note lại, chưa implement ở phase này.
> Main branch sẽ là `develop`. Tôi cũng muốn setup GitHub Actions để CI/CD auto deploy cho application, MCP, service khi merge vào branch `deployment/prod`.
> Liên quan đến setup AWS, Kafka, Postgres,... thì sẽ đặt trong `areax-rag-infra/`.

**Đ3 - API key, extraction, embedding**
> Tôi sẽ cung cấp API key. Về phần extraction service, có thể tham khảo `<local>/ocr-rag`. Về model embedding, xem thử có cái nào free không, nếu không thì dùng API key.

**Đ4 - Chốt embedding**
> Embedding tôi sẽ dùng API, của OpenAI.

**Đ5 - LLM**
> LLM sinh câu trả lời dùng OpenAI API, tuy nhiên dùng model ít tiền thôi.

**Đ6 - Model embedding**
> `text-embedding-3-small` là đủ rồi, tuy nhiên nên đặt ở env.

**Đ7 - Quality gate**
> Ở trigger GitHub Action flow, có thể đặt một quality gate để check code có fail được không, có tốn thêm chi phí không.

**Đ8 - Bỏ quality gate**
> Skip quality gate. Ngoài ra CI/CD flow GitHub nên làm thế nào, tôi chưa có hướng.

**Đ9 - Registry, domain, monorepo**
> Tôi dùng Docker Hub, repo private, tôi chưa mua domain. Nếu monorepo thì có thể CI/CD riêng trên từng folder không. Tôi chỉ có local và VPS.

**Đ10 - Infra, domain**
> Infra đổi không cần redeploy. Tôi sẽ mua domain sau. Giải thích thêm cho tôi ở chỗ dùng Docker Hub.

**Đ11 - Setup sẵn trên VPS**
> Nếu tôi setup trước GitHub account và Docker account ở server VPS thì sao.

**Đ12 - Repo public**
> Tôi đã tạo repo public.

**Đ13 - Địa chỉ repo**
> `git@github.com:khanglenguyen192/areax-rag.git`

**Đ14 - SSE**
> Dùng SSE, câu trả lời stream từng token.

**Đ15 - Floci**
> Kiểm tra xem Floci hỗ trợ tới đâu.

**Đ21 - Phạm vi phase**
> Application và các service khác sẽ chạy trên device hiện tại trước (đã có SSH tới VPS).

**Đ22 - Cách đưa infra lên VPS**
> Chạy tay trước đi. AWS thì có thể dùng CloudFormation, còn các infra khác tôi sẽ tự chạy tay.

**Đ23 - Script**
> Tôi sẽ cần bash script để deploy CloudFormation.

**Đ24 - Ghi DB, mạng, bcrypt, coding standard**
> Service có thể ghi thẳng vào DB, chỉ có application là public ra ngoài, còn lại là internal service. Mật khẩu cứ dùng bcrypt. Ở application, ngoài follow atomic design thì phía BE (server) cũng cần có best practice, phải tạo file coding standard.

**Đ25 - Truy cập qua SSH**
> Nếu thiết lập SSH thì có truy cập được Kafka, Postgres, Floci từ device của tôi không. *(đồng ý ghi cấu hình đề xuất)*

**Đ26 - Coding standard, docs, ngôn ngữ**
> Coding standard đặt ở mỗi thư mục riêng, trong các thư mục tương ứng nên có folder `docs` để ghi lại các thông tin cần thiết (tiếng Anh). Chỉ có requirement là có vi với en, còn lại đều là en.

**Đ27 - Floci dung lượng, model, Auth.js**
> Kiểm tra giúp Floci có thể chứa tối đa bao nhiêu. Model LLM cứ dùng, tôi sẽ giới hạn sau. Auth.js là gì.

**Đ28 - Chọn Auth.js**
> Chọn Auth.js đi.

**Đ29 - Chọn ORM**
> Dùng Prisma đi.

**Đ30 - README**
> Trong các folder code cần có README.

**Đ31 - Ngôn ngữ giao diện**
> Giao diện sẽ dùng tiếng Anh ở phase này, tuy nhiên sẽ load từ locale ra, sau này có thể có tiếng Việt.

**Đ32 - Format response API**
> Ở phía BE, các API cần thống nhất chung về format response.

**Đ36 - Chốt gộp image**
> Đồng ý. (Toàn dự án 2 image: application và service.)

**Đ37 - Giới hạn project, cách add user, ngôn ngữ trả lời, công khai tài liệu**
> Hiện tại mỗi project 100MB đi, owner add bằng username, câu trả lời của AI theo câu hỏi. Công khai requirement cũng được.

**Đ38 - Khởi tạo hạ tầng, cấu trúc application, SCSS**
> Thêm init các hạ tầng khác vào trong infra. Ở `areax-rag-application/CODING_STANDARD.md`, thêm folder `(pages)` để chứa các page, cả app và BE phải có folder `model` để khai báo các DTO, có folder `hooks` để chứa webhook nếu cần, dùng SCSS.

**Đ39 - Tham khảo coding standard khác**
> (Người dùng đưa một file coding standard của dự án khác, nằm trong thư mục Downloads) "tham khảo coding standard này thử".

**Đ40 - Coding standard của service**
> Với `areax-rag-service/CODING_STANDARD.md` cũng cần follow các best practice, source code cần tổ chức lại rõ hơn, dễ maintain.

**Đ41 - Bỏ TanStack Query và test ở application**
> Trong `areax-rag-application/CODING_STANDARD.md`, không cần dùng TanStack Query đâu, cũng không cần test.

**Đ42 - Quy tắc comment**
> Trong `CODING_STANDARD.md` cần có comment rule rõ ràng. (Sau đó làm rõ: file của `areax-rag-application`.)

**Đ43 - Quy tắc comment cho service**
> Làm cho service đi.

**Đ44 - Không generate test ở cả application và service**
> Ở application và service đều không cần generate test cho phase này.

**Đ45 - Khởi tạo thư mục, gitignore, env example**
> Dựng khung code đi, thêm gitignore, env, ... đừng download node modules ở lúc này, nhớ thêm env example. (Sau đó thu hẹp:) Chỉ cần init các folder là được rồi.

**Đ46 - Sửa cách hiểu thư mục hooks**
> Trong `areax-rag-application/CODING_STANDARD.md`, folder hook là các hook để dùng chứ không phải webhook.

**Đ35 - Gộp image Python service**
> Ở các Python service, có thể gộp các service nào lại chung image để giảm thiểu số image không.

**Đ34 - Chốt mở rộng response**
> Đồng ý. (Thêm `errors` cho lỗi validate; phân trang đặt trong `data`.)

**Đ33 - Mẫu response**
> (Người dùng dán class Java `ApiResponse<T>` gồm các trường: `status` (int), `code` (String), `message` (String), `requestId` (String), `timestamp` (Instant), `data` (T); chỉ serialize trường khác null.) "Response format này được không?"

---

## 2. Quyết định hiện hành

### 2.1 Cấu trúc thư mục (monorepo)
- Repo GitHub **public**, remote `git@github.com:khanglenguyen192/areax-rag.git`; gốc monorepo là `areax-rag/` (đ12, đ13). Chưa `git init`/push, chỉ làm khi người dùng yêu cầu.
- Các thành phần (đ2): `areax-rag-application/` (UI + server), `areax-rag-service/` (Python, mỗi service một subfolder), `areax-rag-mcp/` (chỉ ghi nhận), `areax-rag-infra/` (AWS/Kafka/Postgres), `areax-rag-requirement/` (vi + en).
- Branch mặc định: `develop`. Branch deploy: `deployment/prod` (đ2).

### 2.2 Application (`areax-rag-application/`)
- Next.js + TypeScript, atomic design, MUI + Bootstrap, Postgres (đ2).
- **Auth.js** (Credentials provider), mật khẩu **bcrypt** (đ24, đ28). JWT chỉ nhận diện user; quyền owner/member **kiểm tra từ Postgres ở mỗi request**; kiểm tra thêm cờ account còn hoạt động. Không bật sign up (account tạo bằng script seed).
- **i18n**: giao diện tiếng Anh ở phase này; **mọi chuỗi hiển thị lấy từ file locale**, không hard-code trong component, để sau này thêm tiếng Việt chỉ cần thêm locale (đ31). Nên đưa quy tắc này vào coding standard của application. Thư viện i18n (vd. `next-intl`) chưa chọn. Cần quyết định: thông báo lỗi từ server trả về mã lỗi để UI dịch theo locale, không trả chuỗi cứng; định dạng ngày/số theo locale. Phase này chưa cần bộ chuyển ngôn ngữ trên UI (suy luận, chưa xác nhận).
- **Format response API thống nhất** cho mọi API của BE (đ32). Nên ghi vào coding standard phần server. Đề xuất của Claude (chưa chốt, chờ người dùng xác nhận):
  - ~~Khung `success`/`data`/`error` tách đôi~~ **đã bị thay thế (đ33)** bằng khung một dạng chung cho cả thành công và lỗi, lấy từ class `ApiResponse<T>` của người dùng (xem bên dưới).
  - **Khung chốt (đ33)**: mọi response, thành công hay lỗi, đều có cùng các trường `status` (số, trùng HTTP status), `code` (chuỗi), `message`, `requestId`, `timestamp`, và `data` (tuỳ chọn). Trường null/undefined thì **bỏ khỏi JSON** (tương đương `@JsonInclude(NON_NULL)`). Bản TypeScript đề xuất:
    ```ts
    interface ApiResponse<T = unknown> {
      status: number;        // same as the HTTP status
      code: string;          // "OK" on success, stable UPPER_SNAKE code on error
      message: string;       // for debugging, not shown to users
      requestId: string;     // unique per request, also sent as X-Request-Id
      timestamp: string;     // ISO-8601 UTC
      data?: T;
      errors?: { field: string; code: string }[]; // extension: validation errors only
    }
    ```
  - Bỏ phần `Serializable`, `writeObject`, `readObject`, Lombok: đặc thù Java, không cần ở TypeScript.
  - `code`: UI dùng để dịch theo locale (khớp đ31); thành công dùng mã cố định (vd. `OK`, `CREATED`).
  - Phân biệt thành công/lỗi bằng `status` (< 400 là thành công), không cần cờ `success`.
  - `requestId`: tạo ở middleware cho mỗi request, ghi vào log và header; nên truyền tiếp vào message Kafka làm correlation id để lần theo một câu hỏi từ UI qua Kafka đến service (đề xuất, chưa chốt).
  - **Đã chốt (đ34)**: thêm trường `errors` cho lỗi validate; phân trang đặt trong `data` (`{ items, page, pageSize, total }`) để khung ngoài cố định.
  - Versioning URL (`/api/v1`): Claude đề xuất chưa cần (chỉ có một client là UI của chính dự án); người dùng chưa phản hồi riêng, coi là chưa cần.
  - Vẫn dùng **HTTP status đúng nghĩa** (200/201, 400, 401, 403, 404, 409, 422, 500), không trả 200 cho lỗi.
  - Một chỗ duy nhất (helper/wrapper) tạo response và bắt lỗi, route handler không tự dựng JSON; không để lộ stack trace hay thông tin nội bộ.
  - Danh sách `code` lỗi đặt ở một file dùng chung và có trong `docs/`.
  - Sự kiện **SSE** cũng theo một khung thống nhất (vd. loại sự kiện `token`, `done`, `error`, có `threadId`/`messageId`); lỗi dùng cùng `code`.
  - Phạm vi: API của application (Next.js). Service Python là internal, giao tiếp bằng Kafka nên có hợp đồng message riêng (xem điểm Kafka ở mục 4), không dùng khung REST này.
- **Username** là định danh đăng nhập và định danh để owner add user (đ37): duy nhất, nên so sánh không phân biệt hoa thường (đề xuất, chưa chốt); bảng user có cột username unique.
- **Giới hạn 100MB mỗi project** (đ37), là tổng dung lượng file của project, đặt ở env/cấu hình để đổi được. Cách áp dụng (đề xuất, chưa chốt): kiểm tra tổng dung lượng hiện có cộng kích thước khai báo **trước khi cấp presigned URL**; sau khi upload xác nhận lại kích thước thật qua S3 (HEAD) và từ chối/xoá nếu vượt; phụ đề YouTube tính theo dung lượng văn bản. Cần tính đến hai upload đồng thời cùng làm vượt giới hạn (dùng khoá hoặc kiểm tra lại trong transaction). Bảng tài liệu lưu kích thước để cộng nhanh.
- **Quy tắc comment của application (đ42)**: mục 26 (sau khi đánh số lại ở đ46; trước đó là mục 27) của `areax-rag-application/CODING_STANDARD.md` được viết lại. Code nói "cái gì", comment nói "tại sao". Danh sách trường hợp **bắt buộc** comment (lý do không hiển nhiên, workaround cho hệ thống ngoài, quyết định bảo mật/thứ tự, giá trị/regex khó hiểu, bỏ qua lỗi có chủ đích, tắt rule, hai nơi phải đổi cùng nhau, API công khai) và **cấm** (nhắc lại code, code bị comment, tác giả/lịch sử thay đổi, secret, than phiền, không phải tiếng Anh, TODO không có issue, comment sai/lỗi thời). Doc comment TSDoc cho API công khai (quyền cần có, lỗi ném ra kèm code, side effect; không lặp lại kiểu). Mọi `eslint-disable`/`@ts-expect-error` phải có lý do, phạm vi hẹp nhất; không dùng `@ts-ignore`. TODO dạng `TODO(#123): ...` có issue trong repo. Công cụ kiểm tra còn tạm (`eslint-plugin-jsdoc`/`tsdoc`, plugin ESLint comments). Ban đầu chỉ áp dụng cho **application**; service được làm ở đ43; infra chưa có mục tương đương.
- **Thư mục `hooks` là React hook (đ46)**: sửa lại cách hiểu sai ở đ38/đ39. `src/hooks/` chứa **mọi React hook** (`useXxx`, mỗi file một hook). Hook dùng chung (không dữ liệu, không session: `useDebounce`, `useMediaQuery`, `useT`) ở `src/hooks/common/`; hook lấy dữ liệu (gọi `lib/apiClient` hoặc đọc session: `useProjects`, `useProjectMembers`) ở `src/hooks/<feature>/`. `src/features/` không còn chứa hook. Atom, molecule và organism chỉ được import hook trong `hooks/common/` (kiểm tra bằng lint); hook dữ liệu chỉ dùng ở page, feature composition và connected wrapper. Giới hạn file hook <= 150 dòng (mục 8.7). **Bỏ** `src/server/hooks/`, `*.hook.ts` và mục Webhooks; các mục sau đó đánh số lại (Logging thành 22, Testing 23, Git 24, Forbidden 25, Comments 26, Review checklist 27). Bỏ thư mục `src/lib/react/` (hook dùng chung chuyển sang `hooks/common/`); tạo `src/hooks/common/`.
- **Khởi tạo thư mục (đ45)**: chỉ tạo **cấu trúc thư mục** theo coding standard cho `areax-rag-application/` (`prisma/`, `public/`, `src/app/(pages)/...`, `src/components/{atoms,molecules,organisms,templates,providers}`, `src/{features,model,shared,styles,locales,lib/react,types}`, `src/server/{model,auth,services,repositories,kafka,sse,errors,http,config}`) và `areax-rag-service/` (`src/areax_service/{core,domain,contracts,ports,adapters/{kafka,postgres,aws,openai,extractors,youtube},ingestion/use_cases,chat/use_cases}`), mỗi thư mục rỗng có `.gitkeep`. **Không viết code** (không `package.json`, `pyproject.toml`, `__init__.py`, Dockerfile) và **không cài `node_modules`**. Không tạo `src/server/hooks/` (chỉ tạo khi cần webhook) và không tạo `tests/` (đ44). Thêm `.gitignore` (gốc repo bổ sung quy tắc bí mật/editor/log; riêng cho application và service), và `.env.example` cho application và service (chỉ placeholder; không tạo `.env` thật). Tra cứu phiên bản gói đã bỏ vì chưa cần.
- **Không có test tự động ở phase này, cho cả application và service (đ44)**: không generate file test, fake, fixture, thư mục `tests/`, cấu hình `pytest` hay dependency chỉ dùng cho test. Mục 16 của `areax-rag-service/CODING_STANDARD.md` được thay bằng quyết định này kèm danh sách kiểm tra tay (luồng bình thường, cùng một message hai lần, lỗi vĩnh viễn, lỗi tạm thời, lọc theo `project_id`, tắt máy an toàn). Kiến trúc tầng (ports/adapters) vẫn giữ để thêm test sau mà không phải thiết kế lại. Nếu sau này có test thì phải cập nhật standard trước. Thay đổi liên quan: bỏ `tests/` khỏi cây thư mục (service README, `03-architecture`), bỏ ngưỡng coverage, sửa NFR-25.
- **Quy tắc comment của service (đ43)**: mục 18 của `areax-rag-service/CODING_STANDARD.md` được viết lại cho Python. Cùng nguyên tắc "code nói cái gì, comment nói tại sao", thêm các trường hợp đặc thù: lý do thứ tự/độ tin cậy (commit offset sau handler, khoá xác định, phân loại lỗi retryable/permanent), điều làm cho xử lý lặp lại an toàn, quirk của SDK. **Docstring kiểu Google** bắt buộc cho module và code công khai; **docstring của port là hợp đồng** (hành vi, lỗi ném ra, idempotent hay không). Không lặp lại kiểu trong docstring. `# type: ignore[code]` / `# noqa: CODE` phải nêu rule và lý do, cấm bản trần; TODO dạng `# TODO(#123): ...`. Cấu hình `ruff` gợi ý: `D` (convention google), `ERA`, `TD`, `PGH`, `RUF`; **không bật `FIX`** vì nó cấm mọi TODO; bỏ `TD002` vì TODO dùng số issue thay cho tác giả. Công cụ còn tạm, cần kiểm tra theo phiên bản `ruff` khi dựng dự án.
- **Application: không TanStack Query, không test (đ41)**: dữ liệu server lấy bằng `fetch` có sẵn qua `lib/apiClient`, trong hook của feature (`{ data, error, isLoading, refetch }`, huỷ request bằng `AbortController`, sau khi rời/xoá project thì điều hướng đi rồi mới refetch danh sách). Application **không cần test tự động**: bỏ Vitest, Testing Library, MSW, file `*.test.*`; thay bằng kiểm tra tay các luồng thay đổi (quyền, giới hạn dung lượng, trạng thái lỗi, SSE). Quyết định này chỉ nói về application; coding standard của **service** vẫn có phần test (chưa có yêu cầu bỏ).
- **Coding standard của service v1.1 (đ40)**: viết lại theo kiến trúc phân tầng **ports và adapters**. Một package `areax_service` (bố cục `src/`) gồm `core/`, `domain/`, `contracts/`, `ports/`, `adapters/`, `ingestion/`, `chat/`; chỉ `adapters/` import SDK; `ingestion` và `chat` độc lập và chỉ `bootstrap.py` mới import adapters; kiểm tra bằng `import-linter` (tạm). Use case nhận dependency qua constructor, một composition root (`bootstrap.py`) cho mỗi service, settings riêng cho từng service (`SecretStr`), test bằng fake của port thay vì mock, khoá vector xác định (`<document_id>:<chunk_index>`), số lần retry có giới hạn rồi đẩy sang dead-letter, heartbeat để health check, `ruff` cho cả lint lẫn format (bỏ `black`), `mypy --strict` toàn bộ. **Đổi lệnh chạy** thành `python -m areax_service.ingestion` / `python -m areax_service.chat` (tránh tên package chung chung `common`). Thêm `areax-rag-service/docs/architecture.md`. Chưa có code, chưa scaffold.
- **Coding standard của application v1.1 (đ39)**: viết lại có đánh số mục, tham khảo một chuẩn của dự án khác (không chép nguyên văn, không đưa tên nội bộ). Bổ sung: quy tắc phân loại atom/molecule/organism/template/page ("khớp đầu tiên thắng"), thư mục `shared/` dùng chung mọi tầng, hướng import một chiều **ép bằng lint**, tách organism (không fetch) khỏi wrapper có fetch trong `features/`, mặc định đặt component trình bày trong `components/` dù chỉ một nơi dùng, giới hạn kích thước file theo tầng, thứ tự trong file component, quy tắc TanStack Query (key factory, `removeQueries` sau khi rời/xoá project), kỷ luật fetch phía browser (401 -> về trang login), error boundary, test route handler bắt buộc, danh mục thực hành bị cấm và checklist review. **Không áp dụng** phần styling của chuẩn kia (nó cấm CSS Modules; dự án này dùng SCSS theo yêu cầu). Các lựa chọn công cụ còn là tạm: ESLint+Prettier hay Biome, Storybook, TanStack Query, MSW, commit hooks.
- **Cấu trúc application (đ38)**: mọi trang nằm trong route group `src/app/(pages)/`; DTO khai báo ở thư mục `model` **cả hai phía**: `src/model/` (UI) và `src/server/model/` (BE); `src/server/hooks/` chứa **webhook** (chỉ tạo khi cần; Claude hiểu "hooks" ở đây là webhook nhận từ bên ngoài, còn React hook `useXxx` nằm ở `src/features/`; **cần người dùng xác nhận cách hiểu này**); style bằng **SCSS** (CSS Modules, partial trong `src/styles/`, Bootstrap chỉ nhập các partial cần dùng). Chi tiết ở `CODING_STANDARD.md` của application.
- ORM: **Prisma** (đ29). Schema và migration do application sở hữu (đề xuất của Claude, chưa xác nhận); service Python ghi thẳng Postgres nhưng không dùng Prisma, nên cần quy ước schema để hai bên khớp nhau.
- Kênh server -> UI: **SSE** (thay WebSocket). Câu trả lời **stream từng token** (đ14).
- **Chỉ application public ra ngoài**; mọi thứ còn lại internal (đ24). Application phải kiểm tra quyền trước khi phát message Kafka.
- Cần **coding standard** riêng: UI (atomic design) và server/BE (best practice) (đ24, đ26).

### 2.3 Python service (`areax-rag-service/`)
- Extract, embedding, retrieval... tách thành các service riêng, mỗi service một subfolder (đ2).
- **Service ghi thẳng vào Postgres** (đ24).
- Không OCR. Chỉ xử lý file có text layer (đ4). Tham khảo `ocr-rag` (xem mục 6).
- Nguồn YouTube: lấy phụ đề (CC), tham khảo `youtube-transcript-api` trong `ocr-rag` (đ27).

### 2.3a Image Docker (đ36)
- **Toàn dự án chỉ có 2 image**: `application` (Node, Next.js) và `service` (Python, dùng chung cho mọi Python service); thêm `mcp` khi implement.
- Một Dockerfile ở gốc `areax-rag-service/`; package chung cho config, kết nối Postgres/S3/Kafka và hợp đồng message; mỗi service một package riêng, khác nhau ở `command` khi chạy (vd. `python -m ingestion`, `python -m chat`).
- Compose chạy cùng một image nhiều lần để mỗi container có giới hạn RAM và restart riêng.
- Không gộp application và service vào một image (ranh giới bảo mật, hai runtime, RAM, restart độc lập).
- Đánh đổi chấp nhận: image lớn hơn, deploy tạo lại mọi container service cùng lúc, dùng chung phiên bản thư viện. Tách lại khi một service cần thư viện rất nặng hoặc scale riêng.
- Docker Hub: một repo, phân biệt bằng tag theo thành phần (vd. `app-<sha>`, `service-<sha>`); vẫn cần kiểm tra chính sách private repo của gói free (mục 4, điểm 7). Chưa có image nào để đẩy ở phase này.

### 2.4 AI
- Provider: **OpenAI** cho cả embedding và LLM; một API key (đ4, đ5).
- Embedding: **`text-embedding-3-small`**, đặt ở env (vd. `OPENAI_EMBEDDING_MODEL`) (đ6). Mặc định 1536 chiều; số chiều phải khớp lúc index và query; đổi model thì re-index và nên lưu tên model + số chiều cùng index.
- LLM: model **rẻ**, tên **chưa chốt**, đặt ở env; người dùng sẽ giới hạn chi phí sau (đ5, đ27).
- **Ngôn ngữ trả lời theo ngôn ngữ của câu hỏi** (đ37), thực hiện bằng chỉ dẫn trong system prompt của service `chat` (kèm prompt chung của project); người dùng không cần chọn ngôn ngữ.
- API key do người dùng cung cấp; **không ghi vào tài liệu/code**; dùng env, `.env` (gitignore), GitHub Secrets (đ3).

### 2.5 Lưu trữ và AWS ảo (Floci)
- AWS ảo bằng **Floci**; **file upload lên S3**; **vector storage dùng S3** (đ2). Floci hỗ trợ **S3 Vectors** (xem mục 6).
- Tài nguyên AWS tạo bằng **CloudFormation**, template trong `areax-rag-infra/`; cần **bash script deploy** chạy từ máy cá nhân qua tunnel, chạy lặp lại được, không chứa secret/IP thật (đ22, đ23).
- Floci chạy `FLOCI_STORAGE_MODE=hybrid`, volume `floci_data`; image mặc định là `memory` nên **bắt buộc đặt biến này** (đ15).

### 2.6 Messaging
- Câu hỏi và câu trả lời đi qua **Kafka** (đ2). Kafka **tự host trên VPS** (đ2, đ15).
- Luồng (đ14): UI POST câu hỏi -> application đẩy vào Kafka -> service retrieval/LLM sinh câu trả lời, đẩy **từng token** vào Kafka -> application nhận từ Kafka, đẩy xuống UI qua SSE. Câu trả lời hoàn chỉnh lưu vào Postgres khi kết thúc stream.
- SSE chỉ đẩy cho **user sở hữu thread** (thread riêng từng user). Mỗi tab một luồng SSE cho cả user để tránh giới hạn ~6 kết nối mỗi origin của HTTP/1.1.

### 2.7 Mạng và triển khai (phase này)
- **VPS** (4GB RAM, 2 core) chỉ chạy **Postgres, Kafka, Floci** (đ21).
- **Application và Python service chạy trên máy cá nhân**, nối VPS qua **SSH tunnel** (đ21, đ25). Alias SSH `floci` đã có.
- **Mọi cổng trên VPS chỉ bind `127.0.0.1`** (Docker publish cổng bỏ qua `ufw`); **không mở cổng ra internet** (đ25).

| Dịch vụ | Cổng trên VPS | Cổng tunnel trên máy |
|---|---|---|
| Postgres | 5432 | 5432 (hoặc 5433 nếu trùng) |
| Kafka (listener EXTERNAL) | 9094 | 9094 |
| Floci | 4566 | 4566 |

- **Kafka hai listener** (một broker): `INTERNAL` (vd. `kafka:9092`) và `EXTERNAL` (9094) với `advertised.listeners=localhost:9094`, publish chỉ `127.0.0.1:9094` (đ25). Chỉ đúng khi một broker.
- SSH config có `ServerAliveInterval`/`ServerAliveCountMax`; cân nhắc `autossh`.
- **Khởi tạo hạ tầng (đ38)**: `areax-rag-infra/compose/` có compose cho Postgres 16, Kafka (`apache/kafka:4.3.2`, KRaft một broker, hai listener), Floci (`floci/floci:2.4.0`); Postgres tự tạo role/database cho application ở lần khởi động đầu; topic Kafka tạo từ `compose/kafka/topics.txt` (tên tạm); script `infra.sh`, `init-kafka-topics.sh`, `tunnel.sh`; mọi cổng bind `127.0.0.1`, có giới hạn RAM; `compose/.env` không commit. **Chưa thử trên VPS thật** (chỉ kiểm tra bằng `docker compose config` và công cụ giả).
- Infra (Postgres, Kafka, Floci) **người dùng tự chạy tay**; **không có CI/CD cho infra ở phase này** (đ22). Thay đổi trong `areax-rag-infra/` không kích hoạt redeploy service/application (đ10).
- Môi trường: chỉ **local (dev) và VPS (prod)**; không staging (đ9).
- **Domain chưa có**, mua sau; khi có sẽ thêm reverse proxy + HTTPS (đ10). Trước mắt chạy HTTP; trang login qua HTTP là rủi ro đã ghi nhận.

### 2.8 CI/CD (hoãn, chốt hướng cho phase sau)
- **Không quality gate** (đ8). Deploy chạy khi merge vào `deployment/prod`.
- **Registry: Docker Hub**; repo GitHub public (đ9, đ12).
- Monorepo, **mỗi thành phần một workflow riêng** với `on.push.paths`, có `workflow_dispatch` (đ9).
- CI/CD cho application/service/mcp **tạm hoãn** (đ21); phase này không đẩy image nào.

### 2.9 Quy ước tài liệu và code
- **Coding standard đặt riêng trong từng thư mục thành phần**; mỗi thư mục có folder **`docs/`** (đ26).
- **Mỗi folder code có `README.md`** (đ30), viết bằng tiếng Anh theo quy ước ngôn ngữ bên dưới. Áp dụng cho `areax-rag-application/`, `areax-rag-service/`, `areax-rag-mcp/`, `areax-rag-infra/`. Nội dung tối thiểu (đề xuất của Claude, chưa chốt): mục đích, cấu trúc thư mục, cách chạy local (kể cả mở SSH tunnel), biến môi trường (không ghi giá trị thật), liên kết tới `docs/` và coding standard. Còn mở: mỗi subfolder service Python có README riêng không (đề xuất: có, ngắn), và `areax-rag-mcp/` chỉ cần README ghi chú vì chưa implement.
- **Chỉ `areax-rag-requirement/` có hai bản vi/en**; mọi tài liệu khác viết **tiếng Anh** (đ26). Comment/commit/tên biến mặc định tiếng Anh (chưa xác nhận).

---

## 3. Đã bị thay thế (không còn hiệu lực)

- WebSocket (đ2) -> SSE (đ14).
- OCR LightOnOCR/PaddleOCR/EasyOCR (đ3) -> không OCR (đ4).
- Embedding free chạy local, hoặc free tier của Gemini/Cohere/Jina/Voyage (đ3) -> OpenAI `text-embedding-3-small` (đ4, đ6).
- Quality gate trong CI (đ7) -> bỏ (đ8).
- Registry GHCR (đề xuất đ8) -> Docker Hub (đ9).
- Repo private (đ9) -> public (đ12); các lo ngại về hạn mức phút Actions cho repo private không còn áp dụng; deploy key chỉ cần nếu sau này chuyển sang private (đ11, đ12).
- SSE đẩy cho mọi thành viên project (đ17) -> chỉ đẩy cho chủ thread (đ19).
- Service chỉ phát event, application ghi DB (đ23 điểm 6) -> service ghi thẳng DB (đ24).
- Trích dẫn có số trang, extraction giữ metadata trang (đ23 điểm 8) -> bỏ (đ24).
- Tự quản lý session (đề xuất đ27) -> Auth.js (đ28).
- argon2 hay bcrypt (đ23) -> bcrypt (đ24).
- Runner CI deploy qua SSH vào VPS cho mọi thành phần (đề xuất đ8) -> hoãn; infra chạy tay (đ21, đ22).
- Trong đ39: các quy tắc TanStack Query, test route handler bắt buộc, MSW, Vitest + Testing Library cho application -> **bỏ** (đ41).
- Trong đ40: phần test của standard service (fake của port, `pytest`, `tests/`, ngưỡng coverage >= 90%, test tích hợp opt-in) -> **bỏ** ở phase này (đ44). Câu "chỉ áp dụng cho application, service vẫn có phần test" ở đ41 không còn đúng.
- Trong đ38/đ39/đ45: hiểu `hooks` là webhook (`src/server/hooks/`, `*.hook.ts`, mục Webhooks) và dùng `src/lib/react/` cho hook dùng chung -> **sai/bỏ** (đ46).

---

## 4. Còn mở (kỹ thuật)

1. **Vector index**: một index dùng chung lọc theo `project_id` (Claude đề xuất, 1536 chiều, cosine, tạo bằng CloudFormation) hay mỗi project một index (tạo lúc runtime, ngoài CloudFormation).
2. **Migration và schema dùng chung**: ORM đã chốt là Prisma (đ29). Còn mở: migration do application sở hữu (đề xuất), service Python (không dùng Prisma) truy cập Postgres thế nào (SQL trực tiếp/SQLAlchemy theo schema đã có), quy ước bảng nào do ai ghi, và cách phát hiện schema lệch.
3. **Thiết kế Kafka**: danh sách topic, schema message (hợp đồng đặt chung trong repo), partition key theo thread, gom token, tín hiệu kết thúc/lỗi, retry/DLQ, idempotency, `Last-Event-ID`/nhận bù khi mất kết nối SSE.
4. **Luồng upload** (đề xuất): UI xin presigned URL -> tải thẳng lên S3 -> báo lại -> application phát message Kafka. Floci chỉ đẩy event S3 sang SQS/SNS/Lambda, không sang Kafka.
5. **Chia Python service** (đề xuất): `ingestion` (extract -> chunk -> embed -> ghi vector + trạng thái) và `chat` (truy xuất + LLM stream -> token vào Kafka); cả hai là Kafka consumer, không HTTP.
6. ~~**Image**~~ **ĐÃ CHỐT (đ36)**: người dùng đồng ý, xem mục 2.3a. Nội dung gốc: Claude đề xuất **một image cho mỗi runtime** (`application` Node, `service` Python dùng chung với lệnh khởi động khác nhau, `mcp` sau). **Chờ người dùng xác nhận.** Người dùng hỏi có gộp các Python service vào chung image để giảm số image không (đ35). Hướng đề xuất: một Dockerfile ở gốc `areax-rag-service/`, một image `service` cho mọi Python service; package chung (config, kết nối Postgres/S3/Kafka, hợp đồng message) và mỗi service một package riêng; container khác nhau chỉ ở `command` (vd. `python -m ingestion`, `python -m chat`); compose chạy cùng một image nhiều lần để vẫn có giới hạn RAM và restart riêng cho từng container. Kết quả: toàn dự án 2 image (`application`, `service`), thêm `mcp` sau. Đánh đổi: image lớn hơn, deploy làm tạo lại mọi container service cùng lúc, dùng chung phiên bản thư viện. Tách lại khi một service cần thư viện rất nặng (model local, OCR) hoặc cần scale riêng. Không gộp tất cả vào một image (lý do: ranh giới bảo mật, hai runtime, RAM, restart độc lập, mất deploy theo thư mục).
7. **Docker Hub**: gói free có thể chỉ 1 private repo (nguồn không thống nhất, chưa kiểm chứng). Phương án: một repo + tag theo thành phần (vd. `app-<sha>`, `service-<sha>`), nâng gói, hoặc public. Đọc trang pricing chính thức trước khi chốt.
8. **Cấu trúc monorepo**: thư mục chung cho hợp đồng message, compose cho local, quản lý `.env`, `.gitignore` trước commit đầu (repo public).
9. **Dung lượng Floci**: giới hạn project đã chốt 100MB (đ37). Vẫn nên đo đĩa/RAM VPS để biết VPS chứa được bao nhiêu project: chờ kết quả `ssh floci 'df -h /; free -m; docker stats --no-stream'` (chưa có). Ước tính thô (chưa đo): 100MB file chứa nhiều nhất chừng vài chục MB văn bản, tức vài chục nghìn chunk, vector vài trăm MB mỗi project ở mức trần; thực tế thường nhỏ hơn nhiều vì PDF chứa ảnh/định dạng.
10. **Chunking**: kích thước, overlap, top-k, giới hạn token đầu ra, số tin nhắn lịch sử đưa vào mỗi lượt.
11. **Tên model LLM** (đặt ở env).
12. **Coding standard**: viết khi nào; infra và mcp có cần riêng không; một file dùng chung ở gốc `areax-rag-service/` (đề xuất); nội dung `docs/` (đề xuất: architecture, setup, biến môi trường, hợp đồng message, runbook).
13a. **Format response API**: khung và phần mở rộng đã chốt (đ33, đ34). Còn lại: danh sách `code` lỗi và mã thành công cụ thể, quy ước đặt tên.
13. **UI**: MUI + Bootstrap dùng thế nào để không xung đột style; các trang phase 1: login, home, trang project (tài liệu, prompt, thread, thành viên).
14. **Phiên bản Auth.js** (kiểm tra tài liệu hiện hành khi bắt đầu code).
15. ~~Công khai `areax-rag-requirement/`~~: **đã chốt được công khai** (đ37). Vì vậy tài liệu này không được chứa IP VPS, mật khẩu, API key hay đường dẫn SSH; cần rà trước commit đầu tiên.

### Việc cần thử thực tế (chưa kiểm chứng)
- Kafka hai listener qua SSH tunnel từ máy cá nhân.
- `aws cloudformation deploy` trên Floci với `AWS::S3::Bucket` và `AWS::S3Vectors::Index` (tài liệu không xác nhận `deploy`).
- RAM thực tế của Floci ở chế độ `hybrid`.
- `youtube-transcript-api` khi chạy trên VPS (IP có thể bị chặn).
- Mức cần thiết của mount `/var/run/docker.sock` cho Floci (cấp quyền rất cao trên host).

### Rủi ro đã ghi nhận
- Mất tunnel thì application/service trên máy cá nhân lỗi kết nối; cần reconnect ở client.
- Độ trễ stream token tăng do đi vòng qua VPS (chấp nhận).
- Kafka consumer trong Next.js khởi tạo một lần, chỉ hợp một instance.
- Floci là emulator: độ bền dữ liệu phụ thuộc chế độ lưu trữ; không backup ở phase này.
- Repo public: không commit API key, mật khẩu, SSH key, `.env`, IP VPS (file `note.txt` của Floci chứa IP, ở ngoài repo, không đưa vào).
- Quyền merge vào `deployment/prod` cần giới hạn khi bật CI/CD.
- Test (sau này) không được gọi OpenAI thật.

---

## 5. Đề xuất bổ sung của Claude (chưa chốt)

- `areax-rag-infra/` có file hướng dẫn và cấu hình tham chiếu (compose cho Postgres/Kafka) để chạy tay lặp lại được.
- Khi bật CI/CD sau này: build trên runner GitHub (không build trên VPS 2 core/4GB), gắn tag theo git SHA, deploy qua SSH (`docker compose pull && up -d`), `concurrency` group, health check, rollback bằng tag cũ, migration trước khi khởi động app mới, secret trong GitHub Secrets hoặc `.env` chỉ trên VPS.
- Docker trên VPS: `docker login` một lần với token read-only; runner dùng token ghi riêng. Repo public thì VPS clone qua HTTPS (`https://github.com/khanglenguyen192/areax-rag.git`) không cần credential.
- SSH key-only, tắt đăng nhập mật khẩu trên VPS.

---

## 6. Ghi chú tham khảo (do Claude tra/đọc)

### 6.1 `ocr-rag` (`<local>/ocr-rag`)
- FastAPI + Pydantic Settings, Docker `python:3.11-slim`, cấu trúc `app/{routers,core,ocr_engine,services,schemas,utils}`.
- Nguồn: PDF văn bản (`pymupdf4llm`), PDF scan/ảnh (OCR), YouTube transcript (`youtube-transcript-api`); đầu ra Markdown. Giới hạn file 50MB; validate MIME/size/extension.
- Có tham khảo flow job bất đồng bộ (PENDING -> DONE); với areax-rag vai trò này do Kafka đảm nhiệm.
- Phần OCR không dùng (LightOnOCR cần >= 8GB RAM). Chỉ tham khảo `pymupdf4llm` và YouTube.
- Không đọc `.env` của `ocr-rag`. Có `skill/coding-standard-python.md` (và hai file skill khác) có thể tham khảo cho chuẩn Python; chưa đọc.

### 6.2 Floci (floci.io, `docker-compose.yml` local của người dùng)
- **S3 Vectors hỗ trợ**: Create/Get/List/DeleteVectorBucket, Create/Get/List/DeleteIndex, Put/Get/DeleteVectors, QueryVectors. Filter metadata (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$exists`, `$and`, `$or`), lọc **trước** khi xếp hạng và cắt top-K. Số chiều 1..4096. Hạn chế: không mã hoá KMS thật; tối đa 10 key metadata không-lọc-được; xoá CloudFormation lỗi nếu bucket có index ngoài stack; chưa rõ định dạng lưu và hiệu năng.
- **S3**: multipart (part không cuối >= 5 MiB; upload dở mất khi restart), presigned URL (GET/PUT/POST), versioning, CORS, bucket policy (không thực thi mặc định, cần `FLOCI_SERVICES_S3_ENFORCE_AUTH`), event notification (SQS/SNS/Lambda). Ở chế độ `memory` object tối đa ~2 GiB.
- **CloudFormation**: hỗ trợ S3 (`Bucket`, `BucketPolicy`), S3 Vectors (`VectorBucket`, `Index`), IAM, SQS, SNS, SSM, KMS, Secrets Manager, Lambda, DynamoDB... Loại không hỗ trợ bị bỏ qua (stub, log WARN); đặt `FLOCI_SERVICES_CLOUDFORMATION_ALLOW_STUB_UNSUPPORTED_RESOURCE_TYPES=false` để fail rõ ràng. Dùng CLI với `--endpoint-url`.
- **Lưu trữ**: `memory` (mất khi restart), `persistent` (ghi đĩa trước khi xác nhận, chậm dần khi lớn), `hybrid` (ghi bất đồng bộ, có thể mất thay đổi gần nhất khi tắt đột ngột; đọc từ bộ nhớ), `wal` (nhiều ghi). Image mặc định `memory`.
- **Dung lượng**: không có hạn mức riêng; giới hạn thực là ổ đĩa VPS; request body tối đa 2048 MB (`FLOCI_PROTOCOLS_MAX_REQUEST_SIZE`); không rõ `hybrid` có giữ toàn bộ dữ liệu trong RAM không (cần đo); không có thông tin JVM heap/RAM.
- **Thiết lập hiện có**: compose cho VPS dùng `floci/floci:latest`, cổng `127.0.0.1:4566`, `FLOCI_STORAGE_MODE=hybrid`, mount `/var/run/docker.sock`, volume `floci_data`. Có MSK trong danh sách nhưng Kafka được chọn tự host.

### 6.3 Ước tính vector (chưa đo)
- 1 vector 1536 chiều float32 = 6144 byte. 100.000 chunk ≈ 600 MB, thường lớn hơn text gốc vài lần.

### 6.4 Docker Hub (các nguồn không thống nhất, chưa kiểm chứng)
- Gói free: nhiều nguồn ghi 1 private repo; một thread diễn đàn cho thấy tạo được nhiều hơn. Pull: 100/giờ/user hoặc 200/6 giờ (nguồn mâu thuẫn). Gói trả phí không giới hạn pull; giá khoảng 5 đến 11 USD/tháng (mâu thuẫn).

### 6.5 YouTube (chưa kiểm chứng)
- `youtube-transcript-api` không chính thức, có thể hỏng khi YouTube đổi. IP VPS/cloud thường bị chặn. Video không phụ đề, phụ đề tự sinh kém, nhiều ngôn ngữ cần xử lý lỗi.

### 6.6 Auth.js
- Thư viện xác thực cho Next.js (trước là NextAuth): form login, session, cookie, CSRF, đăng nhập Google/GitHub. Credentials provider mặc định dùng JWT, khó thu hồi ngay; được bù bằng cách kiểm tra quyền từ DB mỗi request.

### 6.7 CI trên GitHub (đã bỏ quality gate, giữ làm tham khảo)
- Job `quality` + `needs` có thể chặn deploy; branch protection chặn merge. Runner GitHub miễn phí cho repo public. Không đặt self-hosted runner trên VPS 4GB. Test phải mock OpenAI.
