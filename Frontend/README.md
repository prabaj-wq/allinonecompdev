# IFRS Consolidation Tool - React Frontend

This is the React frontend for the IFRS Consolidation Tool, designed to work seamlessly with your existing Python backend.

## Features

- **Modern React 18** with hooks and context
- **Tailwind CSS** for styling with dark mode support
- **React Router** for navigation
- **React Query** for data fetching and caching
- **Python Backend Integration** - connects to your existing FastAPI backend
- **Company Management** - switch between different companies
- **Responsive Design** - works on desktop and mobile
- **Professional UI/UX** - modern dashboard with intuitive navigation

## Prerequisites

- Node.js 16+ and npm
- Python 3.8+ with your existing backend running
- Your Python FastAPI server running on `http://localhost:8000`

## Installation

1. **Navigate to the React directory:**
   ```bash
   cd templates/react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

The app will open at `http://localhost:3000`

## Python Backend Integration

This React app is designed to work with your existing Python backend. It includes:

### API Endpoints
The app connects to these Python backend endpoints:
- `/companies` - Get available companies
- `/company/{name}` - Get company data
- `/consolidation_data/{company}/{period}` - Get consolidation data
- `/financial_statements` - Generate financial statements
- `/ifrs_templates` - Get IFRS templates
- And many more...

### Data Flow
1. **Company Selection** - Users can switch between companies
2. **Real-time Data** - Data is fetched from your Python backend
3. **CSV Integration** - Works with your existing CSV-based storage
4. **File Uploads** - Trial balance and other file uploads
5. **Export Functionality** - Export data in various formats

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout with sidebar
│   ├── CompanySelector.jsx # Company switcher
│   └── ui/             # Basic UI components
├── contexts/            # React contexts
│   ├── ThemeContext.jsx # Dark/light mode
│   └── CompanyContext.jsx # Company management
├── hooks/               # Custom React hooks
│   └── useAuth.js      # Authentication
├── pages/               # Page components
│   ├── Dashboard.jsx   # Main dashboard
│   ├── Consolidation.jsx # Consolidation module
│   ├── FinancialStatements.jsx # Financial statements
│   └── ...             # Other modules
├── services/            # API services
│   ├── api.js          # General API service
│   └── pythonIntegration.js # Python backend integration
└── App.jsx             # Main app component
```

## Available Pages

- **Dashboard** - Overview and quick actions
- **Consolidation** - Financial consolidation module
- **Financial Statements** - Generate and export statements
- **IFRS Templates** - IFRS compliance templates
- **Process Module** - Automated processing
- **Asset Register** - Asset management
- **Bills** - Bill management
- **Audit** - Audit functionality
- **Settings** - Configuration and backup

## Configuration

### Backend URL
Update the Python backend URL in `src/services/pythonIntegration.js`:
```javascript
const pythonAPI = axios.create({
  baseURL: 'http://localhost:8000', // Change this to your backend URL
  // ...
})
```

### Vite Proxy
The Vite config includes a proxy for development:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    secure: false,
  },
}
```

## Development

### Available Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Run linting

### Adding New Features
1. Create new page components in `src/pages/`
2. Add routes in `src/App.jsx`
3. Add navigation items in `src/components/Layout.jsx`
4. Create API services in `src/services/pythonIntegration.js`

## Production Build

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Serve the built files:**
   ```bash
   npm run preview
   ```

3. **Deploy the `dist` folder** to your web server

## Integration with Python Backend

### Required Python Endpoints
Your Python backend should implement these endpoints:

```python
# Company management
@app.get("/companies")
@app.post("/create_company")
@app.get("/company/{name}")

# Consolidation
@app.get("/consolidation_data/{company}/{period}")
@app.post("/process_consolidation/{company}/{period}")

# Financial statements
@app.post("/generate_financial_statements/{company}")
@app.get("/export_financial_statements/{company}/{period}/{year}")

# IFRS templates
@app.get("/ifrs_templates")
@app.get("/ifrs_standard/{standard}")
```

### Data Format
The React app expects JSON responses from your Python backend. Ensure your endpoints return data in the expected format.

## Troubleshooting

### Common Issues

1. **Backend Connection Error**
   - Ensure your Python server is running on port 8000
   - Check CORS settings in your Python backend
   - Verify the backend URL in `pythonIntegration.js`

2. **Build Errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

3. **Runtime Errors**
   - Check browser console for JavaScript errors
   - Verify all required dependencies are installed

### CORS Configuration
Add this to your Python FastAPI app:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify your Python backend is running and accessible
3. Check the network tab for failed API requests
4. Ensure all dependencies are properly installed

## License

This project is part of your IFRS Consolidation Tool and follows the same licensing terms.
