# SportSphere Hub

Veb sistem za rezervaciju terena i hala, zakazivanje treninga, kupovinu opreme, pronalaženje
saigrača i promocije. Projekat iz predmeta **Programiranje internet aplikacija (IR3PIA)**.

- **Frontend:** Angular 20 (standalone komponente, signali, reactive forms, HttpClient + JWT interceptor)
- **Backend:** Node.js + Express 5 + TypeScript (REST API)
- **Baza:** MongoDB (Mongoose ODM)
- **Auth:** JWT, lozinke heširane sa `bcryptjs`

## Preduslovi

- Node.js 18+ i npm
- MongoDB pokrenut lokalno na `mongodb://localhost:27017`

## Struktura

```
backend/        Express + TypeScript REST API (port 4000)
  src/          izvorni kod (config, models, middleware, controllers, routes, utils)
  seed/seed.js  skripta za kreiranje i popunjavanje baze
  uploads/      otpremljeni fajlovi + podrazumevane slike
frontend/       Angular 20 SPA (port 4200)
```

## 1. Instalacija zavisnosti

```bash
cd backend  && npm install
cd ../frontend && npm install
```

## 2. Konfiguracija (env)

U `backend/` napravite `.env` (već postoji primer `.env.example`):

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/sportsphere_hub
JWT_SECRET=neka_tajna
JWT_EXPIRES=2h
CLIENT_URL=http://localhost:4200
RESET_URL_BASE=http://localhost:4200/reset-password
```

## 3. Kreiranje i popunjavanje baze (seed)

> ⚠️ **Pažnja:** seed skripta **briše** postojeću bazu `sportsphere_hub` i kreira je iznova
> (kolekcije + indeksi + demo podaci). Pokreće se **nezavisno od aplikacije** — sama aplikacija
> nikada ne kreira kolekcije (Mongoose `autoCreate`/`autoIndex` su isključeni).

```bash
cd backend
npm run seed
```

Seed ubacuje dovoljno podataka za demonstraciju svih funkcionalnosti: administratora, sportiste i
zaposlene (odobrene i na čekanju), objekte (odobrene i na čekanju), terene/hale/dvorane, rezervacije
u svim statusima, treninge i trenere, promocije, opremu, porudžbine, oglase za saigrače, ocene, u
više gradova i sportova.

## 4. Pokretanje

**Backend** (kompajliranje pa pokretanje):

```bash
cd backend
npm run build      # tsc -> dist/
npm run serve      # pokreće dist/server.js na portu 4000
# ili tokom razvoja, sa automatskim restartom:
npm run dev
```

**Frontend:**

```bash
cd frontend
npm start          # ng serve -> http://localhost:4200
```

Otvorite `http://localhost:4200`.

## Demo nalozi

| Uloga         | Korisničko ime | Lozinka     | Napomena                                  |
|---------------|----------------|-------------|-------------------------------------------|
| Administrator | `admin`        | `Admin123!` | prijava na skrivenoj ruti `/sys-admin-2f9` |
| Sportista     | `marko`        | `Lozinka1!` | (još: `jovana`, `nikola`, `ana`)          |
| Zaposleni     | `milan`        | `Lozinka1!` | (još: `dragan`, `sara`)                   |

> Administrator se prijavljuje isključivo preko skrivene rute **`/sys-admin-2f9`** (nije dostupna
> sa početne strane ni iz menija). Sportisti i zaposleni preko javne forme `/login`.

## Pravila (validacija na serveru)

- **Lozinka:** 8–12 karaktera, mora počinjati slovom, sadržati veliko slovo, broj i specijalni karakter.
- **Matični broj:** tačno 8 cifara (jedinstven). **PIB:** tačno 9 cifara, ne počinje nulom (jedinstven).
- **Najviše 2 zaposlena** po objektu; **najviše 5 sportova** po korisniku.
- **Rezervacija:** najmanje 1 sat, počinje na pun sat, bez preklapanja, u okviru radnog vremena.
- **Otkazivanje** rezervacije moguće samo ≥ 12 sati pre termina.
- **Potvrdi/Odjavi** (zaposleni) samo do 10 minuta po početku termina; posle definisanog broja
  nedolazaka korisnik gubi pravo rezervacije u objektu.
- **Ocena objekta** samo uz potvrđenu rezervaciju; broj ocena ≤ broj potvrđenih rezervacija.
- Novi objekat je vidljiv tek nakon **odobrenja administratora**.

## Tehnologije po funkcionalnostima

- Profilna slika: otpremanje fajla ili **generisanje avatara (DiceBear)** koji se konvertuje u PNG.
- Mapa lokacije: **Leaflet + OpenStreetMap**. Dijagrami statistike: **Chart.js**.
- Kalendar zaposlenog: **Angular CDK drag-and-drop** (premeštanje termina u zatvorenim halama/dvoranama).
- Zaboravljena lozinka: token sa rokom od 30 min; link se ispisuje u konzoli servera i (opciono)
  šalje preko Nodemailer Ethereal test naloga.
- PDF izveštaji (popunjenost terena, promet opreme): **pdfkit**.

## Napomene

- `npm run build` se mora pokrenuti pre `npm run serve` posle izmena u `backend/src` (osim ako se
  koristi `npm run dev`).
- Aplikaciju testirati u najmanje 3 standardna pregledača.
