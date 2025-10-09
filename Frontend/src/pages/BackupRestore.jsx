
import React, { useState } from 'react'
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  HardDrive,
  Cloud,
  Database,
  FileText,
  Settings,
  Play,
  Pause,

  Eye,
  Trash2,
  Plus,
  Calendar,
  User,
  Shield
} from 'lucide-react'

const BackupRestore = () => {
  const [activeTab, setActiveTab] = useState('backup')
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState(null)

  const backupHistory = [
    {
      id: 1,
      name: 'Full Backup - August 2025',
      type: 'Full',
      size: '2.4 GB',
      date: '2025-08-21 14:30:00',
      status: 'Completed',
      user: 'Admin User',
      description: 'Complete system backup including all entities and financial data'
    },
    {
      id: 2,
      name: 'Incremental Backup - August 2025',
      type: 'Incremental',
      size: '156 MB',
      date: '2025-08-20 14:30:00',
      status: 'Completed',
      user: 'System',
      description: 'Daily incremental backup of changed data'
    },
    {
      id: 3,
      name: 'Full Backup - July 2025',
      type: 'Full',
      size: '2.1 GB',
      date: '2025-07-31 14:30:00',
      status: 'Completed',
      user: 'Admin User',
      description: 'Monthly full backup'
    }
  ]

  const handleBackup = async () => {
    setIsBackingUp(true)
    // Simulate backup process
    setTimeout(() => {
      setIsBackingUp(false)
    }, 3000)
  }

  const handleRestore = async () => {
    if (!selectedBackup) return
    setIsRestoring(true)
    // Simulate restore process
    setTimeout(() => {
      setIsRestoring(false)
    }, 5000)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'Full':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Incremental':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Differential':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <HardDrive className="h-8 w-8 mr-3 text-purple-600" />
              Backup & Restore
            </h1>
            <p className="text-gray-600 mt-2">Manage system backups, data protection, and disaster recovery</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleBackup}
              disabled={isBackingUp}
              className="btn-primary flex items-center"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Backing Up...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Backups</p>
              <p className="text-3xl font-bold text-gray-900">{backupHistory.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <HardDrive className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Backup</p>
              <p className="text-3xl font-bold text-gray-900">2 hours ago</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Size</p>
              <p className="text-3xl font-bold text-gray-900">4.7 GB</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Database className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Auto Backup</p>
              <p className="text-3xl font-bold text-gray-900">Enabled</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Settings className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['backup', 'restore', 'history', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-200 ${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Backup</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <HardDrive className="h-5 w-5 mr-2 text-blue-600" />
                    Full Backup
                  </h4>
                  <p className="text-gray-600 mb-4">Complete backup of all system data including entities, accounts, and financial statements.</p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-4">
                    <li>• All entities and subsidiaries</li>
                    <li>• Complete chart of accounts</li>
                    <li>• Financial statements and reports</li>
                    <li>• System configuration</li>
                  </ul>
                  <button 
                    onClick={handleBackup}
                    disabled={isBackingUp}
                    className="btn-primary w-full"
                  >
                    {isBackingUp ? 'Creating Backup...' : 'Start Full Backup'}
                  </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Cloud className="h-5 w-5 mr-2 text-green-600" />
                    Incremental Backup
                  </h4>
                  <p className="text-gray-600 mb-4">Backup only changed data since the last backup, faster and uses less storage.</p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-4">
                    <li>• Only modified data</li>
                    <li>• Faster execution</li>
                    <li>• Reduced storage usage</li>
                    <li>• Daily automated</li>
                  </ul>
                  <button className="btn-secondary w-full">Schedule Incremental</button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">Backup Security</h4>
                    <p className="text-sm text-blue-700">All backups are encrypted with AES-256 encryption and stored securely both locally and in the cloud.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'restore' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Restore from Backup</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Warning</h4>
                    <p className="text-sm text-yellow-700">Restoring from a backup will overwrite current data. Make sure to backup current data before proceeding.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Backup</label>
                  <select 
                    value={selectedBackup || ''} 
                    onChange={(e) => setSelectedBackup(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Choose a backup to restore from</option>
                    {backupHistory.map(backup => (
                      <option key={backup.id} value={backup.id}>
                        {backup.name} - {backup.date}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Restore Type</label>
                  <select className="form-select">
                    <option value="full">Full System Restore</option>
                    <option value="entities">Entities Only</option>
                    <option value="accounts">Accounts Only</option>
                    <option value="financials">Financial Data Only</option>
                  </select>
                </div>
              </div>

              {selectedBackup && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Restore Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Backup Date</p>
                      <p className="font-medium text-gray-900">
                        {backupHistory.find(b => b.id == selectedBackup)?.date}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Backup Size</p>
                      <p className="font-medium text-gray-900">
                        {backupHistory.find(b => b.id == selectedBackup)?.size}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Backup Type</p>
                      <p className="font-medium text-gray-900">
                        {backupHistory.find(b => b.id == selectedBackup)?.type}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className="btn-danger w-full"
                  >
                    {isRestoring ? 'Restoring...' : 'Start Restore'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Backup History</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Backup Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backupHistory.map((backup) => (
                      <tr key={backup.id} className="table-row-hover">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{backup.name}</div>
                            <div className="text-sm text-gray-500">{backup.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getTypeColor(backup.type)}`}>
                            {backup.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{backup.size}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(backup.status)}`}>
                            {backup.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.user}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900" title="View Details">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900" title="Restore">
                              <Upload className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Backup Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Automated Backups</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Enable Auto Backup</span>
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                      <select className="form-select">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Backup Time</label>
                      <input type="time" defaultValue="02:00" className="form-input" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Storage Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Local Storage Path</label>
                      <input type="text" defaultValue="/backups" className="form-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cloud Storage</label>
                      <select className="form-select">
                        <option value="aws">AWS S3</option>
                        <option value="azure">Azure Blob</option>
                        <option value="gcp">Google Cloud Storage</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Retention Period</label>
                      <select className="form-select">
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                        <option value="365">1 year</option>
                        <option value="unlimited">Unlimited</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn-primary">Save Settings</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BackupRestore
