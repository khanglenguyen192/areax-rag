/** Events delivered by `GET /api/events`. Keep in sync with section 21 of CODING_STANDARD.md. */
export type SseEvent =
  | {
      readonly type: "token";
      readonly threadId: string;
      readonly messageId: string;
      readonly text: string;
    }
  | { readonly type: "done"; readonly threadId: string; readonly messageId: string }
  | {
      readonly type: "error";
      readonly threadId: string;
      readonly messageId: string;
      readonly code: string;
    };

export type SseEventType = SseEvent["type"];
