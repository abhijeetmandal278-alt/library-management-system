# Library Book Issue & Return Management System

A full-stack web application that lets librarians manage a library's book inventory and handle book issue/return operations using QR code scanning. Built as part of the NSCC Full-Stack Task 1.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Additional Features](#additional-features)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Database Configuration](#database-configuration)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Implementation Decisions](#implementation-decisions)
- [Concepts Learned](#concepts-learned)
- [Demo](#demo)

---

## Overview

Librarians can add books to the system, generate a unique QR code for each one, and then issue or return books simply by scanning that QR code with a device camera. The system tracks book availability in real time, maintains a full transaction history, flags overdue books, and lets an admin export reports as CSV or Excel.

An optional AI layer (Google Gemini) powers a library assistant chatbot and a natural-language "smart search" over the book catalog.

---

## Tech Stack

**Frontend**
- React 18 + Vite 6
- React Router v6
- Tailwind CSS v4
- `html5-qrcode` — camera-based QR scanning
- `react-qr-code` — QR code rendering
- Axios, React Hot Toast, date-fns

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (`jsonwebtoken`, `bcryptjs`)
- `express-validator` for request validation
- `qrcode` — server-side QR code generation
- `json2csv` and `exceljs` — data export
- `helmet`, `cors`, `morgan` — security and logging

**AI**
- Google Gemini API (`gemini-2.0-flash`), called directly via `fetch` — no SDK dependency

---

## Features

### Librarian Side (Frontend)
- Add and manage book records (Title, Author, ISBN, Category, Total Copies)
- Auto-generated unique Book ID (`LIB-000001` format) and QR code per book
- Scan a book's QR code using the device camera to issue or return it
- Live status per book: **Available / Unavailable**
- Search and filter books by title, author, category, and availability

### Backend / API
- Book and transaction data persisted in MongoDB
- Scanned book IDs are verified against the database before any transaction proceeds
- Book availability (`availableCopies`) updates automatically on issue/return
- Every transaction records the borrower's name/ID, issue timestamp, due date, and return timestamp
- Issuing a book that's already fully checked out is blocked with a clear error
- Complete, queryable transaction history (filterable by date range, pagination supported)
- Validation and error handling for invalid book IDs, invalid/unregistered QR codes, duplicate issue attempts, invalid returns, and unavailable books, via `express-validator` + a centralized error-handling middleware

### Data Export
- Transaction history exportable as **CSV** (`json2csv`) or **Excel** (`exceljs`), including Book Title, Author, Book ID, Borrower, Issue Timestamp, Return Timestamp, and Status

### Admin Dashboard (Brownie Subtask)
- Summary stats: Total Books, Available Books, Issued Books, Overdue Books
- List of currently issued books with borrower details
- Search and filter across transactions
- Downloadable issue/return reports
- **Overdue days calculation** — each transaction has a 14-day due date; a virtual field computes exactly how many days overdue a book is in real time

---

## Additional Features

- **JWT-based authentication with roles** (`admin` / `librarian`) — passwords hashed with bcrypt, protected routes via middleware, and a default admin account is seeded automatically on first server start.
- **AI Library Assistant (`/api/ai/chat`)** — a Gemini-powered chatbot that answers librarian questions, gives book recommendations, and helps with general library queries.
- **AI Smart Search (`/api/ai/smart-search`)** — accepts natural-language queries (e.g. *"sci-fi books by Asimov"*), asks Gemini to extract structured search parameters (title/author/category), and runs that against MongoDB. Falls back automatically to a plain MongoDB text search if no API key is configured or if Gemini's response can't be parsed, so the search feature never breaks even without AI configured.
- **Full-text search index** on `title`, `author`, and `category` for fast catalog search independent of the AI feature.

---

## Project Structure

```
NSCC Task/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/             # Chatbot / smart search UI
│   │   │   ├── common/
│   │   │   └── layout/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/            # Axios API calls
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── server/                    # Express backend
    ├── config/                 # DB connection
    ├── controllers/
    │   ├── authController.js
    │   ├── bookController.js
    │   ├── transactionController.js
    │   ├── dashboardController.js
    │   ├── exportController.js
    │   └── aiController.js
    ├── middleware/              # auth (protect), validate, errorHandler
    ├── models/
    │   ├── User.js
    │   ├── Book.js
    │   └── Transaction.js
    ├── routes/
    ├── server.js
    └── package.json
```

---

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally (or a connection string to a remote instance)
- npm

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd "NSCC Task"
```

### 2. Backend setup
```bash
cd server
npm install
```

Create a `.env` file inside `server/`:
```dotenv
PORT=5000
MONGO_URI=mongodb://localhost:27017/library_management
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
GEMINI_API_KEY=your_gemini_api_key_here
```

> `GEMINI_API_KEY` is optional. If left blank or as the placeholder, the AI chatbot returns a friendly "not configured" message and smart search falls back to normal MongoDB text search — the rest of the app works fully without it.

Start the backend:
```bash
npm run dev      # nodemon, for development
# or
npm start        # plain node, for production
```

The server starts on `http://localhost:5000`. On first run, it automatically seeds a default admin account:
- **Email:** `admin@library.com`
- **Password:** `admin123`

### 3. Frontend setup
```bash
cd ../client
npm install
npm run dev
```

The frontend runs on Vite's default port (`http://localhost:5173`) and talks to the backend at `http://localhost:5000`.

### 4. Login
Open the frontend, log in with the seeded admin credentials above (or register a new librarian account via `/api/auth/register`), and start adding books.

---

## Database Configuration

The app uses **MongoDB** via Mongoose. By default it points to a local instance:
```
mongodb://localhost:27017/library_management
```
To use MongoDB Atlas or another remote instance instead, just replace `MONGO_URI` in `.env` with your connection string — no code changes needed. Mongoose handles connection, and two indexes are created automatically:
- A **unique index** on `Book.bookId`
- A **text index** across `Book.title`, `Book.author`, and `Book.category` for search

---

## API Reference

All endpoints are prefixed with `/api`. Routes marked 🔒 require a valid JWT (`Authorization: Bearer <token>`).

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user (name, email, password ≥ 6 chars) |
| POST | `/auth/login` | Log in, returns a JWT |
| GET 🔒 | `/auth/me` | Get the currently logged-in user |

### Books
| Method | Endpoint | Description |
|---|---|---|
| GET | `/books` | List all books |
| POST 🔒 | `/books` | Create a book (auto-generates `bookId` + QR code) |
| GET | `/books/scan/:bookId` | Look up a book by its scanned Book ID (QR verification) |
| GET | `/books/:id` | Get a single book by Mongo ID |
| PUT 🔒 | `/books/:id` | Update a book |
| DELETE 🔒 | `/books/:id` | Delete a book |

### Transactions
All transaction routes require authentication.

| Method | Endpoint | Description |
|---|---|---|
| GET 🔒 | `/transactions` | List transactions (supports date-range filtering & pagination) |
| POST 🔒 | `/transactions/issue` | Issue a book (bookId, borrowerName, borrowerId) |
| POST 🔒 | `/transactions/return` | Return a book (bookId, borrowerId) |
| GET 🔒 | `/transactions/:id` | Get a single transaction |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET 🔒 | `/dashboard/stats` | Total / available / issued / overdue book counts |
| GET 🔒 | `/dashboard/issued` | Currently issued books with borrower details |
| GET 🔒 | `/dashboard/overdue` | Overdue books, with days overdue |

### Export
| Method | Endpoint | Description |
|---|---|---|
| GET 🔒 | `/export/csv` | Download transaction history as CSV |
| GET 🔒 | `/export/excel` | Download transaction history as Excel |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST 🔒 | `/ai/chat` | Chat with the library assistant |
| POST 🔒 | `/ai/smart-search` | Natural-language book search |

---

## Data Models

**Book**
`bookId` (auto-generated), `title`, `author`, `isbn` (optional, unique), `category`, `totalCopies`, `availableCopies`, `qrCode` (base64 data URL), plus a virtual `status` (`available` / `unavailable`) derived from `availableCopies`.

**Transaction**
`book` (ref → Book), `borrowerName`, `borrowerId`, `issueDate`, `dueDate` (defaults to 14 days from issue), `returnDate`, `status` (`issued` / `returned` / `overdue`), `issuedBy` (ref → User), plus a virtual `daysOverdue` computed live from `dueDate`.

**User**
`name`, `email` (unique), `password` (bcrypt-hashed, excluded from query results by default), `role` (`admin` / `librarian`).

---

## Implementation Decisions

- **QR codes encode only the Book ID**, not the full book record. This keeps QR codes small and scannable, and forces every scan to be re-verified against the live database (`/books/scan/:bookId`) rather than trusting stale data encoded in the code itself — important for accurately reflecting real-time availability.
- **Book IDs are server-generated** (`LIB-000001`, incrementing) rather than user-entered, avoiding duplicate/malformed IDs and keeping QR codes consistent.
- **Availability is tracked via a single `availableCopies` counter** updated atomically (`$inc`) on issue/return, rather than deriving it by counting active transactions on every request — simpler and faster for the availability checks that happen on every scan.
- **`daysOverdue` and `status` are Mongoose virtuals**, computed on read instead of stored and updated by a cron job. This keeps overdue status always accurate without needing a background scheduler for this task's scope.
- **AI features degrade gracefully.** If `GEMINI_API_KEY` is missing or Gemini's response fails to parse, smart search silently falls back to MongoDB's built-in text search, and the chatbot returns an explanatory message instead of erroring out — the core app never depends on the AI feature being configured.
- **Centralized validation and error handling** — `express-validator` checks are declared per-route, and a single `errorHandler` middleware formats all errors consistently, keeping controllers focused on business logic.

---

## Concepts Learned

- Structuring a Mongoose schema with **virtuals** to derive computed fields (`status`, `daysOverdue`) without duplicating stored data.
- Implementing **QR-code-based workflows** end-to-end: generating codes server-side, rendering them client-side, and scanning them back via the device camera.
- Designing **defensive AI integration** — calling an external LLM API directly via `fetch` without an SDK, and building a fallback path so a third-party API outage or missing key never breaks core functionality.
- Applying **role-based JWT authentication** with protected Express routes and centralized request validation middleware.
- Building **idempotent-safe transaction logic** to prevent double-issuing a book or returning a book that was never issued.

---

## Demo

📹 [Watch Demo Video](https://drive.google.com/file/d/1QcCAaKr-IXBeLECBJy_sidm-K37Odoe2/view?usp=sharing)

🌐 **Live app:** [https://library-management-system-zeta-bay.vercel.app/](https://library-management-system-zeta-bay.vercel.app/)

🔗 **Backend API:** [https://library-management-system-hfuo.onrender.com](https://library-management-system-hfuo.onrender.com)
