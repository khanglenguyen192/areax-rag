import Tab from "@mui/material/Tab";
import MuiTabs from "@mui/material/Tabs";

export type TabItem = {
  readonly value: string;
  readonly label: string;
};

type TabsProps = {
  readonly items: readonly TabItem[];
  readonly value: string;
  readonly ariaLabel: string;
  readonly onChange: (value: string) => void;
};

export function Tabs({ items, value, ariaLabel, onChange }: TabsProps) {
  return (
    <MuiTabs
      value={value}
      aria-label={ariaLabel}
      variant="scrollable"
      scrollButtons="auto"
      onChange={(_event, next: string) => onChange(next)}
    >
      {items.map((item) => (
        <Tab key={item.value} value={item.value} label={item.label} />
      ))}
    </MuiTabs>
  );
}
