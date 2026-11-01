import type { ProgramId } from '../types';
import { PROGRAM_IDS, PROGRAM_INFO } from '../data/programs';

/** Переключатель программ «С гантелями | Свой вес». */
export function ProgramSwitch({ value, onChange }: { value: ProgramId; onChange: (p: ProgramId) => void }) {
  return (
    <div class="seg program-switch">
      {PROGRAM_IDS.map((p) => (
        <button class={(p === value ? 'on ' : '') + 'prog-' + p} onClick={() => onChange(p)}>
          {PROGRAM_INFO[p].name}
        </button>
      ))}
    </div>
  );
}
