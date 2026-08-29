# HireMind — AI-Driven Talent Intelligence & Workforce Analytics Platform

Hire smarter. Discover talent faster. Screen thousands of candidate resumes in one workflow.

A three-service MERN + Flask application:

```
hiremind/
├── backend/       Node.js + Express + MongoDB (port 5000)
├── ml-service/    Python + Flask (port 5001)
├── frontend/      React + Vite (port 5173)
├── start.js       Cross-platform single-command runner
└── render.yaml    Render.com Blueprint 1-click deployment configuration
```

---

## 🚀 Quick Start (Single Command Run)

Run all 3 services concurrently from the root directory with a single command:

```bash
npm start
# or
npm run dev
```

This launches:
- **ML Service**: `http://localhost:5001`
- **Backend API**: `http://localhost:5000`
- **Frontend UI**: `http://localhost:5173`

---

## ⚡ 1-Click Render.com Cloud Deployment

HireMind is fully pre-configured for **Render.com** deployment via `render.yaml` Blueprints:

1. Push this repository to **GitHub**.
2. Log into [Render Dashboard](https://dashboard.render.com/) and click **New +** ➔ **Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml` and configure:
   - **Frontend**: Free Static Site (`npm run build`)
   - **Backend**: Node.js Web Service (`node server.js`)
   - **ML Service**: Python Web Service (`python app.py`)
4. Supply your free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string (`MONGO_URI`) when prompted.
5. Click **Apply**. Render will generate all secret keys and deploy all 3 services automatically!

---

## 📋 Default Credentials

- **Admin Account**: `admin@hiremind.com` / `ChangeMe123!`
- **Portal URL**: `http://localhost:5173`

---

## 🛠️ Individual Service Setup

### 1. ML Service
```bash
cd ml-service
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### 2. Backend
```bash
cd backend
npm install
npm run seed   # Seed default jobs & candidates
node server.js
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
