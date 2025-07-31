# 🧹 CSV Data Cleaner

A modern, full-stack web application for automated CSV data cleaning and preprocessing. Built with Next.js, FastAPI, and advanced data science libraries.

![CSV Cleaner Preview](https://via.placeholder.com/800x400?text=CSV+Data+Cleaner)

## ✨ Features

### 🔧 Data Cleaning Capabilities
- **Automated Missing Value Handling**: Intelligent imputation for numeric and categorical data
- **Outlier Detection & Treatment**: Z-score and IQR-based outlier handling with multiple strategies
- **Data Type Optimization**: Automatic detection and conversion of appropriate data types
- **Duplicate Removal**: Comprehensive duplicate detection and removal
- **String Data Cleaning**: Whitespace trimming, case normalization, and encoding standardization
- **Categorical Encoding**: Smart encoding for machine learning compatibility

### 🚀 Performance & Scalability
- **Large File Support**: Handles files up to 100MB with streaming processing
- **Progress Tracking**: Real-time processing status and progress indicators
- **Chunked Processing**: Memory-efficient processing for large datasets
- **Background Tasks**: Non-blocking file processing with automatic cleanup

### 🎨 Modern User Experience
- **Responsive Design**: Beautiful, mobile-first design with Tailwind CSS
- **Drag & Drop Upload**: Intuitive file upload with preview functionality
- **Real-time Feedback**: Instant validation and processing status updates
- **Download Management**: Easy download of cleaned data and encoding maps
- **Visual Analytics**: Data quality insights and processing statistics

### 🔒 Production Ready
- **Automatic File Cleanup**: 15-minute file expiration with background cleanup
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Health Monitoring**: Built-in health checks and monitoring endpoints
- **CORS Support**: Secure cross-origin resource sharing configuration
- **Environment Configuration**: Flexible deployment across environments

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Heroicons**: Beautiful SVG icons
- **Axios**: HTTP client for API communication
- **React Dropzone**: File upload handling

### Backend
- **FastAPI**: Modern Python web framework
- **Pandas**: Data manipulation and analysis
- **Scikit-learn**: Machine learning preprocessing
- **NumPy**: Numerical computing
- **Uvicorn**: ASGI server for production

### Deployment
- **Render**: Cloud deployment platform
- **GitHub**: Version control and CI/CD
- **Environment Variables**: Secure configuration management

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/Adithya-Holla/Clean_CSV.git
cd Clean_CSV
```

2. **Setup Backend**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux  
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

3. **Setup Frontend** (new terminal)
```bash
cd frontend
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Documentation: http://localhost:8001/docs

## 📦 Deployment

### Deploy to Render

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Deploy Backend**
- Create new Web Service on Render
- Connect GitHub repository
- Set root directory to `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Deploy Frontend**
- Create new Web Service on Render
- Connect same GitHub repository  
- Set root directory to `frontend`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com`

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📖 API Documentation

### Core Endpoints
- `POST /api/upload` - Upload CSV file for analysis
- `POST /api/clean` - Clean data with specified parameters  
- `GET /api/download/{file_id}` - Download processed data
- `GET /api/health` - Health check endpoint
- `GET /api/results` - Get latest processing results

### Cleaning Parameters
- **Outlier Strategy**: `remove`, `cap`, `transform`
- **Z-Score Threshold**: Statistical outlier detection sensitivity
- **IQR Multiplier**: Interquartile range outlier detection
- **Standardization**: Feature scaling options

Full API documentation available at `/docs` when running the backend.

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8001
```

#### Production (.env.production)
```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

#### Backend
```bash
PORT=8001                    # Server port (auto-set by Render)
ENVIRONMENT=production       # Environment mode
```

## 📊 Data Processing Pipeline

1. **Upload & Validation**
   - File format validation (CSV only)
   - Size limits (100MB max)
   - Encoding detection and normalization

2. **Analysis & Profiling**
   - Data type detection
   - Missing value analysis
   - Outlier identification
   - Statistical profiling

3. **Cleaning & Transformation**
   - Missing value imputation
   - Outlier treatment
   - Data type optimization
   - Categorical encoding
   - Duplicate removal

4. **Export & Download**
   - Cleaned data export
   - Encoding keymap generation
   - Processing summary report

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Adithya Holla** - *Initial work* - [@Adithya-Holla](https://github.com/Adithya-Holla)

## 🙏 Acknowledgments

- FastAPI team for the excellent framework
- Next.js team for the React framework
- Pandas community for data manipulation tools
- Tailwind CSS for the utility-first styling approach

## 📞 Support

If you have any questions or need help with deployment, please open an issue on GitHub or contact [your-email@example.com](mailto:your-email@example.com).

---

**Made with ❤️ and lots of ☕**
