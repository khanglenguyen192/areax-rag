import { TextInput } from "@/components/atoms";
import styles from "./FormField.module.scss";

type FormFieldProps = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Already translated message; the field shows an error state when set. */
  readonly error?: string;
  readonly hint?: string;
  readonly type?: "text" | "password";
  readonly placeholder?: string;
  readonly autoComplete?: string;
  readonly autoFocus?: boolean;
  readonly disabled?: boolean;
  readonly rows?: number;
  readonly maxLength?: number;
  readonly onSubmit?: () => void;
};

export function FormField({ id, label, error, hint, ...input }: FormFieldProps) {
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <TextInput
        id={id}
        hasError={Boolean(error)}
        describedBy={message ? messageId : undefined}
        {...input}
      />
      {message && (
        <p
          id={messageId}
          className={error ? styles.error : styles.hint}
          role={error ? "alert" : undefined}
        >
          {message}
        </p>
      )}
    </div>
  );
}
