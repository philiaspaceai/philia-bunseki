
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

## 🛠️ Tumpukan Teknologi

- **Frontend**: React, TypeScript, Tailwind CSS
- **Diagram**: Recharts
- **Database**: Supabase (PostgreSQL)
- **PWA**: Service Worker API

## ⚙️ Cara Kerja

1.  **Unggah**: Pengguna mengunggah satu atau lebih file subtitle `.srt`.
2.  **Parsing**: Aplikasi membaca file dan mengekstrak teks Jepang murni, menghapus penanda waktu dan tag HTML.
3.  **Tokenisasi**: _Tokenizer_ sederhana di sisi klien memecah teks menjadi kata-kata individual.
4.  **Query Data**: Aplikasi mengirim kueri kata-kata unik ke database Supabase (dalam _chunk_ untuk efisiensi) untuk mencocokkannya dengan data JLPT dan frekuensi BCCWJ.
5.  **Analisis & Penilaian**: Algoritma pembobotan menganalisis distribusi kosakata dan menghitung prediksi level JLPT.
6.  **Visualisasi**: Hasilnya disajikan kepada pengguna melalui statistik, diagram, dan daftar kata yang mudah dipahami.

## 🚀 Menjalankan Secara Lokal

Proyek ini menggunakan `importmap` untuk manajemen dependensi di sisi klien, jadi tidak ada langkah build yang diperlukan untuk menjalankannya.

1.  **Clone Repositori**
    ```bash
    git clone https://github.com/username/philia-bunseki.git
    cd philia-bunseki
    ```

2.  **Jalankan Server Lokal**
    Anda dapat menggunakan server web statis apa pun. Salah satu cara termudah adalah dengan menggunakan ekstensi **Live Server** di Visual Studio Code.

    Atau, jika Anda memiliki Python terinstal:
    ```bash
    python -m http.server
    ```
    Buka `http://localhost:8000` di browser Anda.

3.  **Kredensial Supabase**
    Kredensial Supabase yang ada di dalam kode (`/lib/supabaseClient.ts`) adalah kunci `anon` publik yang hanya memungkinkan operasi baca. Untuk lingkungan produksi, disarankan untuk mengatur kebijakan RLS (Row Level Security) yang lebih ketat di Supabase.

## ⚠️ Catatan Penting tentang Tokenisasi

Akurasi analisis sangat bergantung pada kualitas tokenisasi (pemisahan kalimat menjadi kata-kata). Implementasi saat ini menggunakan metode Regex sederhana di sisi klien.

Untuk hasil yang jauh lebih akurat, disarankan untuk menggunakan _tokenizer_ yang lebih canggih seperti **SudachiJS**. Karena SudachiJS membutuhkan lingkungan Node.js, implementasi yang ideal adalah dengan mendeploy aplikasi ini di platform seperti Vercel dan memindahkan logika analisis ke dalam **Next.js API Route**.

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT.
