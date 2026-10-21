import { useEffect, useState } from 'preact/hooks';
import { db } from '../db';
import { useLive } from '../hooks';
import { Stepper } from './ui';
import { fmt1, lastWith, waistDue, daysBetween } from '../body';

/** Карточка утреннего замера на экране «Сегодня»: вес каждый день, талия — по желанию и раз в неделю по напоминанию. */
export function BodyCard({ date }: { date: string }) {
  const entries = useLive(() => db.body.toArray(), []);
  const [editing, setEditing] = useState(false);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [waist, setWaist] = useState<number | undefined>(undefined);
  const [withWaist, setWithWaist] = useState(false);

  const today = entries?.find((e) => e.date === date);
  const due = entries ? waistDue(entries, date) : false;

  useEffect(() => {
    if (!entries) return;
    setWeight(today?.weight ?? lastWith(entries, 'weight', date)?.weight ?? 80);
    setWaist(today?.waist ?? lastWith(entries, 'waist', date)?.waist ?? 85);
    setWithWaist(today ? today.waist != null : waistDue(entries, date));
  }, [entries === undefined, editing, date]);

  if (!entries) return null;

  if (today && !editing) {
    return (
      <section class="card body-card done-row">
        <div>
          <div class="eyebrow">Утренний замер</div>
          <div class="body-values">
            {fmt1(today.weight)} кг{today.waist != null ? ` · талия ${today.waist} см` : ''}
          </div>
          {due && <div class="small warn-text">Талию не измерял неделю</div>}
        </div>
        <button class="chip" onClick={() => setEditing(true)}>
          Изменить
        </button>
      </section>
    );
  }

  const lastWaist = lastWith(entries, 'waist', date);
  const save = async () => {
    await db.body.put({ date, weight, ...(withWaist ? { waist } : {}) });
    setEditing(false);
  };

  return (
    <section class="card body-card">
      <div class="eyebrow">Утренний замер</div>
      <div class="form-row">
        <span>Вес, кг</span>
        <Stepper value={weight} step={0.1} decimal format={(v) => fmt1(v)} onChange={setWeight} label="вес" />
      </div>
      <div class="form-row">
        <button class={'chip' + (withWaist ? ' accent' : '')} onClick={() => setWithWaist((v) => !v)}>
          {withWaist ? '✓ Талия, см' : '+ Талия'}
        </button>
        {withWaist && (
          <Stepper
            value={waist}
            step={1}
            onChange={(v) => {
              setWaist(Math.round(v));
              setWithWaist(true);
            }}
            label="талия"
          />
        )}
      </div>
      {due && (
        <div class="small warn-text">
          {lastWaist ? `Пора измерить талию — прошло ${daysBetween(lastWaist.date, date)} дн.` : 'Измерь талию — записей ещё нет.'}
        </div>
      )}
      <div class="sheet-actions">
        {editing && (
          <button class="btn" onClick={() => setEditing(false)}>
            Отмена
          </button>
        )}
        <button class="btn primary" onClick={save}>
          Сохранить
        </button>
      </div>
    </section>
  );
}
