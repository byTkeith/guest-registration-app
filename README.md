# Guest Registration App (Vite + Express)

A split project with **Vite + React** frontend and **Express + Nodemailer** backend.
Sends completed guest registration PDF + ID documents as email attachments.

## Structure
```
guest-registration-app/
  frontend/   # Vite + React
  backend/    # Express + Nodemailer
```
## Getting Started

### Backend
```bash
cd backend
npm install
# create .env with Gmail credentials
echo "EMAIL_USER=yourgmail@gmail.com" > .env
echo "EMAIL_PASS=your_app_password" >> .env
npm run dev
```
Server runs at `http://localhost:5000`.

### Frontend
```bash
cd frontend
npm install
# optional: set API base
cp .env.example .env
# edit .env to point to deployed backend or keep default localhost
npm run dev
```
App runs at `http://localhost:5173`.

### Configure Frontend API Base
In `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:5000
```

### Deployment
- Deploy **backend** to Render/Railway/Heroku. Set environment variables:
  - `EMAIL_USER`, `EMAIL_PASS` (Gmail App Password recommended).
- Deploy **frontend** to Netlify/Vercel. Set `VITE_API_BASE_URL` to your backend URL.

### Notes
- Ensure your Google account has 2FA enabled and use an **App Password** for Gmail SMTP.
- Increase Express `json` limit if your PDFs are large.
