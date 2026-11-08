import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listFilms, getFilm, randomFilm, allGenres, totalFilms } from './lib/films.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Hostinger memberi port lewat process.env.PORT. Jangan diganti angka tetap.
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Daftar film, bisa difilter: /api/films?q=nolan&genre=Drama
app.get('/api/films', (req, res) => {
  const results = listFilms({ q: req.query.q, genre: req.query.genre });
  res.json({ total: totalFilms, count: results.length, films: results });
});

// Satu film acak (harus ditulis sebelum /api/films/:id)
app.get('/api/films/random', (req, res) => {
  res.json(randomFilm(String(req.query.exclude || '')));
});

// Detail satu film: /api/films/parasite
app.get('/api/films/:id', (req, res) => {
  const film = getFilm(req.params.id);
  if (!film) return res.status(404).json({ error: 'Film tidak ditemukan' });
  res.json(film);
});

// Semua genre yang ada di data
app.get('/api/genres', (req, res) => {
  res.json(allGenres());
});

app.use((req, res) => {
  res.status(404).send('Halaman tidak ditemukan');
});

app.listen(port, () => {
  console.log(`Layar Tancap berjalan di port ${port}`);
});
