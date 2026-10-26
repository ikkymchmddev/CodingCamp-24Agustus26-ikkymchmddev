# 🚀 LifeDash — To-Do List & Life Dashboard

> Mini Project **RevoU Coding Camp (Batch 24 Agustus 2026)** oleh **ikkymchmddev**.

**LifeDash** adalah dashboard produktivitas web modern, estetik, responsif, dan kaya fitur yang dibangun murni menggunakan **HTML5, CSS3, dan Vanilla JavaScript (ES6+)**. Seluruh data pengguna tersimpan secara otomatis secara client-side menggunakan Browser `localStorage` API.

🌐 **Demo Live Website:** https://ikkymchmddev.github.io/CodingCamp-24Agustus26-ikkymchmddev/

---

## ✨ Fitur Utama

1. **Header & Dynamic Greeting (Custom Name)**
   - Jam digital *real-time* (HH:MM:SS) & tanggal Bahasa Indonesia (`Hari, DD Bulan YYYY`).
   - Sapaan otomatis yang menyesuaikan waktu (Pagi, Siang, Sore, Malam).
   - Pengguna dapat mengubah nama panggilan yang otomatis tersimpan di `localStorage`.

2. **Focus Timer / Pomodoro (Custom Duration & Audio Alert)**
   - Hitung mundur dengan visual **SVG Circular Progress Ring**.
   - Kontrol Mulai/Jeda (*Start/Pause*), Hentikan (*Stop*), dan *Reset*.
   - Preset durasi fokus (15m, 25m, 50m) dan input kustom durasi (1-180 menit).
   - Efek notifikasi visual & nada *chime* sintetis **Web Audio API** saat timer selesai.

3. **Interactive To-Do List (Prevent Duplicate & Sorting)**
   - Validasi tambah tugas: cegah input kosong & **cegah duplikasi nama tugas** (*case-insensitive*).
   - Tandai selesai (*strikethrough*), indikator persentase *progress bar*, & konter tugas tersisa.
   - Fitur *Pencarian Live Search*, *Filter Status* (Semua, Aktif, Selesai), dan *Sorting* (Terbaru, Terlama, Abjad A-Z, Abjad Z-A).
   - Edit nama tugas secara *inline* (double-click / tombol edit) & hapus tugas.

4. **Quick Links / Bookmark Favorit**
   - Kartu pintasan link website favorit dengan avatar inisial otomatis.
   - Tambah & hapus pintasan favorit.

5. **Theme Switcher (Dark / Light Mode)**
   - Mode Gelap (*Midnight Glassmorphic*) dan Mode Terang (*Soft Slate*) dengan transisi halus.
   - Pilihan tema tersimpan di `localStorage`.

---

## 🛠️ Tech Stack

- **HTML5**: Struktur semantik & modal dialog.
- **CSS3**: Variable desain system, glassmorphic UI, CSS Grid/Flexbox, & animasi transisi.
- **Vanilla JavaScript (ES6+)**: DOM Manipulation, Event Listeners, State Management, Web Audio API, & `localStorage` API.
- **Tanpa Framework / Library External** (Pure Native Web Stack).

---

## 📂 Struktur Direktori

```text
c:\revou\CodingCamp-24Agustus26-RizqiMuchamadAnafisTontowi\
├── index.html        # Struktur antarmuka dashboard utama
├── css/
│   └── style.css     # Unified stylesheet (Design system & Dark/Light mode)
├── js/
│   └── app.js        # Logika Vanilla JS, state, & localStorage
└── README.md         # Dokumentasi proyek
