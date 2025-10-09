import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Globe, 
  FileText, 
  Server, 
  Wifi, 
  Lock, 
  Eye, 
  EyeOff,
  TestTube,
  Save,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const SourceManagementModal = ({ isOpen, onClose, onSourceAdded }) => {
  const [sourceType, setSourceType] = useState('database');
  const [formData, setFormData] = useState({
    name: '',
    source_type: 'database',
    connection_string: '',
    api_url: '',
    api_key: '',
    username: '',
    password: '',
    file_path: '',
    headers: '',
    port: '',
    database_name: '',
    schema: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const sourceTypes = [
    { 
      id: 'database', 
      name: 'Database', 
      icon: Database, 
      description: 'PostgreSQL, MySQL, Oracle, SQL Server',
      color: 'bg-blue-500'
    },
    { 
      id: 'rest_api', 
      name: 'REST API', 
      icon: Globe, 
      description: 'HTTP/HTTPS REST endpoints',
      color: 'bg-green-500'
    },
    { 
      id: 'odata', 
      name: 'OData', 
      icon: Server, 
      description: 'OData v4 services',
      color: 'bg-purple-500'
    },
    { 
      id: 'file', 
      name: 'File System', 
      icon: FileText, 
      description: 'CSV, Excel, JSON, XML files',
      color: 'bg-orange-500'
    },
    { 
      id: 'ftp', 
      name: 'FTP/SFTP', 
      icon: Wifi, 
      description: 'File Transfer Protocol',
      color: 'bg-red-500'
    },
    { 
      id: 'webhook', 
      name: 'Webhook', 
      icon: Server, 
      description: 'Real-time data streams',
      color: 'bg-indigo-500'
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('source_type', sourceType);
      
      // Add fields based on source type
      if (sourceType === 'database') {
        formDataToSend.append('connection_string', formData.connection_string);
        formDataToSend.append('username', formData.username);
        formDataToSend.append('password', formData.password);
        formDataToSend.append('port', formData.port);
        formDataToSend.append('database_name', formData.database_name);
        formDataToSend.append('schema', formData.schema);
      } else if (sourceType === 'rest_api' || sourceType === 'odata') {
        formDataToSend.append('api_url', formData.api_url);
        formDataToSend.append('api_key', formData.api_key);
        formDataToSend.append('headers', formData.headers);
      } else if (sourceType === 'file') {
        formDataToSend.append('file_path', formData.file_path);
      } else if (sourceType === 'ftp') {
        formDataToSend.append('api_url', formData.api_url);
        formDataToSend.append('username', formData.username);
        formDataToSend.append('password', formData.password);
        formDataToSend.append('port', formData.port);
      }

      const response = await fetch('/api/etl/sources', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        const result = await response.json();
        onSourceAdded(result.source);
        onClose();
        resetForm();
      } else {
        throw new Error('Failed to add source');
      }
    } catch (error) {
      console.error('Error adding source:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock test result - in real app, this would call the test endpoint
      const success = Math.random() > 0.3; // 70% success rate for demo
      setTestResult({
        success,
        message: success ? 'Connection successful!' : 'Connection failed. Please check your settings.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      source_type: 'database',
      connection_string: '',
      api_url: '',
      api_key: '',
      username: '',
      password: '',
      file_path: '',
      headers: '',
      port: '',
      database_name: '',
      schema: ''
    });
    setSourceType('database');
    setTestResult(null);
  };

  const renderSourceTypeFields = () => {
    switch (sourceType) {
      case 'database':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Host/Server
                </label>
                <input
                  type="text"
                  placeholder="localhost"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  value={formData.api_url}
                  onChange={(e) => handleInputChange('api_url', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Port
                </label>
                <input
                  type="text"
                  placeholder="5432"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  value={formData.port}
                  onChange={(e) => handleInputChange('port', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Database Name
                </label>
                <input
                  type="text"
                  placeholder="mydatabase"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  value={formData.database_name}
                  onChange={(e) => handleInputChange('database_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Schema
                </label>
                <input
                  type="text"
                  placeholder="public"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  value={formData.schema}
                  onChange={(e) => handleInputChange('schema', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="username"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="password"
                    className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Connection String (Optional)
              </label>
              <input
                type="text"
                placeholder="postgresql://user:pass@localhost:5432/db"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                value={formData.connection_string}
                onChange={(e) => handleInputChange('connection_string', e.target.value)}
              />
            </div>
          </div>
        );

      case 'rest_api':
      case 'odata':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                API URL
              </label>
              <input
                type="url"
                placeholder="https://api.example.com/data"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                value={formData.api_url}
                onChange={(e) => handleInputChange('api_url', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                API Key (Optional)
              </label>
              <input
                type="password"
                placeholder="your-api-key"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                value={formData.api_key}
                onChange={(e) => handleInputChange('api_key', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Custom Headers (JSON)
              </label>
              <textarea
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                value={formData.headers}
                onChange={(e) => handleInputChange('headers', e.target.value)}
              />
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                File Path
              </label>
              <input
                type="text"
                placeholder="/path/to/your/files"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                value={formData.file_path}
                onChange={(e) => handleInputChange('file_path', e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>Supported formats: CSV, Excel (.xlsx, .xls), JSON, XML</p>
              <p>You can use wildcards: /data/*.csv or /data/**/*.xlsx</p>
            </div>
          </div>
        );

      case 'ftp':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                FTP Server
              </label>
              <input
                type="text"
                placeholder="ftp.example.com"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                value={formData.api_url}
                onChange={(e) => handleInputChange('api_url', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="username"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="password"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Port
              </label>
              <input
                type="text"
                placeholder="21"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                value={formData.port}
                onChange={(e) => handleInputChange('port', e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add Data Source</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                Select Source Type
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {sourceTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSourceType(type.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                      sourceType === type.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color} text-white`}>
                        <type.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">{type.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Source Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Source Name *
              </label>
              <input
                type="text"
                required
                placeholder="My Data Source"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>

            {/* Dynamic Fields Based on Source Type */}
            {renderSourceTypeFields()}

            {/* Test Connection */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={testConnection}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test Connection
              </button>
              
              {testResult && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  testResult.success 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                }`}>
                  {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span className="text-sm font-medium">{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Add Source
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SourceManagementModal;
