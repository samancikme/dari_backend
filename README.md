# 💊 VITO CUBE — IoT Medical Dispenser Backend API

Aqlli tibbiy dori tarqatgich qurilmasi (**ESP32 IoT Pill Dispenser**) va shifoxona xodimlari (hamshiralar/shifokorlar) uchun Node.js / Express asosidagi RESTful Backend API serveri.

---

## 🌟 Asosiy Imkoniyatlar (Features)

* **14 ta dori bo'lmasi (Slots Management)**: Har bir bemor/qurilma uchun 14 tagacha dori sloti, dori nomi, vaqti, dozasi va holati (`empty`, `scheduled`, `dispensed`).
* **Ikki tomonlama nomlash muvofiqligi (Dual Compatibility)**: ESP32 (C/C++) va Frontend (JS) uchun bir vaqtning o'zida `snake_case` (`med_name`, `slot_number`) va `camelCase` (`medName`, `slotId`) qo'llab-quvvatlanadi.
* **Resilient In-Memory Fallback**: Agar MongoDB mavjud bo'lmasa yoki uzilib qolsa, backend to'xtab qolmaydi, balki yuqori tezlikdagi xotira (RAM) rejimida uzluksiz ishlayveradi.
* **IoT Telemetriya & Rate Limiting**: ESP32 qurilmalaridan harorat va holat telemetriyalarini qabul qilish hamda DDoS/spamdan himoyalovchi rate-limiter.
* **Autentifikatsiya (JWT & Bcrypt)**: Hamshiralar uchun xavfsiz tizimga kirish (Login/Register) va sessiyani boshqarish.
* **Bemorlar va Dori tarqatish loglari**: Har bir tarqatilgan dori vaqti va mas'ul hamshira qayd etiladigan audit jurnali.

---

## 🛠 Texnologiyalar (Tech Stack)

* **Runtime & Framework**: Node.js, Express.js
* **Ma'lumotlar bazasi**: MongoDB, Mongoose ODM
* **Xavfsizlik**: JSON Web Token (JWT), BcryptJS, CORS, Express-Rate-Limit
* **Testlar**: Jest, Supertest, MongoDB-Memory-Server

---

## 📡 API Endpointlari (API Reference)

### 1. Tizim va Monitoring
| Metod | URL | Tavsif |
| :--- | :--- | :--- |
| `GET` | `/` | API xush kelibsiz sahifasi va barcha endpointlar ro'yxati |
| `GET` | `/health` | Server va ma'lumotlar bazasi holati (Healthcheck) |

### 2. Autentifikatsiya (`/api/auth`)
| Metod | URL | Body / Headers | Tavsif |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | `{ "username": "nurse.elena", "password": "password123" }` | Tizimga kirish (JWT token qaytaradi) |
| `POST` | `/api/auth/register` | `{ "username": "...", "password": "...", "fullName": "..." }` | Yangi hamshirani ro'yxatdan o'tkazish |
| `GET` | `/api/auth/me` | `Authorization: Bearer <TOKEN>` | Joriy sessiya ma'lumotlari |
| `POST` | `/api/auth/logout` | — | Tizimdan chiqish |

### 3. Dori Slotlari (`/api/slots`)
| Metod | URL | Body namuna | Tavsif |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/slots/:deviceId` | — | Qurilmaning 14 ta slot holatini olish |
| `PUT` | `/api/slots/:deviceId/:slotId` | `{ "medName": "Aspirin", "time": "08:00", "status": "scheduled" }` | Slot ma'lumotlarini yangilash |

### 4. Tarqatish Loglari (`/api/logs`)
| Metod | URL | Body namuna | Tavsif |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/logs` | `{ "deviceId": "ESP32-CUBE-01", "slotId": 1, "medName": "Aspirin" }` | Dori ichilganligi to'g'risida log yozish |
| `GET` | `/api/logs/:deviceId` | — | Dori tarqatish tarixini olish (oxirgi 50 ta) |

### 5. Bemorlar (`/api/patients`)
| Metod | URL | Tavsif |
| :--- | :--- | :--- |
| `GET` | `/api/patients` | Barcha ro'yxatdagi bemorlar |
| `GET` | `/api/patients/:deviceId` | Berilgan qurilmaga biriktirilgan bemor ma'lumotlari |

### 6. IoT Telemetriya (`/api/data`)
| Metod | URL | Body namuna | Tavsif |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/data` | `{ "device": "ESP32-CUBE-01", "status": "online", "temp": 24.5 }` | Telemetriya ma'lumotini saqlash |
| `GET` | `/api/data` | `?limit=50&device=ESP32-CUBE-01` | Oxirgi telemetriya ma'lumotlari |
| `GET` | `/api/data/stats` | — | 24 soatlik harorat statistikasi va online holati |

---

## 🚀 Mahalliy muhitda ishga tushirish (Local Setup)

1. **Repozitoriyani klonlash va bog'liqliklarni o'rnatish:**
   ```bash
   git clone https://github.com/samancikme/dari_backend.git
   cd dari_backend/backend
   npm install
   ```

2. **Muhit o'zgaruvchilarini sozlash:**
   `.env.example` faylidan nusxa olib `.env` yarating:
   ```bash
   cp .env.example .env
   ```
   Kerakli qiymatlarni kiritishingiz mumkin:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/vito_cube?retryWrites=true&w=majority
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=100
   JWT_SECRET=your_secret_key_here
   ```

3. **Serverni ishga tushirish:**
   ```bash
   npm start
   ```
   Server `http://localhost:5000` manzilida ishlaydi.

4. **Testlarni yurgizish:**
   ```bash
   npm test
   ```

---

## 🌐 Render.com da Bepul Deploy Qilish Qo'llanmasi

Ushbu backendni **Render.com** platformasida mutlaqo bepul (Free tier) joylashtirish mumkin.

### 1-qadam: Render.com da ro'yxatdan o'tish
* [Render.com](https://render.com) saytiga kiring va o'zingizning **GitHub** akkauntingiz orqali kiring (Sign in with GitHub).

### 2-qadam: Yangi Web Service yaratish
1. Render Dashboard-da **"New +"** tugmasini bosing va **"Web Service"** ni tanlang.
2. **"Build and deploy from a Git repository"** bandini tanlang.
3. O'zingizning `dari_backend` repozitoriyangizni topib, **"Connect"** tugmasini bosing.

### 3-qadam: Sozlamalarni kiritish
* **Name**: `vitocube-backend` (yoki ixtiyoriy nom)
* **Region**: `Frankfurt (EU Central)` yoki o'zingizga yaqin region
* **Root Directory**: `backend` (chunki loyiha backend papkasida joylashgan)
* **Runtime**: `Node`
* **Build Command**: `npm install`
* **Start Command**: `npm start`
* **Instance Type**: `Free`

### 4-qadam: Muhit o'zgaruvchilarini (Environment Variables) kiritish
Quyidagi qiymatlarni **Environment Variables** bo'limiga qo'shing:
* `NODE_ENV`: `production`
* `MONGODB_URI`: Sizning MongoDB Atlas ulanish manzilingiz (masalan, `mongodb+srv://...`)
* `JWT_SECRET`: Ixtiyoriy maxfiy kalit so'z (masalan, `vitocube_secret_key_2026`)

### 5-qadam: "Deploy Web Service" tugmasini bosing!
Render avtomatik tarzda `npm install` va `npm start` buyruqlarini bajaradi. Jarayon 1-2 daqiqada yakunlanib, sizga bepul **`https://vitocube-backend.onrender.com`** ko'rinishidagi jonli HTTPS havola taqdim etiladi.

---

## 📄 Litsenziya
ISC
