# CSV Data Cleaner - Deployment Guide

## 🚀 Deployment on Render

This project is configured for deployment on Render.com with automatic builds from GitHub.

### Prerequisites
- GitHub account
- Render account (free tier available)
- Git configured locally

### Deployment Steps

#### 1. Push to GitHub
```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

#### 2. Deploy Backend (API)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `csv-cleaner-api`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### 3. Deploy Frontend
1. Click "New" → "Web Service"
2. Connect the same GitHub repository
3. Configure:
   - **Name**: `csv-cleaner-frontend`
   - **Environment**: `Node`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: `https://csv-cleaner-api.onrender.com`

#### 4. Update CORS Settings
After deployment, update the backend CORS settings with your actual Render URLs in `backend/main.py`.

### Environment Variables

#### Backend
- `PORT`: Automatically set by Render
- `PYTHON_VERSION`: 3.11.0

#### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NODE_VERSION`: 18

### Custom Domains (Optional)
After deployment, you can configure custom domains in Render dashboard:
- Backend: `api.your-domain.com`
- Frontend: `your-domain.com`

### Health Checks
Both services include health check endpoints:
- Backend: `/api/health`
- Frontend: Built-in Next.js health checks

### Performance Considerations
- Free tier has limitations (750 hours/month, spins down after 15 minutes of inactivity)
- For production, consider upgrading to paid plans for:
  - Persistent storage
  - Always-on services
  - Better performance
  - Custom domains

### Monitoring
Monitor your deployments at:
- Render Dashboard: https://dashboard.render.com
- Backend logs and metrics
- Frontend build logs and performance

### Troubleshooting
1. **Build failures**: Check build logs in Render dashboard
2. **CORS issues**: Verify NEXT_PUBLIC_API_URL is set correctly
3. **API not responding**: Check backend logs for errors
4. **File upload issues**: Verify file size limits and backend connectivity

## 🔧 Local Development
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 📁 File Structure for Deployment
```
CSV_Cleaner/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── start.sh            # Deployment script
│   └── runtime.txt         # Python version
├── frontend/
│   ├── app/                # Next.js pages
│   ├── components/         # React components
│   ├── utils/              # Utilities including API config
│   ├── package.json        # Node dependencies
│   ├── .env.production     # Production environment
│   └── .env.local          # Local environment
├── render.yaml             # Render configuration
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

The application is now ready for deployment! 🎉
