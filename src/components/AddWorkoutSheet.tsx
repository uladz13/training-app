import { useState } from 'preact/hooks';
import { db } from '../db';
import { useLive } from '../hooks';
import { Sheet, Stepper } from './ui';
import { DAY_SHORT, formatDate, todayIso } from '../util';
import { isoDay } from '../data/seed';
import { createWorkout, PAST_DURATION_MIN } from '../workoutLogic';
import { go } from '../router';

/** Тренировка на выбранную дату (сегодня или раньше): дата + день программы. */
export function AddWorkoutSheet({ initialDate, onClose }: { initialDate: string; onClose: () => void }) {
  const today = todayIso();
  const [date, setDate] = useState(initialDate > today ? today : initialDate);
  const [day, setDay] = useState(isoDay(date));
  const [minutes, setMinutes] = useState(PAST_DURATION_MIN);
  const templates = useLive(() => db.templates.toArray(), []);
  const tpl = templates?.find((t) => t.day === day);
  const valid = !!date && date <= today && !!tpl;

  const changeDate = (d: string) => {
    if (!d) return;
    setDate(d);
    setDay(isoDay(d));
  };
  const create = async () => {
    if (!valid) return;
    const id = await createWorkout(date, day, minutes);
    onClose();
    go('workout/' + id);
  };

  return (
    <Sheet title="Тренировка за дату" onClose={onClose}>
      <label class="field">
        <span>Дата</span>
        <input class="text-input date-input" type="date" value={date} max={today} onChange={(e) => changeDate((e.target as HTMLInputElement).value)} />
      </label>
      <div class="field">
        <span>День программы</span>
        <div class="day-picker">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <button class={(d === day ? 'on' : '') + (d === isoDay(date) ? ' today' : '')} onClick={() => setDay(d)}>
              {DAY_SHORT[d]}
            </button>
          ))}
        </div>
        {tpl && <span class="muted small">{tpl.title}</span>}
      </div>
      {date < today && (
        <div class="field">
          <span>Длительность</span>
          <Stepper value={minutes} step={5} onChange={setMinutes} format={(v) => `${v ?? 0} мин`} label="длительность, мин" />
        </div>
      )}
      <p class="muted small">
        {date < today
          ? `${formatDate(date)}: цифры — с последнего раза до этой даты, таймер не запускается; длительность можно поправить и потом — нажатием на таймер.`
          : 'Сегодня: таймер пойдёт, как при обычном старте.'}
      </p>
      <div class="sheet-actions">
        <button class="btn primary" disabled={!valid} onClick={create}>
          Создать
        </button>
      </div>
    </Sheet>
  );
}
