import type { MeetingType } from "./types";

interface DurationStepProps {
  value: MeetingType | null;
  onChange: (type: MeetingType) => void;
}

const options: Array<{ value: MeetingType; label: string; description: string }> = [
  {
    value: "in_depth",
    label: "In-depth meeting",
    description: "75 min"
  },
  {
    value: "short_form",
    label: "Short-form meeting",
    description: "45 min"
  }
];

export function DurationStep({ value, onChange }: DurationStepProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-md border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-ring ${
              selected ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted"
            }`}
            aria-pressed={selected}
          >
            <span className="block font-semibold">{option.label}</span>
            <span className={`mt-1 block text-sm ${selected ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
