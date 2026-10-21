// Иконки упражнений. Стиль и часть иконок (гантель, растяжка) — по мотивам IconPark
// (https://github.com/bytedance/IconPark, Apache-2.0); изменено и дорисовано для этого приложения.
// Лицензия — THIRD-PARTY-NOTICES.md. Чистый TS без UI: результат — разметка SVG (viewBox 0 0 48 48).

export type IconGroup = 'back' | 'arms' | 'shoulders' | 'chest' | 'legs' | 'core' | 'mobility' | 'neutral';

export const ICON_GROUPS: Record<IconGroup, { name: string; color: string }> = {
  back: { name: 'Спина', color: '#4da3ff' },
  arms: { name: 'Руки', color: '#ff9f43' },
  shoulders: { name: 'Плечи', color: '#b18cff' },
  chest: { name: 'Грудь', color: '#ff6b8a' },
  legs: { name: 'Ноги и ягодицы', color: '#4fd1a5' },
  core: { name: 'Кор', color: '#ffd43b' },
  mobility: { name: 'Мобилити и растяжка', color: '#38d6e8' },
  neutral: { name: 'Своё упражнение', color: '#8d969e' }
};

export const DEFAULT_ICON = 'default';

const INK = '#e9ecef'; // линии тела
const FLOOR = '#4a525a'; // пол, стена
const BG = '#1b1e21'; // фон карточки — обводка значков

const S = 'stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"';

const line = (pts: string, c = INK) => `<polyline points="${pts}" stroke="${c}" ${S}/>`;
const path = (d: string, c = INK) => `<path d="${d}" stroke="${c}" ${S}/>`;
const head = (x: number, y: number, a: string, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${a}"/>`;
const floor = () => `<line x1="4" y1="44" x2="44" y2="44" stroke="${FLOOR}" ${S}/>`;

/** Гантель: ручка длиной len, на концах поперечные «блины»; 'h' — ручка горизонтально, 'v' — вертикально. */
function db(x: number, y: number, a: string, o: 'h' | 'v' = 'h', len = 8) {
  const h = len / 2;
  const p = 4;
  return o === 'h'
    ? path(`M${x - h} ${y}H${x + h}M${x - h} ${y - p}V${y + p}M${x + h} ${y - p}V${y + p}`, a)
    : path(`M${x} ${y - h}V${y + h}M${x - p} ${y - h}H${x + p}M${x - p} ${y + h}H${x + p}`, a);
}
/** Блин штанги в торец. */
const plate = (x: number, y: number, a: string) =>
  `<circle cx="${x}" cy="${y}" r="6" fill="${a}" stroke="${a}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="1.5" fill="${BG}"/>`;
/** Значок «пауза» — часы в кружке, правый верхний угол. */
const badgeClock = (a: string, x = 39, y = 9) =>
  `<circle cx="${x}" cy="${y}" r="8" fill="${a}" stroke="${BG}" stroke-width="3"/>` +
  `<path d="M${x} ${y - 4}V${y}L${x + 3} ${y + 2}" stroke="${BG}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const chevUp = (x: number, y: number, a: string) => path(`M${x - 3} ${y + 2}L${x} ${y - 2}L${x + 3} ${y + 2}`, a);
const sparks = (x: number, y: number, a: string) =>
  path(`M${x} ${y - 7}V${y - 4}M${x + 6} ${y - 4}L${x + 4} ${y - 2}M${x - 6} ${y - 4}L${x - 4} ${y - 2}`, a);

interface IconDef {
  id: string;
  name: string;
  group: IconGroup;
  draw: (a: string) => string;
}

// id иконки совпадает с id встроенного упражнения.
const DEFS: IconDef[] = [
  // спина
  { id: 'row-one-arm', name: 'Тяга одной рукой в наклоне', group: 'back', draw: (a) =>
      line('12,44 16,22 32,17') + line('16,22 24,32 24,44') + line('31,18 26,31') +
      line('32,18 34,32') + db(34, 34, a) + head(38, 13, a) },
  { id: 'row-two-db', name: 'Тяга двух гантелей в наклоне', group: 'back', draw: (a) =>
      line('14,44 18,34 14,22 32,16') + line('20,44 23,34 14,22') +
      line('31,17 29,30') + line('33,16 36,29') + db(28, 32, a, 'h', 6) + db(37, 31, a, 'h', 6) + head(38, 11, a) },
  { id: 'reverse-fly', name: 'Разведение в наклоне', group: 'back', draw: (a) =>
      line('14,44 18,34 14,22 32,16') + line('20,44 23,34 14,22') +
      line('30,17 24,8') + line('32,16 42,24') + db(23, 6, a, 'v', 6) + db(43, 26, a, 'v', 6) + head(38, 11, a) },

  // руки
  { id: 'biceps-curl', name: 'Бицепс', group: 'arms', draw: (a) =>
      line('18,44 22,30 22,15') + line('26,44 22,30') + line('22,17 22,27 32,20') + db(33, 18, a, 'h', 6) + head(23, 7, a) },
  { id: 'hammer-curl', name: '«Молот»', group: 'arms', draw: (a) =>
      line('18,44 22,30 22,15') + line('26,44 22,30') + line('22,17 22,27 32,20') + db(33, 18, a, 'v', 8) + head(23, 7, a) },
  { id: 'french-press-2db', name: 'Французское разгибание', group: 'arms', draw: (a) =>
      line('18,44 22,32 22,20') + line('26,44 22,32') + line('22,20 24,6 14,12') + db(13, 14, a, 'v', 6) + head(30, 15, a) },

  // плечи
  { id: 'ohp', name: 'Жим вверх стоя', group: 'shoulders', draw: (a) =>
      line('12,9 14,20 34,20 36,9') + line('24,20 24,32') + line('17,44 24,32 31,44') +
      db(12, 6, a, 'h', 8) + db(36, 6, a, 'h', 8) + head(24, 13, a) },
  { id: 'lateral-raise', name: 'Подъём в стороны', group: 'shoulders', draw: (a) =>
      line('8,19 24,19 40,19') + line('24,19 24,32') + line('17,44 24,32 31,44') +
      db(6, 19, a, 'v', 6) + db(42, 19, a, 'v', 6) + head(24, 11, a) },

  // грудь
  { id: 'floor-press', name: 'Жим лёжа на полу', group: 'chest', draw: (a) =>
      floor() + line('14,40 32,40 37,30 42,40') + line('16,40 16,24') + db(16, 21, a, 'h', 10) + head(8, 36, a) },
  { id: 'push-up', name: 'Отжимания', group: 'chest', draw: (a) =>
      floor() + line('6,40 34,27') + line('33,28 34,40') + head(40, 22, a) },

  // ноги и ягодицы
  { id: 'rdl', name: 'Румынская тяга', group: 'legs', draw: (a) =>
      line('20,44 16,24 34,20') + line('24,44 16,24') + line('33,21 33,34') + db(33, 36, a, 'h', 10) + head(40, 17, a) },
  { id: 'glute-bridge', name: 'Ягодичный мост', group: 'legs', draw: (a) =>
      floor() + line('13,40 27,28 37,25 38,40') + head(7, 35, a) },
  { id: 'glute-bridge-bar', name: 'Мост со штангой', group: 'legs', draw: (a) =>
      floor() + line('13,40 27,28 37,25 38,40') + plate(26, 20, a) + head(7, 35, a) },
  { id: 'glute-bridge-pause', name: 'Мост с паузой', group: 'legs', draw: (a) =>
      floor() + line('13,40 27,28 37,25 38,40') + plate(26, 20, a) + head(7, 35, a) + badgeClock(a) },
  { id: 'calf-raise', name: 'Подъёмы на носки', group: 'legs', draw: (a) =>
      `<line x1="26" y1="45" x2="42" y2="45" stroke="${FLOOR}" ${S}/>` +
      line('24,14 24,36 29,41') + line('24,17 19,30') + db(18, 32, a, 'h', 8) + chevUp(37, 34, a) + chevUp(37, 26, a) + head(24, 7, a) },

  // кор
  { id: 'plank', name: 'Планка', group: 'core', draw: (a) =>
      floor() + line('6,40 33,30') + line('33,30 33,40 42,40') + head(39, 26, a) },
  { id: 'side-plank', name: 'Боковая планка', group: 'core', draw: (a) =>
      floor() + line('6,40 30,26') + line('30,26 30,40 37,40') + line('30,26 30,10') + head(36, 21, a) },
  { id: 'shoulder-taps', name: 'Касание плеч', group: 'core', draw: (a) =>
      floor() + line('6,40 32,27') + line('31,28 32,40') + line('32,27 38,33 32,24') + sparks(31, 22, a) + head(39, 22, a) },
  { id: 'dead-bug', name: 'Dead Bug', group: 'core', draw: (a) =>
      floor() + line('14,40 30,40') + line('15,40 15,24') + line('30,40 30,28 40,28') + line('30,40 44,35') +
      `<path d="M6 31L3 25M11 30L13 24" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" fill="none"/>` + head(8, 36, a) },

  // мобилити и растяжка
  { id: 'cat-cow', name: 'Cat-Cow', group: 'mobility', draw: (a) =>
      floor() + line('4,40 14,40 14,28') + path('M14 28Q24 14 34 28') + line('34,28 34,40') +
      `<path d="M37 29L36 23L40 26ZM42 27L44 22L45 28Z" fill="${a}" stroke="${a}" stroke-width="2" stroke-linejoin="round"/>` + head(40, 32, a) },
  { id: 'bird-dog', name: 'Bird Dog', group: 'mobility', draw: (a) =>
      floor() + line('6,40 16,40 16,28 32,28 32,40') + line('16,28 4,25') + line('32,28 44,26') +
      `<path d="M41 19L46 20.5L41 22Z" fill="${a}" stroke="${a}" stroke-width="2" stroke-linejoin="round"/>` + head(37, 20, a) },
  { id: 'stretch-chest', name: 'Растяжка груди', group: 'mobility', draw: (a) =>
      `<line x1="8" y1="4" x2="8" y2="44" stroke="${FLOOR}" ${S}/>` +
      line('22,44 26,30 24,16') + line('30,44 26,30') + line('24,18 12,14') + head(28, 9, a) },
  { id: 'stretch-shoulders', name: 'Растяжка плеч', group: 'mobility', draw: (a) =>
      line('17,44 24,31 31,44') + line('24,31 24,18') + line('31,19 8,19') + line('17,19 18,27 13,23') + head(24, 10, a) },
  { id: 'stretch-hip-flexor', name: 'Растяжка сгибателей бедра', group: 'mobility', draw: (a) =>
      floor() + line('4,40 12,40 20,28 32,28 32,40') + line('20,28 20,18') + line('20,18 10,6') + line('20,18 30,6') + head(20, 11, a, 3.5) },
  { id: 'stretch-hamstring', name: 'Растяжка задней поверхности бедра', group: 'mobility', draw: (a) =>
      floor() + line('10,40 40,40 40,33') + line('10,40 26,28') + line('26,28 38,35') + head(32, 23, a) },
  { id: 'stretch-general', name: 'Общая растяжка', group: 'mobility', draw: (a) =>
      line('41,8 29,17.6 29,44') + line('10.1,23.25 19,18 19,28.9 7,41') + head(24, 8, a) },

  // по умолчанию
  { id: DEFAULT_ICON, name: 'Гантель', group: 'neutral', draw: (a) =>
      path('M14 13.6C14 12.16 12.66 11 11 11S8 12.16 8 13.6V34.4C8 35.84 9.34 37 11 37S14 35.84 14 34.4Z' +
           'M40 13.6C40 12.16 38.66 11 37 11S34 12.16 34 13.6V34.4C34 35.84 35.34 37 37 37S40 35.84 40 34.4Z') +
      path('M8 18.7C8 17.2 6.66 16 5 16S2 17.2 2 18.7V29.3C2 30.8 3.34 32 5 32S8 30.8 8 29.3Z' +
           'M46 18.7C46 17.2 44.66 16 43 16S40 17.2 40 18.7V29.3C40 30.8 41.34 32 43 32S46 30.8 46 29.3Z', a) +
      `<rect x="14" y="21" width="20" height="6" fill="${a}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` }
];

export interface ExerciseIconInfo {
  id: string;
  name: string;
  group: IconGroup;
  /** Содержимое SVG (без тега svg), viewBox 0 0 48 48. */
  body: string;
}

export const EXERCISE_ICONS: ExerciseIconInfo[] = DEFS.map((d) => ({
  id: d.id,
  name: d.name,
  group: d.group,
  body: d.draw(ICON_GROUPS[d.group].color)
}));

const BY_ID = new Map(EXERCISE_ICONS.map((i) => [i.id, i]));

/** Иконка упражнения: выбранная пользователем, иначе штатная по id встроенного упражнения, иначе нейтральная. */
export function iconFor(ex: { id: string; icon?: string }): ExerciseIconInfo {
  return BY_ID.get(ex.icon ?? '') ?? BY_ID.get(ex.id) ?? BY_ID.get(DEFAULT_ICON)!;
}

/** Полный SVG-документ иконки заданного размера. */
export function iconSvg(icon: ExerciseIconInfo, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${icon.body}</svg>`;
}
