import React, { useState, useEffect, useRef } from 'react'
import { 
  FileText, 
  Plus, 
  Save, 
  Download, 
  Share2, 
  Users, 
  Eye, 
  Edit3, 
  Trash2, 
  MoreVertical,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FolderOpen,
  File,
  Image,
  Table,
  BarChart3,
  Link,
  Globe,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  User,
  Lock,
  Unlock,
  History,
  GitBranch,
  Languages,
  Palette,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Code,
  Minus,
  Maximize2,
  Minimize2,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react'

const NarrativeReporting = () => {
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [collaborators, setCollaborators] = useState([])
  const [comments, setComments] = useState([])
  const [templates, setTemplates] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState('edit') // edit, preview, review
  const [language, setLanguage] = useState('en')
  const [region, setRegion] = useState('US')

  // Document structure state
  const [documentSections, setDocumentSections] = useState([])
  const [currentSection, setCurrentSection] = useState(null)
  const [documentHistory, setDocumentHistory] = useState([])
  const [approvalWorkflow, setApprovalWorkflow] = useState([])

  useEffect(() => {
    // Initialize with sample data
    initializeSampleData()
  }, [])

  const initializeSampleData = () => {
    const sampleTemplates = [
      { id: 1, name: 'Annual Report 2025', type: 'annual', description: 'Complete annual report template with all sections' },
      { id: 2, name: 'Quarterly Pack Q4 2025', type: 'quarterly', description: 'Quarterly financial summary and analysis' },
      { id: 3, name: 'Board Pack Q4 2025', type: 'board', description: 'Executive summary for board presentation' },
      { id: 4, name: 'ESG Disclosure Report', type: 'esg', description: 'Environmental, Social, and Governance reporting' },
      { id: 5, name: 'Audit Committee Presentation', type: 'audit', description: 'Audit findings and compliance summary' }
    ]

    const sampleDocuments = [
      { id: 1, name: 'Annual Report 2024', type: 'annual', status: 'published', lastModified: '2024-12-15', collaborators: 5 },
      { id: 2, name: 'Q3 2024 Report', type: 'quarterly', status: 'active', lastModified: '2024-10-20', collaborators: 3 },
      { id: 3, name: 'Board Presentation Q4', type: 'board', status: 'review', lastModified: '2024-12-10', collaborators: 4 }
    ]

    setTemplates(sampleTemplates)
    setDocuments(sampleDocuments)
  }

  const toggleSection = (id) => {
    setDocumentSections(prev => prev.map(section => 
      section.id === id 
        ? { ...section, expanded: !section.expanded }
        : section
    ))
  }

  const handleNewDocument = () => {
    setIsEditorOpen(true)
    setSelectedDocument(null)
    setDocumentSections([])
    setCurrentSection(null)
  }

  const handleDocumentSave = () => {
    console.log('Saving document...')
  }

  const handleDocumentExport = (format) => {
    console.log(`Exporting as ${format}...`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Narrative Reporting & Disclosure Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create, collaborate, and publish comprehensive financial reports
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2 inline" />
                New Document
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Documents</h2>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            
            {/* Document List */}
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedDocument?.id === doc.id
                      ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      doc.status === 'published' ? 'bg-green-100 text-green-800' :
                      doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Modified: {doc.lastModified} • {doc.collaborators} collaborators
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Sidebar Toggle Button */}
          {!isSidebarOpen && (
            <div className="absolute left-4 top-20 z-10">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {selectedDocument ? (
            <DocumentEditor 
              document={selectedDocument}
              onClose={() => setSelectedDocument(null)}
            />
          ) : (
            <EmptyState 
              onNewDocument={() => setIsEditorOpen(true)}
              templates={templates}
            />
          )}
        </div>
      </div>
      
      {/* Document Creation Modal */}
      {showCreateModal && (
        <DocumentCreationModal 
          onClose={() => setShowCreateModal(false)}
          onDocumentCreated={(doc) => {
            setDocuments(prev => [...prev, doc])
            setSelectedDocument(doc)
            setShowCreateModal(false)
          }}
          templates={templates}
        />
      )}
    </div>
  )
}

// Empty State Component
const EmptyState = ({ onNewDocument, templates }) => {
  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No document selected
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Choose a document from the sidebar or create a new one to get started
        </p>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={onNewDocument}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            Create New Document
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2 inline" />
            Use Template
          </button>
        </div>
        
        {/* Template Selection Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select a Template</h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => {
                      onNewDocument(template)
                      setShowTemplates(false)
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full mt-1">
                          {template.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Document Editor Component
const DocumentEditor = ({ document, onClose }) => {
  const [sections, setSections] = useState([
    { id: 1, title: 'Executive Summary', type: 'text', content: '', expanded: true, status: 'active', assignedTo: null },
    { id: 2, title: 'Financial Highlights', type: 'text', content: '', expanded: true, status: 'active', assignedTo: null },
    { id: 3, title: 'Management Discussion', type: 'text', content: '', expanded: true, status: 'active', assignedTo: null },
    { id: 4, title: 'Financial Statements', type: 'financial', content: '', expanded: true, status: 'active', assignedTo: null },
    { id: 5, title: 'Notes to Financial Statements', type: 'notes', content: '', expanded: true, status: 'active', assignedTo: null },
    { id: 6, title: 'ESG Disclosure', type: 'esg', content: '', expanded: true, status: 'active', assignedTo: null }
  ])
  
  const [collaborators] = useState([
    { id: 1, name: 'John Doe', role: 'Finance Director', avatar: 'JD', status: 'online' },
    { id: 2, name: 'Jane Smith', role: 'CFO', avatar: 'JS', status: 'online' },
    { id: 3, name: 'Mike Johnson', role: 'Controller', avatar: 'MJ', status: 'away' }
  ])
  
  const [comments] = useState([
    { id: 1, author: 'John Doe', content: 'Please review the revenue growth section', timestamp: '2 hours ago', sectionId: 2 },
    { id: 2, author: 'Jane Smith', content: 'ESG metrics need updating for Q4', timestamp: '1 hour ago', sectionId: 6 }
  ])
  
  const [approvalWorkflow] = useState([
    { step: 1, name: 'Draft Review', status: 'completed', assignee: 'Mike Johnson', dueDate: '2024-12-20' },
    { step: 2, name: 'Management Review', status: 'in-progress', assignee: 'Jane Smith', dueDate: '2024-12-22' },
    { step: 3, name: 'Board Approval', status: 'pending', assignee: 'Board Committee', dueDate: '2024-12-25' }
  ])

  const toggleSection = (id) => {
    setSections(prev => prev.map(section => 
      section.id === id 
        ? { ...section, expanded: !section.expanded }
        : section
    ))
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Editor Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{document.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last modified: {document.lastModified}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </button>
            <button className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Section Tree */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Document Sections</h3>
          <div className="space-y-1">
            {sections.map((section) => (
              <SectionTreeItem 
                key={section.id} 
                section={section} 
                onToggle={(id) => toggleSection(id)}
              />
            ))}
          </div>
          
          {/* Collaboration Panel */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Collaborators</h3>
            <div className="space-y-2">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center ${
                    collaborator.status === 'online' ? 'ring-2 ring-green-400' : ''
                  }`}>
                    {collaborator.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{collaborator.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{collaborator.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Approval Workflow */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Approval Workflow</h3>
            <div className="space-y-2">
              {approvalWorkflow.map((step) => (
                <div key={step.step} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${
                    step.status === 'completed' ? 'bg-green-500' :
                    step.status === 'in-progress' ? 'bg-yellow-500' :
                    'bg-gray-300'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{step.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{step.assignee}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Version Control */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Version History</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <GitBranch className="h-4 w-4 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">v1.2 - Current</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <GitBranch className="h-4 w-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">v1.1</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <GitBranch className="h-4 w-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">v1.0</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">1 week ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 p-6">
          <RichTextEditor />
          
          {/* Comments Panel */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Comments & Feedback</h3>
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{comment.author}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                </div>
              ))}
              <button className="w-full p-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-dashed border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <MessageSquare className="h-4 w-4 mr-2 inline" />
                Add Comment
              </button>
            </div>
          </div>
          
          {/* Disclosure Library */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Disclosure Library</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Accounting Policies</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Standard disclosure templates for accounting policies</p>
                <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Insert Template
                </button>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Risk Management</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Risk disclosure and management commentary</p>
                <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Insert Template
                </button>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Related Parties</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Related party transaction disclosures</p>
                <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Insert Template
                </button>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">ESG Metrics</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Environmental and social responsibility</p>
                <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Insert Template
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Section Tree Item Component
const SectionTreeItem = ({ section, onToggle }) => {
  return (
    <div className="space-y-1">
      <div 
        className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
        onClick={() => onToggle(section.id)}
      >
        {section.expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
        <span className="text-sm text-gray-700 dark:text-gray-300">{section.title}</span>
      </div>
      {section.expanded && (
        <div className="ml-6 space-y-1">
          {/* Sub-sections would go here */}
        </div>
      )}
    </div>
  )
}

// Rich Text Editor Component
const RichTextEditor = () => {
  const [content, setContent] = useState('')
  const [toolbarState, setToolbarState] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: 'left'
  })
  
  const [showDataEmbed, setShowDataEmbed] = useState(false)
  const [showChartEmbed, setShowChartEmbed] = useState(false)
  const [showTableEmbed, setShowTableEmbed] = useState(false)

  const financialData = [
    { label: 'Total Assets', value: '$2,500,000', change: '+15%', period: 'Q4 2024' },
    { label: 'Revenue', value: '$1,200,000', change: '+8%', period: 'Q4 2024' },
    { label: 'Net Profit', value: '$450,000', change: '+12%', period: 'Q4 2024' }
  ]

  const handleDataEmbed = (dataType) => {
    const embedText = `@[FS.${dataType}]`
    console.log('Embedding:', embedText)
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Toolbar */}
      <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1">
          <button className={`p-2 rounded ${toolbarState.bold ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
            <Bold className="h-4 w-4" />
          </button>
          <button className={`p-2 rounded ${toolbarState.italic ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
            <Italic className="h-4 w-4" />
          </button>
          <button className={`p-2 rounded ${toolbarState.underline ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
            <Underline className="h-4 w-4" />
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
        
        {/* Lists */}
        <div className="flex items-center space-x-1">
          <button className="p-2 text-gray-600 hover:text-gray-900">
            <List className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900">
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
        
        {/* Data Embedding */}
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setShowDataEmbed(!showDataEmbed)}
            className="p-2 text-gray-600 hover:text-gray-900 bg-blue-50 hover:bg-blue-100 rounded"
            title="Embed Financial Data"
          >
            <Link className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setShowChartEmbed(!showChartEmbed)}
            className="p-2 text-gray-600 hover:text-gray-900 bg-green-50 hover:bg-green-100 rounded"
            title="Embed Charts"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setShowTableEmbed(!showTableEmbed)}
            className="p-2 text-gray-600 hover:text-gray-900 bg-purple-50 hover:bg-purple-100 rounded"
            title="Embed Tables"
          >
            <Table className="h-4 w-4" />
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
        
        {/* Language & Region */}
        <div className="flex items-center space-x-2">
          <select className="text-xs border border-gray-300 rounded px-2 py-1">
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
            <option value="de">DE</option>
          </select>
          <select className="text-xs border border-gray-300 rounded px-2 py-1">
            <option value="US">US</option>
            <option value="EU">EU</option>
            <option value="UK">UK</option>
            <option value="IN">IN</option>
          </select>
        </div>
      </div>
      
      {/* Data Embed Panels */}
      {showDataEmbed && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">Embed Financial Data</h4>
          <div className="grid grid-cols-3 gap-2">
            {financialData.map((data) => (
              <button
                key={data.label}
                onClick={() => handleDataEmbed(data.label.replace(/\s+/g, ''))}
                className="p-2 text-xs bg-white dark:bg-blue-800 border border-blue-200 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-700"
              >
                <div className="font-medium text-blue-900 dark:text-blue-100">{data.label}</div>
                <div className="text-blue-700 dark:text-blue-300">{data.value}</div>
                <div className="text-blue-600 dark:text-blue-400">{data.change}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {showChartEmbed && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">Embed Charts & Visuals</h4>
          <div className="grid grid-cols-2 gap-2">
            <button className="p-3 text-sm bg-white dark:bg-green-800 border border-green-200 dark:border-green-600 rounded hover:bg-green-50 dark:hover:bg-green-700">
              <BarChart3 className="h-5 w-5 mx-auto mb-2 text-green-600" />
              Bar Chart
            </button>
            <button className="p-3 text-sm bg-white dark:bg-green-800 border border-green-200 dark:border-green-600 rounded hover:bg-green-50 dark:hover:bg-green-700">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-green-600" />
              Line Chart
            </button>
          </div>
        </div>
      )}
      
      {showTableEmbed && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
          <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-3">Embed Tables</h4>
          <div className="grid grid-cols-2 gap-2">
                          <button className="p-3 text-sm bg-white dark:bg-purple-800 border border-purple-200 dark:border-purple-600 rounded hover:bg-purple-50 dark:hover:bg-purple-700">
                <Table className="h-5 w-5 mx-auto mb-2 text-purple-600" />
                Financial Table
              </button>
            <button className="p-3 text-sm bg-white dark:bg-purple-800 border border-purple-200 dark:border-purple-600 rounded hover:bg-purple-50 dark:hover:bg-purple-700">
              <FileSpreadsheet className="h-5 w-5 mx-auto mb-2 text-purple-600" />
              Trial Balance
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="min-h-[500px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        <div
          contentEditable
          className="outline-none min-h-[500px] prose prose-sm max-w-none dark:prose-invert"
          placeholder="Start writing your narrative report..."
          onInput={(e) => setContent(e.target.textContent)}
        >
          <p>Welcome to the Narrative Reporting workspace. Start by typing your content here...</p>
          <p>You can embed financial data, charts, and tables using the toolbar above.</p>
          <p>Example: "Total Assets grew to @[FS.TotalAssets] ($2.5M, up 15% YoY)."</p>
        </div>
      </div>
    </div>
  )
}

// Document Creation Modal Component
const DocumentCreationModal = ({ onClose, onDocumentCreated, templates }) => {
  const [documentName, setDocumentName] = useState('')
  const [documentType, setDocumentType] = useState('annual')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [collaborators, setCollaborators] = useState([])

  const handleCreate = () => {
    if (!documentName.trim()) return

    const newDocument = {
      id: Date.now(),
      name: documentName,
      type: documentType,
      status: 'active',
      lastModified: new Date().toISOString().split('T')[0],
      collaborators: collaborators.length,
      template: selectedTemplate
    }

    onDocumentCreated(newDocument)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Document</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document Name
            </label>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter document name..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="annual">Annual Report</option>
              <option value="quarterly">Quarterly Report</option>
              <option value="board">Board Pack</option>
              <option value="esg">ESG Report</option>
              <option value="audit">Audit Report</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template (Optional)
            </label>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find(t => t.id === parseInt(e.target.value))
                setSelectedTemplate(template)
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">No template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!documentName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Document
          </button>
        </div>
      </div>
    </div>
  )
}

export default NarrativeReporting
