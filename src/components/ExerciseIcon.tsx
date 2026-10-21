import { iconFor, iconSvg } from '../data/icons';

interface Props {
  ex: { id: string; icon?: string };
  size?: number;
  class?: string;
}

/** Иконка упражнения (SVG из data/icons.ts). */
export function ExerciseIcon({ ex, size = 24, class: cls }: Props) {
  return (
    <span
      class={'ex-icon' + (cls ? ' ' + cls : '')}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: iconSvg(iconFor(ex), size) }}
    />
  );
}
