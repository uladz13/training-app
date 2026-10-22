import { useState } from 'preact/hooks';
import { db } from '../db';
import { useLive } from '../hooks';
import { LineChart } from '../components/LineChart';
import { ProgressTabs } from '../components/RangePicker';
import { Sheet, Stepper } from '../components/ui';
import { ShowMore, useShowMore } from '../components/ShowMore';
import { fmt1, weightSeries, lastWith, waistDue } from '../body';
import { formatDate, todayIso } from '../util';
import type { BodyEntry } from '../types';

const DEFAULT_RANGE_DAYS = 14;

function delta(n: number, unit: string, d = 1): string {
  const s = n > 0 ? '+' : n < 0 ? '−' : '±';
  return `${s}${Math.abs(n).toFixed(d).replace('.', ',')} ${unit}`;
}

export function BodyScreen() {
  const entries = useLive(() => db.body.toArray(), []);
  const [edit, setEdit] = useState<BodyEntry | null>(null);
  const today = todayIso();
  // Период графиков: по умолчанию последние 14 дней (сегодня − 14 … сегодня).
  const [from, setFrom] = useState(shift(today, -DEFAULT_RANGE_DAYS));
  const [to, setTo] = useState(today);
  const [shown, showMore] = useShowMore(null);
  if (!entries) return <div class="loading">Загрузка…</div>;

  const series = weightSeries(entries);
  const lastAvg = series[series.length - 1];
  const weekAgo = lastAvg ? series.filter((p) => p.date <= shift(lastAvg.date, -7)).pop() : undefined;
  const waists = entries.filter((e) => e.waist != null).sort((a, b) => (a.date < b.date ? -1 : 1));
  const lastWaist = lastWith(entries, 'waist');
  const firstWaist = waists[0];
  const list = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
  const inRange = (d: string) => d >= from && d <= to;

  return (
    <div class="screen">
      <div class="screen-head">
        <h1>Прогресс</h1>
      </div>
      <ProgressTabs active="body" />

      <section class="card">
        <div class="tiles">
          <div class="tile">
            <span class="stat-label">Вес, среднее за 7 дней</span>
            <span class="tile-value">{lastAvg ? `${fmt1(lastAvg.avg)} кг` : '—'}</span>
            {lastAvg && weekAgo && <span class="muted small">{delta(lastAvg.avg - weekAgo.avg, 'кг')} за неделю</span>}
          </div>
          <div class="tile">
            <span class="stat-label">Талия</span>
            <span class="tile-value">{lastWaist ? `${lastWaist.waist} см` : '—'}</span>
            {lastWaist && firstWaist && firstWaist.date !== lastWaist.date && (
              <span class="muted small">
                {delta(lastWaist.waist! - firstWaist.waist!, 'см', 0)} с {formatDate(firstWaist.date)}
              </span>
            )}
          </div>
        </div>
        {waistDue(entries, today) && <div class="small warn-text">Пора измерить талию — запиши на экране «Сегодня».</div>}
      </section>

      <section class="card range">
        <span class="stat-label">Период графиков</span>
        <div class="range-row">
          <input class="text-input date-input" type="date" value={from} max={to} onChange={(e) => setFrom((e.target as HTMLInputElement).value || from)} />
          <span class="muted">—</span>
          <input class="text-input date-input" type="date" value={to} min={from} onChange={(e) => setTo((e.target as HTMLInputElement).value || to)} />
        </div>
        {(from !== shift(today, -DEFAULT_RANGE_DAYS) || to !== today) && (
          <button class="link small" onClick={() => { setFrom(shift(today, -DEFAULT_RANGE_DAYS)); setTo(today); }}>
            Последние 14 дней
          </button>
        )}
      </section>

      <section class="card">
        <h2>Вес</h2>
        <LineChart
          points={series.filter((p) => inRange(p.date)).map((p) => ({ date: p.date, value: p.weight }))}
          unit="кг"
          decimals={1}
          pointLabel="Утренний вес"
          from={from}
          to={to}
        />
      </section>

      <section class="card">
        <h2>Талия</h2>
        <LineChart
          points={waists.filter((e) => inRange(e.date)).map((e) => ({ date: e.date, value: e.waist! }))}
          unit="см"
          decimals={0}
          pointLabel="Талия"
          from={from}
          to={to}
        />
      </section>

      <section class="card">
        <div class="row-between">
          <h2>Записи</h2>
          <button class="chip" onClick={() => setEdit({ date: today })}>
            + Добавить
          </button>
        </div>
        <table class="body-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Вес, кг</th>
              <th>Талия, см</th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, shown).map((e) => (
              <tr onClick={() => setEdit(e)}>
                <td>{formatDate(e.date)}</td>
                <td>{fmt1(e.weight)}</td>
                <td>{e.waist ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ShowMore shown={shown} total={list.length} onMore={showMore} />
      </section>

      {edit && <EditSheet entry={edit} entries={entries} onClose={() => setEdit(null)} />}
    </div>
  );
}

function shift(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function EditSheet({ entry, entries, onClose }: { entry: BodyEntry; entries: BodyEntry[]; onClose: () => void }) {
  const exists = entries.some((e) => e.date === entry.date) && entry.weight !== undefined;
  const [date, setDate] = useState(entry.date);
  const [weight, setWeight] = useState<number | undefined>(entry.weight ?? lastWith(entries, 'weight')?.weight ?? 80);
  const [waist, setWaist] = useState<number | undefined>(entry.waist ?? lastWith(entries, 'waist')?.waist);
  const [withWaist, setWithWaist] = useState(entry.waist != null);

  const write = async () => {
    if (date !== entry.date && exists) await db.body.delete(entry.date);
    await db.body.put({ date, weight, ...(withWaist && waist != null ? { waist } : {}) });
  };
  const save = async () => {
    await write();
    onClose();
  };
  /** Для ввода старых данных подряд: сохранить и перейти к следующей дате. */
  const saveNext = async () => {
    await write();
    setDate(shift(date, 1));
  };
  const remove = async () => {
    if (confirm(`Удалить замер за ${formatDate(entry.date)}?`)) {
      await db.body.delete(entry.date);
      onClose();
    }
  };

  return (
    <Sheet title={exists ? 'Замер' : 'Новый замер'} onClose={onClose}>
      <label class="form-row">
        <span>Дата</span>
        <input class="text-input date-input" type="date" value={date} onChange={(e) => setDate((e.target as HTMLInputElement).value)} />
      </label>
      <div class="form-row">
        <span>Вес, кг</span>
        <Stepper value={weight} step={0.1} decimal format={(v) => fmt1(v)} onChange={setWeight} />
      </div>
      <div class="form-row">
        <button class={'chip' + (withWaist ? ' accent' : '')} onClick={() => setWithWaist((v) => !v)}>
          {withWaist ? '✓ Талия, см' : '+ Талия'}
        </button>
        {withWaist && <Stepper value={waist ?? 85} step={1} onChange={(v) => setWaist(Math.round(v))} />}
      </div>
      {entries.some((e) => e.date === date && date !== entry.date) && (
        <div class="small warn-text">За эту дату уже есть замер — он будет заменён.</div>
      )}
      <div class="sheet-actions">
        {exists && (
          <button class="btn danger" onClick={remove}>
            Удалить
          </button>
        )}
        {!exists && (
          <button class="btn" onClick={saveNext}>
            Сохранить и след. день
          </button>
        )}
        <button class="btn primary" onClick={save}>
          Сохранить
        </button>
      </div>
      {!exists && <p class="muted small">«Сохранить и след. день» удобно для ввода старых записей подряд: дата сдвигается на день, значения остаются.</p>}
    </Sheet>
  );
}
