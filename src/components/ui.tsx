import type { ComponentChildren } from 'preact';
import { useState, useEffect } from 'preact/hooks';

interface StepperProps {
  value: number | undefined;
  onChange: (v: number) => void;
  onStep?: (dir: 1 | -1) => number;
  step?: number;
  min?: number;
  format?: (v: number | undefined) => string;
  label?: string;
  decimal?: boolean;
}

/** Поле с кнопками − / +; число можно ввести и вручную. */
export function Stepper({ value, onChange, onStep, step = 1, min = 0, format, label, decimal }: StepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  useEffect(() => {
    if (!editing) setDraft(value == null ? '' : String(value).replace('.', ','));
  }, [value, editing]);

  const bump = (dir: 1 | -1) => {
    const next = onStep ? onStep(dir) : Math.max(min, (value ?? 0) + dir * step);
    onChange(Math.round(next * 100) / 100);
  };
  const commit = () => {
    setEditing(false);
    const n = parseFloat(draft.replace(',', '.'));
    if (!isNaN(n) && n >= min) onChange(Math.round(n * 100) / 100);
  };

  return (
    <div class="stepper" aria-label={label}>
      <button type="button" class="step-btn" onClick={() => bump(-1)} aria-label="меньше">
        −
      </button>
      {editing ? (
        <input
          class="step-input"
          inputMode={decimal ? 'decimal' : 'numeric'}
          value={draft}
          autoFocus
          onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      ) : (
        <button type="button" class="step-value" onClick={() => setEditing(true)}>
          {format ? format(value) : value ?? '—'}
        </button>
      )}
      <button type="button" class="step-btn" onClick={() => bump(1)} aria-label="больше">
        +
      </button>
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ComponentChildren }) {
  return (
    <div class="sheet-backdrop" onClick={onClose}>
      <div class="sheet" onClick={(e) => e.stopPropagation()}>
        <div class="sheet-head">
          <h3>{title}</h3>
          <button class="icon-btn" onClick={onClose} aria-label="закрыть">
            ✕
          </button>
        </div>
        <div class="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Check({ checked, onClick, label }: { checked: boolean; onClick: () => void; label?: string }) {
  return (
    <button type="button" class={'check' + (checked ? ' on' : '')} onClick={onClick} aria-pressed={checked} aria-label={label}>
      {checked ? '✓' : ''}
    </button>
  );
}
