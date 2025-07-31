// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default API_BASE_URL;

// API endpoints
export const API_ENDPOINTS = {
  upload: `${API_BASE_URL}/api/upload`,
  clean: `${API_BASE_URL}/api/clean`,
  health: `${API_BASE_URL}/api/health`,
  results: `${API_BASE_URL}/api/results`,
  files: `${API_BASE_URL}/api/files`,
  downloadLatest: `${API_BASE_URL}/api/download-latest`,
  download: (fileId: string) => `${API_BASE_URL}/api/download/${fileId}`,
  downloadKeymap: (fileId: string) => `${API_BASE_URL}/api/download-keymap/${fileId}`,
};
