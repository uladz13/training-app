# Тренировки — PWA для учёта утренних тренировок

Работает офлайн, данные хранятся только на телефоне (IndexedDB). Бэкап — JSON-файл (экран «Ещё»).

## Публикация

Каждый push в ветку `main` автоматически собирается GitHub Actions и публикуется на
`https://<логин>.github.io/training-app/` (Settings → Pages → Source: GitHub Actions).

## Локальная разработка

```
npm install
npm run dev
```

## Структура

- `src/data/exercises.ts` — каталог упражнений и описания техники
- `src/data/program.ts` — недельная программа
- `src/data/seed.ts` — стартовая история (12–21.10.2026)
- `src/weights.ts` — доступные веса из набора блинов
- `src/screens/` — экраны «Сегодня», «Тренировка», «История», «Ещё»
