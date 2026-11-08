// Script ini berjalan di browser dan mengambil data dari API di server.js

const grid = document.getElementById('grid');
const count = document.getElementById('count');
const search = document.getElementById('search');
const genresBox = document.getElementById('genres');
const dialog = document.getElementById('detail');

const state = { q: '', genre: '', currentId: '' };

/* ---------- Sampul otomatis ----------
   Setiap film punya 3 warna (palette) dan satu pola (motif) di data/films.json.
   Dari situ dibuat gambar abstrak dengan SVG, jadi tidak perlu file gambar. */

const HEX = /^#[0-9a-f]{6}$/i;

function seedFrom(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

const motifs = {
  sun: (a, b, s) => `
    <circle cx="${70 + (s % 60)}" cy="${95 + (s % 50)}" r="54" fill="${a}"/>
    <rect y="215" width="200" height="85" fill="${b}"/>`,

  horizon: (a, b, s) => `
    <circle cx="${55 + (s % 90)}" cy="175" r="34" fill="${b}"/>
    <rect y="175" width="200" height="125" fill="${a}"/>
    <rect y="205" width="200" height="3" fill="${b}" opacity=".5"/>
    <rect y="235" width="200" height="2" fill="${b}" opacity=".35"/>`,

  wave: (a, b, s) => {
    let out = '';
    const amp = 10 + (s % 8);
    for (let i = 0; i < 9; i++) {
      const y = 70 + i * 26;
      out += `<path d="M-10 ${y} Q 15 ${y - amp} 40 ${y} T 90 ${y} T 140 ${y} T 190 ${y} T 240 ${y}"
        fill="none" stroke="${i % 3 === 1 ? b : a}" stroke-width="6" stroke-linecap="round"/>`;
    }
    return out;
  },

  stripes: (a, b, s) => {
    let out = '';
    const heights = [34, 18, 46, 12, 28, 52, 20, 38];
    let y = 0;
    heights.forEach((h, i) => {
      const height = h + ((s >> i) % 10);
      if (i % 2 === 0) out += `<rect y="${y}" width="200" height="${height}" fill="${a}"/>`;
      y += height;
    });
    return out + `<rect x="${30 + (s % 110)}" y="0" width="14" height="300" fill="${b}"/>`;
  },

  arch: (a, b, s) => {
    const x = 45 + (s % 20);
    return `
      <path d="M${x} 300 V150 A55 55 0 0 1 ${x + 110} 150 V300 Z" fill="${a}"/>
      <path d="M${x + 30} 300 V170 A25 25 0 0 1 ${x + 80} 170 V300 Z" fill="${b}"/>`;
  },

  rings: (a, b, s) => {
    const cx = 80 + (s % 40);
    let out = '';
    for (let r = 18; r < 220; r += 16) {
      out += `<circle cx="${cx}" cy="150" r="${r}" fill="none" stroke="${a}" stroke-width="2" opacity="${1 - r / 260}"/>`;
    }
    return out + `<circle cx="${cx}" cy="150" r="12" fill="${b}"/>`;
  },

  split: (a, b, s) => {
    const y = 150 + (s % 60);
    return `
      <polygon points="0,${y + 40} 200,${y - 70} 200,300 0,300" fill="${a}"/>
      <circle cx="${120 + (s % 40)}" cy="${y - 85}" r="26" fill="${b}"/>`;
  },

  grid: (a, b, s) => {
    let out = '';
    const pick = s % 40;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 5; col++) {
        const i = row * 5 + col;
        out += `<rect x="${18 + col * 34}" y="${22 + row * 34}" width="26" height="26"
          fill="${i === pick ? b : a}" opacity="${i === pick ? 1 : 0.35}"/>`;
      }
    }
    return out;
  },

  burst: (a, b, s) => {
    const cx = 70 + (s % 60);
    const cy = 120 + (s % 60);
    let out = '';
    for (let deg = 0; deg < 360; deg += 12) {
      const rad = (deg * Math.PI) / 180;
      out += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(rad) * 260}" y2="${cy + Math.sin(rad) * 260}"
        stroke="${deg % 36 === 0 ? b : a}" stroke-width="3"/>`;
    }
    return out + `<circle cx="${cx}" cy="${cy}" r="28" fill="${b}"/>`;
  },
};

function coverSVG(film) {
  const [bg, a, b] = (film.palette || []).map((c) => (HEX.test(c) ? c : null));
  const draw = motifs[film.motif] || motifs.sun;
  const s = seedFrom(film.id);
  return `<svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <rect width="200" height="300" fill="${bg || '#3a3f4b'}"/>
    ${draw(a || '#9aa0ae', b || '#e8e9ef', s)}
  </svg>`;
}

/* ---------- Mengambil data dari server ---------- */

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadGenres() {
  const genres = await getJSON('/api/genres');
  const all = [{ label: 'Semua', value: '' }, ...genres.map((g) => ({ label: g, value: g }))];

  for (const { label, value } of all) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.dataset.genre = value;
    btn.setAttribute('aria-pressed', String(value === state.genre));
    btn.addEventListener('click', () => {
      state.genre = value;
      for (const b of genresBox.children) {
        b.setAttribute('aria-pressed', String(b.dataset.genre === value));
      }
      loadFilms();
    });
    genresBox.append(btn);
  }
}

async function loadFilms() {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.genre) params.set('genre', state.genre);

  try {
    const data = await getJSON(`/api/films?${params}`);
    renderFilms(data);
  } catch (err) {
    grid.replaceChildren();
    count.textContent = 'Daftar film tidak bisa dimuat. Pastikan server berjalan, lalu muat ulang halaman.';
  }
}

function renderFilms({ total, count: found, films }) {
  count.textContent = found === total ? `${total} film` : `${found} dari ${total} film`;

  if (films.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    const msg = document.createElement('p');
    msg.textContent = 'Tidak ada film yang cocok. Coba kata lain atau tampilkan semua genre.';
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = 'Tampilkan semua film';
    reset.addEventListener('click', resetFilters);
    li.append(msg, reset);
    grid.replaceChildren(li);
    return;
  }

  grid.replaceChildren(
    ...films.map((film) => {
      const li = document.createElement('li');
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card';

      const cover = document.createElement('span');
      cover.className = 'cover';
      cover.innerHTML = coverSVG(film);

      const title = document.createElement('span');
      title.className = 'card-title';
      title.textContent = film.title;

      const meta = document.createElement('span');
      meta.className = 'card-meta';
      meta.textContent = `${film.year}, ${film.director}`;

      card.append(cover, title, meta);
      card.addEventListener('click', () => openFilm(film));
      li.append(card);
      return li;
    })
  );
}

function resetFilters() {
  state.q = '';
  state.genre = '';
  search.value = '';
  for (const b of genresBox.children) {
    b.setAttribute('aria-pressed', String(b.dataset.genre === ''));
  }
  loadFilms();
}

/* ---------- Detail film ---------- */

function openFilm(film) {
  state.currentId = film.id;
  document.getElementById('detail-cover').innerHTML = coverSVG(film);
  document.getElementById('detail-title').textContent = film.title;
  document.getElementById('detail-original').textContent = film.originalTitle || '';
  document.getElementById('detail-synopsis').textContent = film.synopsis;
  document.getElementById('detail-director').textContent = film.director;
  document.getElementById('detail-year').textContent = film.year;
  document.getElementById('detail-country').textContent = film.country;
  document.getElementById('detail-genres').replaceChildren(
    ...film.genres.map((g) => {
      const li = document.createElement('li');
      li.textContent = g;
      return li;
    })
  );
  if (!dialog.open) dialog.showModal();
}

async function openRandom() {
  try {
    const film = await getJSON(`/api/films/random?exclude=${encodeURIComponent(state.currentId)}`);
    if (film) openFilm(film);
  } catch (err) {
    count.textContent = 'Gagal memilih film acak. Coba lagi sebentar.';
  }
}

document.getElementById('random').addEventListener('click', openRandom);
document.getElementById('another').addEventListener('click', openRandom);
document.getElementById('close').addEventListener('click', () => dialog.close());

// Klik di luar kotak detail untuk menutup
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
});

// Pencarian dengan jeda singkat supaya server tidak dipanggil di setiap ketikan
let timer;
search.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    state.q = search.value.trim();
    loadFilms();
  }, 250);
});

loadGenres().catch(() => {});
loadFilms();
