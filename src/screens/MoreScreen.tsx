import { useState } from 'preact/hooks';
import { go } from '../router';
import { db, requestPersistence } from '../db';
import { useLive } from '../hooks';
import { exportBackup, importBackup } from '../backup';
import { DAY_NAMES, kg } from '../util';
import { availableWeights, layoutLabel } from '../weights';
import type { Equipment } from '../types';

export function MoreScreen() {
  const [msg, setMsg] = useState('');
  const persisted = useLive(async () => (navigator.storage?.persisted ? navigator.storage.persisted() : false), []);
  const lastBackup = useLive(() => db.meta.get('lastBackup'), []);
  const templates = useLive(() => db.templates.toArray(), []);
  const exercises = useLive(() => db.exercises.toArray(), []);
  const byId = new Map((exercises ?? []).map((e) => [e.id, e]));

  const onImport = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!confirm('Все текущие данные будут заменены данными из файла. Продолжить?')) return;
    try {
      const n = await importBackup(file);
      setMsg(`Импортировано тренировок: ${n}`);
    } catch (err) {
      setMsg('Ошибка: ' + (err as Error).message);
    }
  };

  return (
    <div class="screen">
      <div class="screen-head">
        <h1>Ещё</h1>
      </div>

      <section class="card">
        <h2>Бэкап</h2>
        <p class="muted small">
          Данные хранятся только на этом телефоне. Сохраняй файл бэкапа хотя бы раз в неделю — например, в Google Диск.
          {lastBackup ? ` Последний: ${new Date(lastBackup.value as string).toLocaleDateString('ru-RU')}.` : ''}
        </p>
        <div class="sheet-actions">
          <button class="btn primary" onClick={() => exportBackup()}>
            Сохранить бэкап
          </button>
          <label class="btn">
            Загрузить из файла
            <input type="file" accept="application/json,.json" hidden onChange={onImport} />
          </label>
        </div>
        {msg && <p class="small">{msg}</p>}
        <p class="muted small">
          Постоянное хранилище: {persisted ? 'включено' : 'не подтверждено'}
          {!persisted && (
            <>
              {' · '}
              <button class="link" onClick={async () => setMsg((await requestPersistence()) ? 'Хранилище закреплено' : 'Браузер отказал — сделай бэкап')}>
                запросить
              </button>
            </>
          )}
        </p>
      </section>

      <WeightCalc />

      <section class="card">
        <h2>Программа и упражнения</h2>
        <button class="list-row" onClick={() => go('program')}>
          <span>Программа по дням</span>
          <span class="muted small">{(templates ?? []).length} дней ›</span>
        </button>
        <button class="list-row" onClick={() => go('catalog')}>
          <span>Каталог упражнений</span>
          <span class="muted small">{(exercises ?? []).length} ›</span>
        </button>
      </section>

      <p class="muted small center">Тренировки · версия 0.4.1</p>
    </div>
  );
}

const MODES: [Equipment, string][] = [
  ['db2', 'Пара гантелей'],
  ['db1', 'Одна гантель'],
  ['barbell', 'Штанга']
];

function WeightCalc() {
  const [eq, setEq] = useState<Equipment>('db2');
  const [w, setW] = useState<number | null>(null);
  const list = availableWeights(eq).filter(Boolean);
  return (
    <section class="card calc">
      <h2>Калькулятор весов</h2>
      <p class="muted small">Блины: 8 × 3 кг, 4 × 2,5 кг, 4 × 1,25 кг. Грифы — 0 кг. Только симметричная сборка.</p>
      <div class="seg">
        {MODES.map(([k, l]) => (
          <button class={eq === k ? 'on' : ''} onClick={() => { setEq(k); setW(null); }}>
            {l}
          </button>
        ))}
      </div>
      <div class="calc-weights">
        {list.map((x) => (
          <button class={w === x ? 'on' : ''} onClick={() => setW(x)}>
            {kg(x)}
          </button>
        ))}
      </div>
      <p class="small">
        {w == null
          ? eq === 'db2' ? 'Вес одной гантели в паре, кг. Нажми на вес, чтобы увидеть раскладку.' : 'Нажми на вес, чтобы увидеть раскладку.'
          : <><strong>{kg(w)} кг</strong>{eq === 'db2' ? ' (каждая гантель)' : ''}: {layoutLabel(eq, w)}</>}
      </p>
    </section>
  );
}
