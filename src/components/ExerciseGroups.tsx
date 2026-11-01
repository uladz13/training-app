import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { Exercise } from '../types';
import { ICON_GROUPS, iconFor, type IconGroup } from '../data/icons';

const ORDER = Object.keys(ICON_GROUPS) as IconGroup[];
/** Нейтральная иконка (свои упражнения без выбранной иконки) — группа «Свои», в конце. */
const groupName = (g: IconGroup) => (g === 'neutral' ? 'Свои' : ICON_GROUPS[g].name);

interface Props<T> {
  items: T[];
  exerciseOf: (item: T) => Exercise;
  /** строка поиска: пусто — все группы свёрнуты; иначе — только группы с совпадениями, раскрытые */
  query: string;
  render: (item: T) => ComponentChildren;
}

/** Упражнения, сгруппированные по группе мышц (по иконке), в раскрывающихся списках; по умолчанию свёрнуты. */
export function ExerciseGroups<T>({ items, exerciseOf, query, render }: Props<T>) {
  const [open, setOpen] = useState<Set<IconGroup>>(new Set());
  const q = query.trim().toLowerCase();
  const toggle = (g: IconGroup) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });

  const groups = ORDER.map((g) => ({
    g,
    list: items
      .filter((it) => iconFor(exerciseOf(it)).group === g && (!q || exerciseOf(it).name.toLowerCase().includes(q)))
      .sort((a, b) => exerciseOf(a).name.localeCompare(exerciseOf(b).name, 'ru'))
  })).filter((x) => x.list.length);

  if (q && !groups.length) return <div class="empty small">Ничего не найдено.</div>;
  return (
    <div class="ex-groups">
      {groups.map(({ g, list }) => {
        const expanded = !!q || open.has(g);
        return (
          <div class="ex-group">
            <button class="ex-group-head" onClick={() => !q && toggle(g)} aria-expanded={expanded}>
              <i style={{ background: ICON_GROUPS[g].color }} />
              <span class="ex-group-name">
                {groupName(g)} <span class="muted">· {list.length}</span>
              </span>
              <span class="ex-group-arrow">{expanded ? '▾' : '▸'}</span>
            </button>
            {expanded && <div class="ex-group-list">{list.map(render)}</div>}
          </div>
        );
      })}
    </div>
  );
}
