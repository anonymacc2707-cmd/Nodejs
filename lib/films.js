// Logika data film. Tidak bergantung pada Express, jadi mudah diuji dan dipakai ulang.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const films = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'films.json'), 'utf8')
);

// Supaya pencarian "amelie" tetap menemukan "Amélie"
const normalize = (text) =>
  String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export function listFilms({ q = '', genre = '' } = {}) {
  const query = normalize(q);
  const wantedGenre = normalize(genre);

  return films.filter((film) => {
    const matchesGenre =
      !wantedGenre || film.genres.some((g) => normalize(g) === wantedGenre);
    const haystack = normalize(
      [film.title, film.originalTitle, film.director, film.country, film.year].join(' ')
    );
    const matchesQuery = !query || haystack.includes(query);
    return matchesGenre && matchesQuery;
  });
}

export function getFilm(id) {
  return films.find((film) => film.id === id) || null;
}

export function randomFilm(excludeId = '') {
  const pool = films.filter((film) => film.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)] || null;
}

export function allGenres() {
  const set = new Set(films.flatMap((film) => film.genres));
  return [...set].sort((a, b) => a.localeCompare(b, 'id'));
}

export const totalFilms = films.length;
