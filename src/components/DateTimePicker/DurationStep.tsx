import type { DurationOption } from "./types";

interface DurationStepProps {
  durations: DurationOption[];
  value: string | null;
  onChange: (durationId: string) => void;
}

export function DurationStep({ durations, value, onChange }: DurationStepProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {durations.map((option) => {
        const selected = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-md border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-ring ${
              selected ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted"
            }`}
            aria-pressed={selected}
          >
            <span className="block font-semibold">{option.label}</span>
            <span className={`mt-1 block text-sm ${selected ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
              {option.minutes} min
            </span>
          </button>
        );
      })}
    </div>
  );
}
