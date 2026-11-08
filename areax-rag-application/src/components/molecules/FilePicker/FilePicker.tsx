import { useRef } from "react";
import { Button } from "@/components/atoms";
import styles from "./FilePicker.module.scss";

type FilePickerProps = {
  readonly label: string;
  /** Value for the input's `accept` attribute, for example `.pdf,.docx`. */
  readonly accept: string;
  readonly isLoading?: boolean;
  readonly disabled?: boolean;
  readonly onPick: (file: File) => void;
};

export function FilePicker({
  label,
  accept,
  isLoading = false,
  disabled = false,
  onPick,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        className={styles.input}
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Reset so picking the same file twice in a row still fires a change event.
          event.target.value = "";
          if (file) onPick(file);
        }}
      />
      <Button
        variant="secondary"
        isLoading={isLoading}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
    </>
  );
}
