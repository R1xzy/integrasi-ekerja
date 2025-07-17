# Folder `(auth)`

Route group khusus halaman autentikasi publik. Folder ini **tidak memengaruhi URL** karena dibungkus tanda kurung sesuai konvensi Next.js App Router.

| Sub‐folder | URL hasil | Deskripsi |
|------------|-----------|-----------|
| `login/`   | `/login`  | Form masuk & peralihan role-based |
| `register/`| `/register`| Form pendaftaran akun |

Fitur:
* Halaman bersifat publik; middleware mengalihkan jika user sudah login.
* Komponen sederhana tanpa Navbar dashboard.

Tambahkan halaman auth baru di sini untuk menjaga struktur rapi.
