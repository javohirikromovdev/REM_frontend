# REM — frontend

React + TypeScript + Vite frontend for the REM (Real Estate Marketplace) NestJS backend.

Stack: React Router, Tailwind CSS v4, TanStack Query, i18next / react-i18next, lucide-react icons, Inter font (Latin + Cyrillic, including Ў Қ Ғ Ҳ).

## O‘rnatish va ishga tushirish

```bash
cd frontend
npm install
cp .env.example .env      # kerak bo'lsa API manzilini o'zgartiring
npm run dev               # http://localhost:5173
```

Boshqa buyruqlar:

```bash
npm run typecheck   # TypeScript tekshiruvi
npm run build       # production build (dist/)
npm run preview     # buildni lokal ko'rish
```

Backend alohida ishga tushiriladi (loyiha ildizida `npm run start`), u `http://localhost:3000` da ishlashi kerak.

## API URL

`VITE_API_BASE_URL` — backend manzili (default `http://localhost:3000`). Endpointlarga `/api` prefiksi qo‘shilmaydi (`/api` — Swagger sahifasi).
Rasmlar `/uploads/...` yo‘li shu manzilga ulanib ochiladi. Barcha so‘rovlar `src/lib/api.ts` dagi yagona client orqali o‘tadi.

## Mavzu (light / dark)

- Navbar’dagi tanlov: **Tizim / Oq / Qora**, `localStorage` (`rem-theme`) da saqlanadi, boshlang‘ich (asosiy) holat — **Qora**.
- Ranglar `src/index.css` dagi CSS tokenlari (`--bg`, `--surface`, `--accent`, ...) orqali boshqariladi, `html[data-theme]` atributi almashadi.
- `index.html` dagi kichik skript React’dan oldin mavzuni qo‘llaydi — refreshda noto‘g‘ri fon chaqnamaydi.

## Tillar

| Kod | Til |
| --- | --- |
| `uz-Latn` (default) | O‘zbekcha |
| `uz-Cyrl` | Ўзбекча |
| `ru` | Русский |
| `en` | English |

Tarjimalar `src/i18n/locales/*.ts` da. Tanlov `localStorage` (`rem-locale`) da saqlanadi, `<html lang>` yangilanadi.
Backend ma’lumotlari (sarlavha, tavsif, manzil, ism) tarjima qilinmaydi. Kategoriya nomlari ma’lum sluglar (`kvartira`, `uy`, `ofis`, `yer`) bo‘yicha tarjima qilinadi, qolganlari backenddagi asl nom bilan chiqadi.

## Tuzilma

```
src/
  lib/        api client, typelar, formatlash, returnTo/intent, xatolar
  i18n/       i18next sozlamasi va 4 ta tarjima fayli
  context/    Auth, Theme, Toast
  hooks/      TanStack Query hooklari
  components/ Navbar, Layout, Dropdown, Modal/Drawer, PropertyCard, Pagination, ui
  pages/      Bosh sahifa, katalog, tafsilot, auth, kabinet, admin, 403/404
```

## Auth oqimi

- Mehmon katalog, filtr, sort, sahifalash va tafsilotni erkin ko‘radi.
- “Sotib olishga / Ijaraga olishga qiziqaman”, yurakcha, Saqlanganlar, Kabinet yoki E’lon berish bosilsa — registratsiya sahifasi ochiladi; `propertyId`, `action` va ichki `returnTo` saqlanadi.
- Registratsiyadan keyin (backend token bermaydi) login sahifasiga o‘tiladi; logindan keyin aynan o‘sha e’longa qaytib, murojaat formasi ochiladi. Xabar faqat foydalanuvchi “Yuborish”ni bosganda yuboriladi.
- Token `sessionStorage` da, refreshda `GET /auth/me` bilan tekshiriladi. Parol hech qayerga saqlanmaydi.
- Xarid/to‘lov endpointi yo‘q — qiziqish mavjud inquiry (murojaat) funksiyasiga olib boradi.

## Rasmlar

Hero fonidagi dekorativ rasmlar Unsplash’dan yuklanadi (internet bo‘lmasa gradient fon qoladi). E’lon rasmlari faqat backenddan keladi; rasm bo‘lmasa fallback ko‘rsatiladi.
