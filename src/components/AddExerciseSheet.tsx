import { useState } from 'preact/hooks';
import type { Equipment, Exercise, ExerciseKind } from '../types';
import { Sheet } from './ui';
import { db } from '../db';
import { uid } from '../util';

interface Props {
  exercises: Exercise[];
  onPick: (ex: Exercise) => void;
  onClose: () => void;
}

const KINDS: [ExerciseKind, string][] = [
  ['weight', 'С весом'],
  ['reps', 'Повторы без веса'],
  ['time', 'На время']
];
const EQUIP: [Equipment, string][] = [
  ['db2', 'Две гантели'],
  ['db1', 'Одна гантель'],
  ['barbell', 'Штанга']
];

export function AddExerciseSheet({ exercises, onPick, onClose }: Props) {
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<ExerciseKind>('weight');
  const [equipment, setEquipment] = useState<Equipment>('db2');
  const [perSide, setPerSide] = useState(false);
  const [technique, setTechnique] = useState('');

  const list = exercises
    .filter((e) => e.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  const create = async () => {
    if (!name.trim()) return;
    const ex: Exercise = {
      id: 'custom-' + uid(),
      name: name.trim(),
      kind,
      equipment: kind === 'weight' ? equipment : 'none',
      perSide,
      technique: technique.trim() || 'Описание не добавлено.',
      custom: true
    };
    await db.exercises.put(ex);
    onPick(ex);
  };

  return (
    <Sheet title={creating ? 'Новое упражнение' : 'Добавить упражнение'} onClose={onClose}>
      {!creating ? (
        <>
          <input class="text-input" placeholder="Поиск" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
          <button class="list-item accent" onClick={() => setCreating(true)}>
            + Создать новое упражнение
          </button>
          {list.map((e) => (
            <button class="list-item" onClick={() => onPick(e)}>
              {e.name}
            </button>
          ))}
        </>
      ) : (
        <>
          <label class="field">
            <span>Название</span>
            <input class="text-input" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
          </label>
          <div class="field">
            <span>Тип</span>
            <div class="seg">
              {KINDS.map(([k, l]) => (
                <button class={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {kind === 'weight' && (
            <div class="field">
              <span>Инвентарь</span>
              <div class="seg">
                {EQUIP.map(([k, l]) => (
                  <button class={equipment === k ? 'on' : ''} onClick={() => setEquipment(k)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label class="field inline">
            <input type="checkbox" checked={perSide} onChange={(e) => setPerSide((e.target as HTMLInputElement).checked)} />
            <span>Выполняется на каждую сторону (Л/П)</span>
          </label>
          <label class="field">
            <span>Техника (необязательно)</span>
            <textarea class="text-input" rows={3} value={technique} onInput={(e) => setTechnique((e.target as HTMLTextAreaElement).value)} />
          </label>
          <div class="sheet-actions">
            <button class="btn" onClick={() => setCreating(false)}>
              Назад
            </button>
            <button class="btn primary" disabled={!name.trim()} onClick={create}>
              Создать и добавить
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
