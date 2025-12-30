
# Philia Bunseki 🔬

**Philia Bunseki** adalah Progressive Web App (PWA) yang dirancang untuk memprediksi tingkat kesulitan bahasa Jepang dari sebuah anime dengan menganalisis file subtitle `.srt`-nya.

Aplikasi ini memberikan wawasan mendalam tentang kosakata yang digunakan, membandingkannya dengan daftar kosakata JLPT (Japanese-Language Proficiency Test) dan data frekuensi kata dari Korpus Bahasa Jepang Tulis Kontemporer (BCCWJ).

 <!-- Ganti dengan URL screenshot Anda nanti -->

## ✨ Fitur Utama

- **Analisis Subtitle**: Unggah satu atau beberapa file `.srt` untuk dianalisis sekaligus.
- **Prediksi Level JLPT**: Memprediksi level JLPT yang sesuai (N5 hingga N1) berdasarkan kosakata yang ditemukan.
- **Distribusi Kosakata**: Visualisasikan distribusi kata-kata di setiap level JLPT menggunakan diagram lingkaran interaktif.
- **Wawasan Frekuensi Kata**: Hitung peringkat frekuensi rata-rata kata untuk memahami seberapa umum kosakata yang digunakan.
- **Daftar Kata Interaktif**: Jelajahi kata-kata spesifik yang ditemukan untuk setiap level JLPT.
- **Offline-First**: Sebagai PWA, aplikasi ini dapat diinstal di perangkat Anda dan berfungsi bahkan tanpa koneksi internet setelah aset awal di-cache.
- **Integrasi Database**: Menggunakan Supabase untuk mengambil data kamus JLPT dan frekuensi kata secara efisien.
- **Tokenisasi Akurat**: Menggunakan tokenizer morfologi canggih **SudachiJS** di sisi server untuk pemisahan kata yang akurat.

## 🛠️ Tumpukan Teknologi

- **Frontend**: React, TypeScript, Tailwind CSS
- **Diagram**: Recharts
- **Backend**: Vercel Serverless Function (Node.js)
- **Tokenization**: SudachiJS
- **Database**: Supabase (PostgreSQL)
- **PWA**: Service Worker API

## ⚙️ Cara Kerja

1.  **Unggah**: Pengguna mengunggah satu atau lebih file subtitle `.srt`.
2.  **Parsing**: Aplikasi membaca file dan mengekstrak teks Jepang murni di sisi klien, menghapus penanda waktu dan tag HTML.
3.  **Kirim ke Server**: Teks bersih dikirim ke Vercel Serverless Function.
4.  **Tokenisasi**: Di server, **SudachiJS** memecah teks menjadi kata-kata (token) secara akurat dan mengubahnya ke bentuk kamus.
5.  **Query Data**: Fungsi server mengirim kueri kata-kata unik ke database Supabase (dalam _chunk_ untuk efisiensi) untuk mencocokkannya dengan data JLPT dan frekuensi BCCWJ.
6.  **Analisis & Penilaian**: Algoritma pembobotan menganalisis distribusi kosakata dan menghitung prediksi level JLPT.
7.  **Visualisasi**: Hasilnya dikirim kembali ke klien dan disajikan kepada pengguna melalui statistik, diagram, dan daftar kata yang mudah dipahami.

## 🚀 Menjalankan Secara Lokal

Proyek ini menggunakan `importmap` untuk manajemen dependensi di sisi klien dan Vercel CLI untuk menjalankan fungsi serverless secara lokal.

1.  **Clone Repositori**
    ```bash
    git clone https://github.com/username/philia-bunseki.git
    cd philia-bunseki
    ```

2.  **Instal Vercel CLI**
    ```bash
    npm install -g vercel
    ```

3.  **Jalankan Server Pengembangan Vercel**
    ```bash
    vercel dev
    ```
    Perintah ini akan menjalankan server frontend dan fungsi serverless di `api/` secara bersamaan. Buka `http://localhost:3000` di browser Anda.

4.  **Kredensial Supabase**
    Kredensial Supabase yang ada di dalam kode (`/lib/supabaseClient.ts` dan `api/analyze.ts`) adalah kunci `anon` publik yang hanya memungkinkan operasi baca. Untuk lingkungan produksi, disarankan untuk mengatur kebijakan RLS (Row Level Security) yang lebih ketat di Supabase.

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT.