import { Alert, Button } from "@/components/atoms";
import { useT } from "@/hooks/common/useT";

type ErrorMessageProps = {
  /** Already translated message. */
  readonly message: string;
  readonly onRetry?: () => void;
};

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  const t = useT();

  return (
    <Alert
      tone="error"
      action={
        onRetry && (
          <Button variant="text" onClick={onRetry}>
            {t("common.retry")}
          </Button>
        )
      }
    >
      {message}
    </Alert>
  );
}
