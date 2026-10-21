import { useEffect, useState } from 'preact/hooks';

interface TimerState {
  endsAt: number | null;
  total: number;
  label: string;
}

let state: TimerState = { endsAt: null, total: 0, label: '' };
const listeners = new Set<() => void>();
let tick: number | undefined;

function emit() {
  listeners.forEach((l) => l());
}

function loop() {
  if (state.endsAt && Date.now() >= state.endsAt) {
    state = { ...state, endsAt: null };
    try {
      navigator.vibrate?.([400, 150, 400, 150, 400]);
    } catch {
      /* ignore */
    }
    clearInterval(tick);
    tick = undefined;
  }
  emit();
}

export function startRest(seconds: number, label: string) {
  if (seconds <= 0) return;
  state = { endsAt: Date.now() + seconds * 1000, total: seconds, label };
  if (!tick) tick = window.setInterval(loop, 250);
  emit();
}

export function addRest(seconds: number) {
  if (!state.endsAt) return;
  state = { ...state, endsAt: state.endsAt + seconds * 1000, total: state.total + seconds };
  emit();
}

export function stopRest() {
  state = { endsAt: null, total: 0, label: '' };
  clearInterval(tick);
  tick = undefined;
  emit();
}

export function useRestTimer() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const left = state.endsAt ? Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000)) : 0;
  return { running: !!state.endsAt, left, total: state.total, label: state.label };
}
