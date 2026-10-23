import { useEffect, useState } from 'preact/hooks';

/** Отдых между подходами одного упражнения, с */
export const SET_REST_SEC = 20;

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

// ---------- Таймер подхода для упражнений на время ----------

/** Отсчёт перед стартом подхода, с — успеть встать в позицию */
export const SET_PREP_SEC = 3;

interface SetTimerState {
  /** время старта самого подхода (после отсчёта «3-2-1») */
  startsAt: number;
  endsAt: number;
  total: number;
  label: string;
  /** вызывается с фактическими секундами по окончании или по «Стоп» */
  onFinish: (sec: number) => void;
  buzzed: boolean;
}

let setState: SetTimerState | null = null;
let setTick: number | undefined;

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

function endSet(sec: number | null) {
  const s = setState;
  setState = null;
  clearInterval(setTick);
  setTick = undefined;
  emit();
  if (s && sec != null) s.onFinish(sec);
}

function setLoop() {
  const s = setState;
  if (!s) return;
  const now = Date.now();
  if (!s.buzzed && now >= s.startsAt) {
    s.buzzed = true;
    vibrate(200);
  }
  if (now >= s.endsAt) {
    vibrate([400, 150, 400, 150, 400]);
    endSet(s.total);
    return;
  }
  emit();
}

/** Начать подход на время: «3-2-1», затем обратный отсчёт seconds. Отдых на это время сбрасывается. */
export function startSet(seconds: number, label: string, onFinish: (sec: number) => void) {
  if (seconds <= 0) return;
  stopRest();
  const startsAt = Date.now() + SET_PREP_SEC * 1000;
  setState = { startsAt, endsAt: startsAt + seconds * 1000, total: seconds, label, onFinish, buzzed: false };
  clearInterval(setTick);
  setTick = window.setInterval(setLoop, 200);
  emit();
}

/** «Стоп»: во время отсчёта «3-2-1» — отмена, во время подхода — фактические секунды. */
export function stopSet() {
  const s = setState;
  if (!s) return;
  const now = Date.now();
  endSet(now < s.startsAt ? null : Math.max(1, Math.round((now - s.startsAt) / 1000)));
}

export function useSetTimer() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const s = setState;
  if (!s) return { running: false, prep: false, left: 0, total: 0, label: '' };
  const now = Date.now();
  const prep = now < s.startsAt;
  const left = prep ? Math.ceil((s.startsAt - now) / 1000) : Math.max(0, Math.ceil((s.endsAt - now) / 1000));
  return { running: true, prep, left, total: s.total, label: s.label };
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
