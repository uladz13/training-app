import { useState } from 'preact/hooks';
import { db, requestPersistence } from '../db';
import { useLive } from '../hooks';
import { exportBackup, importBackup } from '../backup';
import { DAY_NAMES, kg } from '../util';
import { availableWeights } from '../weights';

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

      <section class="card">
        <h2>Инвентарь</h2>
        <p class="muted small">Блины: 8 × 3 кг, 4 × 2,5 кг, 4 × 1,25 кг. Грифы — 0 кг.</p>
        <p class="small">
          <strong>Пара гантелей:</strong> {availableWeights('db2').filter(Boolean).map(kg).join(' · ')}
        </p>
        <p class="small">
          <strong>Одна гантель / штанга:</strong> {availableWeights('db1').filter(Boolean).map(kg).join(' · ')}
        </p>
      </section>

      <section class="card">
        <h2>Программа</h2>
        {(templates ?? []).map((t) => (
          <details class="tpl">
            <summary>
              <strong>{DAY_NAMES[t.day]}</strong> — {t.title}
            </summary>
            <ol class="plan">
              {t.items.map((it) => (
                <li>
                  <span>{byId.get(it.exerciseId)?.name ?? it.exerciseId}</span>
                  <span class="muted small">
                    {it.sets} × {it.min === it.max ? it.min : `${it.min}–${it.max}`}
                    {byId.get(it.exerciseId)?.kind === 'time' ? ' с' : ''}
                  </span>
                </li>
              ))}
            </ol>
          </details>
        ))}
      </section>

      <p class="muted small center">Тренировки · версия 0.1.0</p>
    </div>
  );
}
