<div align="center">

# 📁 DocNest

### Smart Client Document & Family Management System

*A full-stack, enterprise-grade portal to manage client records, family structures, and government identity documents with client-side OCR verification.*

<br/>

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 🌐 Live Demo & Deployment

<div align="center">

[![🚀 Live Application](https://img.shields.io/badge/🚀_LIVE_DEMO-DocNest-4F46E5?style=for-the-badge&labelColor=1e1e2e)](https://docnest-pink.vercel.app)
&nbsp;&nbsp;
[![📦 GitHub Repo](https://img.shields.io/badge/📦_SOURCE_CODE-GitHub-181717?style=for-the-badge&logo=github&labelColor=1e1e2e)](https://github.com/Om-Rajpure/DocNest)

</div>

* **Frontend (Vercel)**: [https://docnest-pink.vercel.app](https://docnest-pink.vercel.app)
* **Backend API (Render)**: Hosted on Render *(free tier, container spins down on inactivity — please allow up to 30s for the initial request to wake it up)*.
* **Database**: Managed MySQL instance on Aiven.

---

## 📖 Project Overview

### The Problem
Consulting agencies, CAs, insurance brokers, and legal firms in India handle hundreds of client folders containing essential KYC documents (Aadhaar, PAN, Driving Licenses, Utility bills). Managing these manually through physical folders, WhatsApp, or spreadsheets results in scattered documents, missing files, no easy way to verify document numbers, and poor visibility into family nominee hierarchies.

### The Solution
DocNest provides a secure, role-based single-page platform. It enables operators to maintain a unified client directory, visualize family relationships as interactive trees, upload and preview documents, and instantly check document authenticity using browser-based OCR (reducing server computational overhead).

---

## ✨ Features

* **🔐 Secure Auth**: Stateless JWT authentication chain with BCrypt password hashing and role-based route permissions (`ADMIN`, `MANAGER`, `EMPLOYEE`).
* **📊 Analytics Dashboard**: Real-time stats count, recent registry updates grid, and chronological activity logging.
* **👥 Client CRUD**: Searchable and filterable client registry with location office tagging and dynamic custom field visibility rules.
* **🔍 Client-Side OCR**: Drag-and-drop file uploader (PDF/JPG/PNG) parsing text in the browser via Tesseract.js and PDF.js, checking layout validation patterns (e.g. 12-digit Aadhaar, PAN structure, DL formats).
* **🌳 Family Trees**: Interactive hierarchy mapping utilizing `react-d3-tree` with smart dob validations (e.g. child cannot be older than parent).
* **📥 Excel Bulk Import**: Preview parsed spreadsheet clients using SheetJS and import records via Apache POI validation logs.
* **📝 Audit Logs**: Automatically tracks operational activities (🟢 Create, 🟡 Update, 🔴 Delete).

---

## 🛠️ Tech Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend** | React 18.3, Vite 5.2, Material UI 5.15, React Router DOM 6.23, Recharts, Framer Motion, Axios |
| **Backend** | Spring Boot 3.2.5, Java 17, Spring Security 6.x, JPA / Hibernate, JJWT, Apache POI 5.2.5 |
| **OCR / Excel** | Tesseract.js 7.0, PDF.js 5.7, SheetJS (XLSX) 0.18 |
| **Database & DevOps**| MySQL 8.0, HikariCP, Docker, Render, Vercel, Aiven Managed DB |

---

## 📸 Screenshots

### Landing Portal
![Landing Page](screenshots/landing-page.png)

### Authentication
![Login Page](screenshots/login-page.png)

### Analytics Dashboard
![Dashboard](screenshots/dashboard.png)

### Client Registry
![Client List](screenshots/client-list.png)

### OCR Document Stepper
![OCR Verification](screenshots/ocr-verification.png)

### Family Trees
![Family Tree](screenshots/family-tree.png)

---

## 🔄 Project Workflow & Request Flow

### Request Flow Diagram
```
[ React Client ] ──▶ HTTP Request (Bearer JWT) ──▶ [ JwtAuthFilter ] (Checks signature)
                                                         │
[ MySQL DB ] ◀── Hibernate (JPA) ◀── [ Services ] ◀── [ Controllers ] (Enforce Roles)
```

### OCR Parsing Flow
```
[ File Upload ] ──▶ PDF rendered to Canvas / Image ──▶ [ Tesseract.js Worker ] ──▶ [ Regex Match ] ──▶ [ Save to DB ]
```

---

## 📁 Repository Structure

```
DocNest/
├── docnest-backend/             # ☕ Spring Boot REST Service
│   ├── src/main/java/com/docnest/
│   │   ├── config/              # CORS Security & CommandLineRunner seeders
│   │   ├── controller/          # REST Endpoints mapping CRUD operations
│   │   ├── entity/              # JPA Schemas (User, Client, FamilyMember, Document)
│   │   ├── repository/          # JPA database queries mapping MySQL
│   │   └── security/            # JWT token builders and filters
│   └── resources/               # Database and upload application profiles
│
└── docnest-frontend/            # ⚛️ React SPA Web Client
    ├── src/
    │   ├── context/             # AuthContext tracking user login sessions
    │   ├── services/            # Request clients calling the API (Axios wrapper)
    │   ├── pages/               # Screen interfaces (Dashboard, lists, configurations)
    │   └── utils/               # OCR browser workers and document validators
```

---

## 🗄️ Database Design

### Polymorphic Document Ownership
A core database design decision is **Polymorphic Mapping** on the `document` table. Instead of sparse tables or composite foreign keys, the `document` schema uses `owner_type` (e.g. `"CLIENT"` or `"FAMILY_MEMBER"`) and `owner_id` to bind files. This keeps schema relationships normalized, extensible, and handled cleanly by JPA service layer logic.

### Entity Dictionary
* `users`: Auth credentials, roles, and profiles.
* `client`: Client personal information records and branch location mapping.
* `family_member`: Family listings linked to client records.
* `document`: File system path and verified OCR extracted text.
* `location_master`: Reference table storing registered branch locations.
* `activity_log`: Compliance logger saving timestamped user edits.

---

## 🔌 API Endpoints

| Domain | Method & Endpoint | Description | Role Access |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/auth/login` | Validate user & issue JWT | Public |
| **Clients**| `GET /api/clients` | Fetch paginated, searchable clients | Authenticated |
| **Clients**| `DELETE /api/clients/{id}`| Remove client record | Admin, Manager |
| **Docs** | `POST /api/documents/upload`| Upload file and OCR details | Authenticated |
| **Docs** | `GET /api/documents/owner/{type}/{id}`| Fetch documents of target parent | Authenticated |
| **Family** | `GET /api/family/tree/{id}` | Fetch nested D3 tree structure | Authenticated |
| **Import** | `POST /api/import/excel` | Bulk upload client list | Authenticated |

---

## 🚀 Installation & Setup

### 1. Database Configuration
Create database schemas and users in MySQL:
```sql
CREATE DATABASE docnest;
CREATE USER 'docnest_user'@'localhost' IDENTIFIED BY 'your_database_password';
GRANT ALL PRIVILEGES ON docnest.* TO 'docnest_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configure Backend Env (`docnest-backend/.env`)
```env
DB_URL=jdbc:mysql://localhost:3306/docnest?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=docnest_user
DB_PASSWORD=your_database_password
JWT_SECRET=generate_with_openssl_rand_hex_32
JWT_EXPIRATION=86400000
CORS_ORIGINS=http://localhost:5173
UPLOAD_DIR=uploads
PORT=8080
```

Run backend service:
```bash
cd docnest-backend
./mvnw spring-boot:run
```

### 3. Configure Frontend Env (`docnest-frontend/.env.local`)
```env
VITE_API_URL=http://localhost:8080
```

Run web application:
```bash
cd docnest-frontend
npm install
npm run dev
```

---

## 🧗 Challenges Faced & Learnings

* **OCR Browser Performance**: Rendered multi-page PDFs to offscreen canvases at a scale of `2.0` to maximize text sharpness prior to Tesseract character extraction, without causing CPU bottlenecks.
* **Polymorphic JPA Mapping**: Implemented custom queries and lifecycle triggers on backend services to handle double-entity uploads, ensuring orphan records are clean.
* **CORS Settings in production**: Configured credentials sharing filters dynamically to support cross-domain Vercel frontend requests.

---

## 🎯 Technical Interview Preparation

<details>
<summary><b>Q1: Explain the system architecture and tech selection.</b></summary>
DocNest is a decoupled client-server SPA. I selected <b>Spring Boot</b> because of its stable REST services ecosystem and robust Spring Security. <b>MySQL</b> was chosen over MongoDB because client data maps to strict parent-child relations (Clients ──▶ Family Members). <b>React</b> handles dynamic state updates, and browser-based OCR saves server computing resources.
</details>

<details>
<summary><b>Q2: How is stateless authentication set up?</b></summary>
It uses a JWT token architecture. On login, the backend verifies credentials with <b>BCrypt</b> and issues an HS256-signed JWT. The client saves this token in <code>localStorage</code>, and an Axios request interceptor attaches it as a <code>Bearer</code> token header. A custom <code>JwtAuthFilter</code> intercepts and authenticates API requests.
</details>

<details>
<summary><b>Q3: What was the most difficult engineering challenge?</b></summary>
Optimizing OCR scanning on PDFs in the browser. Tesseract.js doesn't parse PDFs directly. I resolved this by rendering pages into canvas images using <b>PDF.js</b>, extracting bitmap segments, running the OCR worker, and compiling results. We resolved the accuracy issue by matching key regex patterns (such as Aadhaar space offsets) instead of relying on exact raw text.
</details>

---

## 👥 Author & Social Connections

<div align="center">

| Profile | Links & Badges |
| :--- | :--- |
| **Om Rajpure** <br/> *Full Stack Developer* <br/><br/> <img src="https://github.com/Om-Rajpure.png" width="100" style="border-radius:50%;" alt="Om Rajpure Profile"/> | [![Portfolio](https://img.shields.io/badge/Portfolio-conceptsin5.com-4F46E5?style=for-the-badge&logo=google-chrome&logoColor=white)](https://conceptsin5.com/) <br/><br/> [![GitHub](https://img.shields.io/badge/GitHub-Om--Rajpure-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Om-Rajpure) <br/><br/> [![LinkedIn](https://img.shields.io/badge/LinkedIn-Om--Rajpure-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/om-rajpure) <br/><br/> [![Instagram](https://img.shields.io/badge/Instagram-conceptsin5-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/conceptsin5) <br/><br/> [![YouTube](https://img.shields.io/badge/YouTube-conceptsin5-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@conceptsin5) |

</div>

---

## 🤝 Contribution & License

Contributions are welcome! Please fork the repository, make your modifications on a feature branch, and submit a PR utilizing [Conventional Commits](https://www.conventionalcommits.org/).

Licensed under the [MIT License](LICENSE).
