# PANDUAN DEPLOY — Le Minerale Dashboard Online
## Agar bisa diakses semua orang dari device mana saja

---

## OPSI TERBAIK: Netlify (GRATIS, Paling Mudah)

### Langkah Deploy ke Netlify:

1. Buka browser → pergi ke https://netlify.com
2. Klik **"Sign up"** → pilih **"Sign up with Email"**
3. Daftar dengan email Anda → verifikasi email
4. Setelah login, di halaman utama ada kotak besar bertuliskan:
   **"Drag and drop your site folder here"**
5. Buka File Explorer → cari folder **`lm-dashboard`**
6. **Drag folder `lm-dashboard`** langsung ke kotak Netlify tersebut
7. Tunggu beberapa detik → dapat URL seperti:
   `https://amazing-name-123456.netlify.app`
8. **Selesai!** Dashboard bisa diakses siapa saja dari URL tersebut

---

## Ganti URL Menjadi Lebih Mudah Diingat:

Di Netlify → Site Settings → Site Information → Change site name
Contoh: `leminerale-cosmo` → URL jadi:
`https://leminerale-cosmo.netlify.app`

---

## Update Dashboard (Kalau Ada Perubahan File):

1. Di Netlify → pilih site Anda
2. Klik tab **"Deploys"**
3. Drag folder `lm-dashboard` lagi ke kotak deploy
4. Otomatis update dalam 30 detik

---

## PENTING Setelah Online:

Karena dashboard online menggunakan Google Sheets API,
pastikan spreadsheet TETAP di-share:
→ **"Anyone with the link → Viewer"**

---

## OPSI LAIN: GitHub Pages (Gratis)

1. Daftar di https://github.com
2. Buat repository baru → nama: `lm-dashboard`
3. Upload semua file dari folder `lm-dashboard`
4. Settings → Pages → Source: main branch → /root
5. URL: `https://username.github.io/lm-dashboard`

---

## OPSI BERBAYAR: cPanel Hosting

Jika sudah punya hosting:
1. Login cPanel → File Manager
2. Masuk folder `public_html`
3. Upload semua file dari `lm-dashboard`
4. Akses via domain Anda

---

## Setelah Online — Bagikan URL ke Tim:

Contoh pesan ke tim:
"Dashboard Le Minerale bisa diakses di:
https://leminerale-cosmo.netlify.app/login.html

Login dengan email dan passcode masing-masing."
