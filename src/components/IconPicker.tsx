import { EXERCISE_ICONS, ICON_GROUPS, iconFor, iconSvg, type IconGroup } from '../data/icons';

interface Props {
  /** упражнение (для штатной иконки) */
  exId: string;
  /** выбранная иконка; undefined — по умолчанию */
  value: string | undefined;
  onChange: (icon: string | undefined) => void;
}

const Icon = ({ id, size }: { id: string; size: number }) => (
  <span
    class="ex-icon"
    dangerouslySetInnerHTML={{ __html: iconSvg(EXERCISE_ICONS.find((i) => i.id === id)!, size) }}
  />
);

/** Сетка выбора иконки упражнения по группам мышц; первая клетка — «По умолчанию». */
export function IconPicker({ exId, value, onChange }: Props) {
  const standard = iconFor({ id: exId });
  const groups = Object.keys(ICON_GROUPS) as IconGroup[];
  return (
    <div class="icon-picker">
      <div class="icon-grid">
        <button class={'icon-cell wide' + (value == null ? ' on' : '')} onClick={() => onChange(undefined)}>
          <Icon id={standard.id} size={36} />
          <span class="small">По умолчанию</span>
        </button>
      </div>
      {groups.map((g) => (
        <>
          <div class="icon-group muted small">
            <i style={{ background: ICON_GROUPS[g].color }} />
            {ICON_GROUPS[g].name}
          </div>
          <div class="icon-grid">
            {EXERCISE_ICONS.filter((i) => i.group === g).map((i) => (
              <button
                class={'icon-cell' + (value === i.id ? ' on' : '')}
                onClick={() => onChange(i.id)}
                aria-label={i.name}
                title={i.name}
              >
                <Icon id={i.id} size={36} />
              </button>
            ))}
          </div>
        </>
      ))}
    </div>
  );
}
