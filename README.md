# Layar Tancap

Katalog film sederhana dengan Node.js (Express): pencarian, filter genre, pilih film acak, dan halaman detail. Sampul film dibuat otomatis dengan SVG dari warna setiap film, jadi tidak perlu file gambar.

## Isi folder

```
layar-tancap/
├── package.json
├── server.js          # server Express dan daftar API
├── lib/films.js       # logika pencarian, filter, dan film acak
├── data/films.json    # data film (edit di sini)
└── public/            # tampilan untuk browser
    ├── index.html
    ├── style.css
    └── app.js
```

## API

| Endpoint | Fungsi |
| --- | --- |
| `GET /api/films` | Semua film |
| `GET /api/films?q=nolan&genre=Drama` | Cari dan filter |
| `GET /api/films/random` | Satu film acak |
| `GET /api/films/parasite` | Detail satu film berdasarkan `id` |
| `GET /api/genres` | Daftar genre |

## Menambah film

Tambahkan objek baru di `data/films.json`:

```json
{
  "id": "laskar-pelangi",
  "title": "Laskar Pelangi",
  "originalTitle": null,
  "year": 2008,
  "director": "Riri Riza",
  "country": "Indonesia",
  "genres": ["Drama"],
  "synopsis": "Tulis sinopsis singkat di sini.",
  "palette": ["#1d4e89", "#f2c14e", "#e86a33"],
  "motif": "sun"
}
```

- `id` harus unik, huruf kecil, tanpa spasi.
- `palette` berisi 3 warna hex: latar, warna utama, warna aksen.
- `motif` bisa diisi: `sun`, `horizon`, `wave`, `stripes`, `arch`, `rings`, `split`, `grid`, `burst`.

## Coba di komputer sendiri (opsional)

```bash
npm install
npm start
```

Buka http://localhost:3000

## Upload ke Hostinger

1. Di hPanel, buka **Websites → Add Website → Node.js web app → Upload your files**.
2. Upload `layar-tancap.zip`.
3. Pengaturan: framework **Express**, Node.js **22**, build command dan output directory **dikosongkan**, entry file **`server.js`**.
4. Klik **Deploy**.

Setelah mengubah file, buat zip baru dari dalam folder proyek lalu upload ulang dan redeploy:

```bash
zip -r layar-tancap.zip . --exclude "node_modules/*" --exclude ".git/*"
```

Kalau website tidak bisa dibuka setelah deploy, cek **Runtime Logs** di dashboard aplikasi.
