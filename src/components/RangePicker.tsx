/** Выбор периода двумя датами (календарь) + сброс к периоду по умолчанию. */
export function RangePicker({
  from,
  to,
  onChange,
  defaultFrom,
  defaultTo,
  defaultLabel
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  defaultFrom: string;
  defaultTo: string;
  defaultLabel: string;
}) {
  return (
    <section class="card range">
      <span class="stat-label">Период</span>
      <div class="range-row">
        <input class="text-input date-input" type="date" value={from} max={to} onChange={(e) => onChange((e.target as HTMLInputElement).value || from, to)} />
        <span class="muted">—</span>
        <input class="text-input date-input" type="date" value={to} min={from} onChange={(e) => onChange(from, (e.target as HTMLInputElement).value || to)} />
      </div>
      {(from !== defaultFrom || to !== defaultTo) && (
        <button class="link small" onClick={() => onChange(defaultFrom, defaultTo)}>
          {defaultLabel}
        </button>
      )}
    </section>
  );
}

export function ProgressTabs({ active }: { active: 'body' | 'exercises' }) {
  return (
    <div class="seg progress-tabs">
      <button class={active === 'body' ? 'on' : ''} onClick={() => (location.hash = '#/body')}>
        Тело
      </button>
      <button class={active === 'exercises' ? 'on' : ''} onClick={() => (location.hash = '#/exercises')}>
        Упражнения
      </button>
    </div>
  );
}
