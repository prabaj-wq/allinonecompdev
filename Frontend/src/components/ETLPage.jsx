import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Upload, 
  Download, 
  Settings, 
  Play, 
  Pause, 
  StopCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  BarChart3,
  FileText,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  Zap,
  Activity,
  Server,
  HardDrive,
  Globe,
  Lock,
  Shield,
  TrendingUp,
  BarChart,
  PieChart,
  LineChart,
  Database as DatabaseIcon,
  FileSpreadsheet,
  Code,
  GitBranch,
  History,
  RotateCcw,
  Save,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Info,
  HelpCircle
} from 'lucide-react';

const ETLPage = () => {
  const [activeTab, setActiveTab] = useState('extract');
  const [extractData, setExtractData] = useState([]);
  const [transformData, setTransformData] = useState([]);
  const [loadData, setLoadData] = useState([]);
  const [etlJobs, setEtlJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [jobStatus, setJobStatus] = useState('idle');

  // Fetch data from backend API
  useEffect(() => {
    fetchETLData();
  }, []);

  const fetchETLData = async () => {
    try {
      // Fetch sources
      const sourcesResponse = await fetch('/api/etl/sources');
      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        setExtractData(sourcesData.sources);
      }

      // Fetch transformations
      const transformationsResponse = await fetch('/api/etl/transformations');
      if (transformationsResponse.ok) {
        const transformationsData = await transformationsResponse.json();
        setTransformData(transformationsData.transformations);
      }

      // Fetch targets
      const targetsResponse = await fetch('/api/etl/targets');
      if (targetsResponse.ok) {
        const targetsData = await targetsResponse.json();
        setLoadData(targetsData.targets);
      }

      // Fetch jobs
      const jobsResponse = await fetch('/api/etl/jobs');
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setEtlJobs(jobsData.jobs);
      }
    } catch (error) {
      console.error('Error fetching ETL data:', error);
      // Fallback to mock data if API fails
      setExtractData([
        {
          id: 1,
          name: 'PostgreSQL Source',
          type: 'database',
          status: 'connected',
          lastSync: '2024-01-15 10:30:00',
          records: 15420,
          size: '2.3 GB'
        }
      ]);
    }
  };

  const handleRunJob = async (jobType) => {
    setIsLoading(true);
    setJobStatus('running');
    
    try {
      const formData = new FormData();
      formData.append('job_type', jobType);
      
      const response = await fetch('/api/etl/run-job', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Job started:', result);
        
        // Refresh data after job completion
        setTimeout(() => {
          fetchETLData();
          setIsLoading(false);
          setJobStatus('completed');
        }, 2000);
      } else {
        throw new Error('Failed to start job');
      }
    } catch (error) {
      console.error('Error running job:', error);
      setIsLoading(false);
      setJobStatus('failed');
    }
  };

  const handleAddSource = (newSource) => {
    setExtractData(prev => [...prev, newSource]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'connected':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'running':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'scheduled':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-100/30 dark:text-yellow-400';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'connected':
        return <CheckCircle className="w-4 h-4" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'extract', name: 'Extract', icon: Download, description: 'Connect and retrieve data from sources' },
    { id: 'transform', name: 'Transform', icon: RefreshCw, description: 'Clean, map, and transform data' },
    { id: 'load', name: 'Load', icon: Upload, description: 'Load transformed data to targets' },
    { id: 'monitoring', name: 'Monitoring', icon: Activity, description: 'Monitor ETL jobs and performance' },
    { id: 'audit', name: 'ETL Audit', icon: FileText, description: 'Audit trail and transformation history' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Database className="w-8 h-8 text-blue-600" />
                ETL Data Pipeline
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Extract, Transform, and Load data from multiple sources to your target systems
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleRunJob('full')}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 mr-2" />
                Run Full Pipeline
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Extract Tab */}
        {activeTab === 'extract' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Data Sources</h2>
                <button className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Source
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {extractData.map((source) => (
                  <div key={source.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-slate-900 dark:text-white">{source.name}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(source.status)}`}>
                        {getStatusIcon(source.status)}
                        <span className="ml-1">{source.status}</span>
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="capitalize">{source.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Records:</span>
                        <span>{source.records.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{source.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Sync:</span>
                        <span>{source.lastSync}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleRunJob('extract')}
                        disabled={isLoading}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Sync
                      </button>
                      <button className="inline-flex items-center justify-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transform Tab */}
        {activeTab === 'transform' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Data Transformations</h2>
                <button className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transformation
                </button>
              </div>
              
              <div className="space-y-4">
                {transformData.map((transformation) => (
                  <div key={transformation.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-white">{transformation.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{transformation.type}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transformation.status)}`}>
                        {getStatusIcon(transformation.status)}
                        <span className="ml-1">{transformation.status}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Last Run:</span>
                        <p className="font-medium text-slate-900 dark:text-white">{transformation.lastRun}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Input Records:</span>
                        <p className="font-medium text-slate-900 dark:text-white">{transformation.recordsProcessed.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Output Records:</span>
                        <p className="font-medium text-slate-900 dark:text-white">{transformation.recordsOutput.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                        <p className="font-medium text-slate-900 dark:text-white">{transformation.duration}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleRunJob('transform')}
                        disabled={isLoading}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Run
                      </button>
                      <button className="inline-flex items-center justify-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="inline-flex items-center justify-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Load Tab */}
        {activeTab === 'load' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Data Targets</h2>
                <button className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Target
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadData.map((target) => (
                  <div key={target.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DatabaseIcon className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-slate-900 dark:text-white">{target.name}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(target.status)}`}>
                        {getStatusIcon(target.status)}
                        <span className="ml-1">{target.status}</span>
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="capitalize">{target.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Records Loaded:</span>
                        <span>{target.recordsLoaded.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{target.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Load:</span>
                        <span>{target.lastLoad}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{target.duration}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleRunJob('load')}
                        disabled={isLoading}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Load Data
                      </button>
                      <button className="inline-flex items-center justify-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Job Status Overview */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Job Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Running</span>
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Completed</span>
                    <span className="text-green-600 font-semibold">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Scheduled</span>
                    <span className="text-yellow-600 font-semibold">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Failed</span>
                    <span className="text-red-600 font-semibold">0</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Avg Duration</span>
                    <span className="text-slate-900 dark:text-white font-semibold">12m 30s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Success Rate</span>
                    <span className="text-green-600 font-semibold">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Records/Hour</span>
                    <span className="text-slate-900 dark:text-white font-semibold">45.2K</span>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">System Health</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">CPU Usage</span>
                    <span className="text-green-600 font-semibold">23%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Memory</span>
                    <span className="text-green-600 font-semibold">67%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Disk Space</span>
                    <span className="text-yellow-600 font-semibold">78%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Jobs */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Jobs</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Job Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Records</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {etlJobs.map((job) => (
                      <tr key={job.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                          {job.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {getStatusIcon(job.status)}
                            <span className="ml-1">{job.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {job.startTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {job.duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {job.recordsProcessed.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                              <Eye className="w-4 h-4" />
                            </button>
                            {job.status === 'running' && (
                              <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                <StopCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ETL Audit Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">ETL Audit Trail</h2>
                <div className="flex gap-2">
                  <button className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Export
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Last 10 Transformations */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Last 10 Transformations</h3>
                  <div className="space-y-3">
                    {transformData.slice(0, 10).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{item.lastRun}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.recordsProcessed.toLocaleString()} → {item.recordsOutput.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Lineage */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Data Lineage</h3>
                  <div className="bg-white dark:bg-slate-600 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                          <Database className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Source</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">PostgreSQL</p>
                      </div>
                      <div className="flex items-center">
                        <ArrowRight className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                          <RefreshCw className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Transform</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Cleansing</p>
                      </div>
                      <div className="flex items-center">
                        <ArrowRight className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                          <Upload className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">Load</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Target DB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 flex items-center gap-4">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-slate-900 dark:text-white">Processing ETL job...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Arrow component for data lineage
const ArrowRight = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

export default ETLPage;
