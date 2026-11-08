import { useState } from "react";
import { Button, TextInput, VisuallyHidden } from "@/components/atoms";
import styles from "./ChatInput.module.scss";

type ChatInputProps = {
  readonly id: string;
  readonly label: string;
  readonly placeholder: string;
  readonly sendLabel: string;
  readonly disabled?: boolean;
  readonly isSending?: boolean;
  readonly onSend: (text: string) => void;
};

export function ChatInput({
  id,
  label,
  placeholder,
  sendLabel,
  disabled = false,
  isSending = false,
  onSend,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0 && !disabled && !isSending;

  const handleSend = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <form
      className={styles.root}
      onSubmit={(event) => {
        event.preventDefault();
        handleSend();
      }}
    >
      <label htmlFor={id}>
        <VisuallyHidden>{label}</VisuallyHidden>
      </label>
      <div className={styles.row}>
        <TextInput
          id={id}
          value={value}
          onChange={setValue}
          placeholder={placeholder}
          disabled={disabled}
        />
        <Button type="submit" disabled={!canSend} isLoading={isSending}>
          {sendLabel}
        </Button>
      </div>
    </form>
  );
}
