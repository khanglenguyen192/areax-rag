import OutlinedInput from "@mui/material/OutlinedInput";
import type { ChangeEvent } from "react";

type TextInputProps = {
  readonly id: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly type?: "text" | "password";
  readonly placeholder?: string;
  readonly hasError?: boolean;
  readonly describedBy?: string;
  readonly autoComplete?: string;
  readonly autoFocus?: boolean;
  readonly disabled?: boolean;
  readonly rows?: number;
  readonly maxLength?: number;
  readonly onSubmit?: () => void;
};

export function TextInput({
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  hasError = false,
  describedBy,
  autoComplete,
  autoFocus = false,
  disabled = false,
  rows,
  maxLength,
  onSubmit,
}: TextInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <OutlinedInput
      id={id}
      value={value}
      onChange={handleChange}
      type={type}
      placeholder={placeholder}
      error={hasError}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      disabled={disabled}
      multiline={rows !== undefined}
      minRows={rows}
      fullWidth
      size="small"
      inputProps={{
        "aria-describedby": describedBy,
        "aria-invalid": hasError || undefined,
        maxLength,
      }}
      onKeyDown={(event) => {
        // Enter sends a single-line field; multiline fields keep Enter for new lines.
        if (onSubmit && rows === undefined && event.key === "Enter") onSubmit();
      }}
    />
  );
}
