
# 🏪 TokoKita - UMKM Financial & Inventory Tracker

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![Offline](https://img.shields.io/badge/Offline-100%25-success?style=for-the-badge)

**TokoKita** adalah sebuah *Progressive Web Application* (PWA) yang dirancang khusus sebagai sistem manajemen keuangan dan inventori luring (*offline*) untuk Usaha Mikro, Kecil, dan Menengah (UMKM). Sistem ini membantu pelaku usaha untuk mencatat pemasukan dan pengeluaran, memantau perputaran modal, dan menghitung *Break-Even Point* (BEP) secara otomatis tanpa memerlukan koneksi internet maupun konfigurasi *database* yang rumit.

Proyek ini dikembangkan untuk memenuhi tugas akhir (*AOL*) mata kuliah **Software Engineering** oleh Kelompok 7.

---

## ✨ Fitur Utama (Key Features)

*   📱 **Fully Offline & PWA Ready:** Berkat implementasi *Service Worker* (`sw.js`) dan `manifest.json`, aplikasi ini dapat diinstal di beranda HP/Laptop dan beroperasi 100% tanpa internet.
*   ⚡ **Quick Ledger Entry:** Pencatatan transaksi super cepat dengan kalkulasi total otomatis (*Auto-Calculation*) untuk meminimalisasi *human error* (salah hitung) oleh kasir.
*   📦 **Smart Inventory Matrix:** Tabel inventori pintar yang tidak hanya menampilkan stok, tetapi juga menghitung persentase margin keuntungan dari *COGS* (Harga Modal) vs *Selling Price* (Harga Jual).
*   🚨 **Low Stock Warning:** Fitur *Guardrail* dan lencana notifikasi otomatis jika barang mencapai batas minimum stok atau habis terjual.
*   📊 **Dynamic Financial Dashboard:** Kalkulasi instan (*real-time*) untuk Pendapatan Hari Ini (*Today's Revenue*), Valuasi Modal Aktif, dan persentase pencapaian Target BEP bulanan.
*   📑 **Direct Excel Export:** Ekspor laporan riwayat transaksi dan data fiskal langsung ke dalam format `.xlsx` (Excel) tanpa memerlukan *backend server* (didukung oleh *library* SheetJS).

---

## 📂 Struktur File & Arsitektur

Aplikasi ini dibangun murni di sisi klien (*Client-Side*) tanpa *framework* berat.

```text
📦 UMKM-Ledger
 ┣ 📜 index.html         # Kerangka utama UI (Dashboard, Transactions, Inventory)
 ┣ 📜 styles.css         # Desain antarmuka responsif dengan CSS Grid & Variables
 ┣ 📜 app.js             # Logika utama aplikasi (CRUD, Kalkulasi, LocalStorage)
 ┣ 📜 sw.js              # Service Worker untuk kapabilitas caching & offline PWA
 ┣ 📜 manifest.json      # Konfigurasi PWA (ikon, nama aplikasi, tema tampilan)
 ┣ 📜 figma_initial_prototype.fig # File rancangan desain awal UI/UX
 ┗ 📜 README.md          # Dokumentasi proyek
