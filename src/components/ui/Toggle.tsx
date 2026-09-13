interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

/**
 * Accessible on/off switch. Spring-animated knob that snaps on release;
 * press feedback on the track itself.
 */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label ?? "Toggle"}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-pill transition-colors duration-ui ease-spring focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 active:scale-95 active:duration-press ${
        checked ? "bg-contrast" : "bg-shade-40"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-canvas-light shadow transition-all duration-ui ease-spring ${
          checked ? "start-6" : "start-1"
        }`}
      />
    </button>
  );
}
