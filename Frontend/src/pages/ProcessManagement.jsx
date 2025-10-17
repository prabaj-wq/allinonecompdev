import React, { useState, useEffect } from 'react'
import { useCompany } from '../contexts/CompanyContext'
import { useAuth } from '../hooks/useAuth'
import { Plus, Edit, Trash2, Play, BookOpen, Zap } from 'lucide-react'
import ProcessBuilder from '../components/ProcessBuilder'

const PROCESS_TYPES = ['Consolidation', 'Close', 'Forecast', 'Budget', 'Reporting', 'Operational']

const ProcessManagement = () => {
  const { selectedCompany } = useCompany()
  const { isAuthenticated, getAuthHeaders } = useAuth()

  const [view, setView] = useState('list') // 'list' or 'builder'
  const [processes, setProcesses] = useState([])
  const [selectedProcess, setSelectedProcess] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    process_type: PROCESS_TYPES[0],
    base_currency: 'USD',
    fiscal_year: new Date().getFullYear().toString(),
  })
  const [notification, setNotification] = useState(null)

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const authHeaders = () => getAuthHeaders()

  // Fetch all processes
  const fetchProcesses = async () => {
    if (!selectedCompany || !isAuthenticated) return
    setLoading(true)
    try {
      const response = await fetch(
        `/api/process/catalog?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'GET',
          headers: authHeaders(),
          credentials: 'include',
        }
      )
      if (!response.ok) throw new Error(`Failed to load processes (${response.status})`)
      const data = await response.json()
      setProcesses(Array.isArray(data.processes) ? data.processes : [])
    } catch (error) {
      console.error('Error fetching processes:', error)
      showNotification('Failed to load processes', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (view === 'list') {
      fetchProcesses()
    }
  }, [view, selectedCompany, isAuthenticated])

  // Create new process
  const handleCreateProcess = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim()) {
      showNotification('Process name is required', 'error')
      return
    }

    try {
      const response = await fetch(
        `/api/process/catalog?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          credentials: 'include',
          body: JSON.stringify(createForm),
        }
      )

      if (!response.ok) throw new Error('Failed to create process')
      const data = await response.json()
      setProcesses([...processes, data.process])
      setCreateForm({ name: '', description: '', process_type: PROCESS_TYPES[0], base_currency: 'USD', fiscal_year: new Date().getFullYear().toString() })
      setShowCreateModal(false)
      showNotification('Process created successfully!')
    } catch (error) {
      console.error('Error creating process:', error)
      showNotification('Failed to create process', 'error')
    }
  }

  // Delete process
  const handleDeleteProcess = async (processId) => {
    if (!window.confirm('Are you sure you want to delete this process?')) return

    try {
      const response = await fetch(
        `/api/process/catalog/${processId}?company_name=${encodeURIComponent(selectedCompany)}`,
        {
          method: 'DELETE',
          headers: authHeaders(),
          credentials: 'include',
        }
      )

      if (!response.ok) throw new Error('Failed to delete process')
      setProcesses(processes.filter((p) => p.id !== processId))
      if (selectedProcess?.id === processId) {
        setSelectedProcess(null)
      }
      showNotification('Process deleted successfully!')
    } catch (error) {
      console.error('Error deleting process:', error)
      showNotification('Failed to delete process', 'error')
    }
  }

  // Handle opening builder
  const handleOpenBuilder = (process) => {
    setSelectedProcess(process)
    setView('builder')
  }

  if (view === 'builder' && selectedProcess) {
    return (
      <ProcessBuilder
        processId={selectedProcess.id}
        processName={selectedProcess.name}
        onSave={() => {
          showNotification('Workflow saved!')
          fetchProcesses()
        }}
        onDelete={() => {
          handleDeleteProcess(selectedProcess.id)
          setView('list')
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Zap size={32} className="text-blue-400" />
              Process Management
            </h1>
            <p className="text-slate-400 mt-2">Create and manage business process workflows</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            New Process
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Create New Process</h2>

            <form onSubmit={handleCreateProcess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Process Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Monthly Consolidation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Describe the process..."
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Process Type
                  </label>
                  <select
                    value={createForm.process_type}
                    onChange={(e) => setCreateForm({ ...createForm, process_type: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {PROCESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fiscal Year
                  </label>
                  <input
                    type="text"
                    value={createForm.fiscal_year}
                    onChange={(e) => setCreateForm({ ...createForm, fiscal_year: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
                >
                  Create Process
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">Loading processes...</div>
          </div>
        ) : processes.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-semibold text-white mb-2">No processes yet</h3>
            <p className="text-slate-400 mb-6">Create your first process to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Create Process
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {processes.map((process) => (
              <div
                key={process.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{process.name}</h3>
                    <p className="text-slate-400 mb-3">{process.description}</p>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-900 text-blue-200 text-sm font-medium">
                        {process.process_type}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-700 text-slate-200 text-sm font-medium">
                        {process.fiscal_year}
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          process.status === 'draft'
                            ? 'bg-yellow-900 text-yellow-200'
                            : 'bg-green-900 text-green-200'
                        }`}
                      >
                        {process.status || 'Draft'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenBuilder(process)}
                      className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                      title="Edit process workflow"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteProcess(process.id)}
                      className="p-3 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                      title="Delete process"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProcessManagement