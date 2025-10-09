import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Building2, 
  Shield, 
  Users, 
  Leaf, 
  ClipboardList, 
  ShoppingCart, 
  TrendingUp, 
  Handshake,
  Search,
  Settings,
  Bell,
  Star,
  Clock,
  Grid3X3,
  ExternalLink,
  RefreshCw,
  Play,
  Square,
  Activity,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  X,
  Menu,
  Home,
  LogOut,
  User
} from 'lucide-react'

const IntegrationHub = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [apps, setApps] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [notifications, setNotifications] = useState(3)

  // Integration apps configuration
  const integrationApps = [
    {
      id: 1,
      name: 'Asset Management',
      description: 'Track and manage company assets',
      icon: Building2,
      iconBg: 'bg-blue-500',
      status: 'online',
      metrics: '1,247 assets • $2.1M value',
      url: '/integrations/asset-management',
      category: 'operations',
      port: 3001,
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      favorite: true
    },
    {
      id: 2,
      name: 'Compliance Management',
      description: 'Regulatory compliance and controls',
      icon: Shield,
      iconBg: 'bg-green-500',
      status: 'online',
      metrics: '98% compliance rate',
      url: '/integrations/compliance-management',
      category: 'governance',
      port: 3002,
      lastUsed: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      favorite: false
    },
    {
      id: 3,
      name: 'CRM',
      description: 'Customer relationship management',
      icon: Users,
      iconBg: 'bg-purple-500',
      status: 'online',
      metrics: '2,450 contacts',
      url: '/integrations/crm',
      category: 'sales',
      port: 3003,
      lastUsed: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      favorite: true
    },
    {
      id: 4,
      name: 'ESG',
      description: 'Environmental, Social & Governance',
      icon: Leaf,
      iconBg: 'bg-emerald-500',
      status: 'online',
      metrics: '85% ESG score',
      url: '/integrations/esg',
      category: 'sustainability',
      port: 3004,
      lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      favorite: false
    },
    {
      id: 5,
      name: 'Project Management',
      description: 'Project planning and execution',
      icon: ClipboardList,
      iconBg: 'bg-orange-500',
      status: 'online',
      metrics: '24 active projects',
      url: '/integrations/project-management',
      category: 'operations',
      port: 3005,
      lastUsed: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      favorite: true
    },
    {
      id: 6,
      name: 'Purchase Order Management',
      description: 'Procurement and order tracking',
      icon: ShoppingCart,
      iconBg: 'bg-red-500',
      status: 'offline',
      metrics: '156 pending orders',
      url: '/integrations/purchase-order-management',
      category: 'operations',
      port: 3006,
      lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      favorite: false
    },
    {
      id: 7,
      name: 'Revenue Analytics',
      description: 'Revenue tracking and analysis',
      icon: TrendingUp,
      iconBg: 'bg-indigo-500',
      status: 'online',
      metrics: '$5.2M revenue',
      url: '/integrations/revenue-analytics',
      category: 'analytics',
      port: 3007,
      lastUsed: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      favorite: false
    },
    {
      id: 8,
      name: 'Stakeholder Management',
      description: 'Stakeholder engagement and communication',
      icon: Handshake,
      iconBg: 'bg-teal-500',
      status: 'offline',
      metrics: '89 stakeholders',
      url: '/integrations/stakeholder-management',
      category: 'governance',
      port: 3008,
      lastUsed: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      favorite: false
    },
    {
      id: 9,
      name: 'Role Management',
      description: 'User roles, permissions, and access control',
      icon: User,
      iconBg: 'bg-slate-500',
      status: 'online',
      metrics: '24 roles • 156 users',
      url: '/integrations/role-management',
      category: 'governance',
      port: 3009,
      lastUsed: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      favorite: false
    }
  ]

  const [filteredApps, setFilteredApps] = useState(integrationApps)

  useEffect(() => {
    filterApps()
  }, [searchQuery, selectedCategory])

  const filterApps = () => {
    let filtered = integrationApps

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(app => app.category === selectedCategory)
    }

    setFilteredApps(filtered)
  }

  const launchApp = async (app) => {
    setIsLoading(true)
    
    try {
      // Add launch animation
      const element = document.getElementById(`app-${app.id}`)
      if (element) {
        element.style.transform = 'scale(0.95)'
        setTimeout(() => {
          element.style.transform = ''
        }, 150)
      }

      // Update last used time
      const updatedApps = integrationApps.map(a => 
        a.id === app.id ? { ...a, lastUsed: new Date() } : a
      )
      setApps(updatedApps)

      // Navigate to the app using React Router
      navigate(app.url)
    } catch (error) {
      console.error('Error launching app:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshIntegrations = async () => {
    setIsLoading(true)
    
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Show success notification
      showNotification('Integration status refreshed successfully!', 'success')
    } catch (error) {
      showNotification('Failed to refresh integrations', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (message, type = 'info') => {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      'bg-blue-500'
    }`
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
        <span>${message}</span>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // Animate in
    notification.style.transform = 'translateX(100%)'
    notification.style.transition = 'transform 0.3s ease'
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'offline':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-600'
      case 'offline':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatLastUsed = (date) => {
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return `${Math.floor(minutes / 1440)}d ago`
  }

  const categories = [
    { id: 'all', name: 'All Apps', icon: Grid3X3 },
    { id: 'operations', name: 'Operations', icon: Building2 },
    { id: 'sales', name: 'Sales', icon: Users },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'governance', name: 'Governance', icon: Shield },
    { id: 'sustainability', name: 'Sustainability', icon: Leaf }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-60 right-15 w-32 h-32 bg-white/5 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-60 right-10 w-24 h-24 bg-white/5 rounded-full animate-pulse delay-3000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
      }}></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-white/80 hover:text-white transition-colors duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-4xl font-bold text-white">Integration Hub</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  type="text" 
                  placeholder="Search integrations..." 
                  className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-6 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400 w-80 transition-all duration-300 focus:scale-105"
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
              </div>
              
              {/* Settings */}
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="text-white/80 hover:text-white transition-colors duration-300"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 pb-32">
          {/* Stats Overview */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Total Apps</p>
                    <p className="text-3xl font-bold">9</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-300" />
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Active</p>
                    <p className="text-3xl font-bold text-green-400">7</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-300" />
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Offline</p>
                    <p className="text-3xl font-bold text-red-400">2</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-300" />
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">Last Sync</p>
                    <p className="text-lg font-bold">2 min ago</p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-yellow-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const IconComponent = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* App Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredApps.map((app, index) => {
              const IconComponent = app.icon
              return (
                <div
                  key={app.id}
                  id={`app-${app.id}`}
                  className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white text-center cursor-pointer transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:-translate-y-2 border border-white/20"
                  onClick={() => launchApp(app)}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {/* Status Indicator */}
                  <div className="flex justify-end mb-2">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(app.status)}
                      <span className={`text-xs ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* App Icon */}
                  <div className="mb-4 flex justify-center">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${app.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  {/* App Name */}
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-300 transition-colors">
                    {app.name}
                  </h3>
                  
                  {/* App Description */}
                  <p className="text-white/70 text-sm mb-4">
                    {app.description}
                  </p>
                  
                  {/* App Metrics */}
                  <div className="text-xs text-white/60 space-y-1">
                    <div>{app.metrics}</div>
                    <div className="flex justify-between">
                      <span>Last used:</span>
                      <span>{formatLastUsed(app.lastUsed)}</span>
                    </div>
                    {app.favorite && (
                      <div className="flex justify-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      </div>
                    )}
                  </div>
                  
                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              )
            })}
          </div>
        </main>

        {/* Dock */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-3 flex gap-4 z-50">
          <button 
            onClick={() => setSelectedCategory('all')}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
            title="All Apps"
          >
            <Grid3X3 className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => setFilteredApps(integrationApps.filter(app => app.favorite))}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
            title="Favorites"
          >
            <Star className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => setFilteredApps(integrationApps.sort((a, b) => b.lastUsed - a.lastUsed))}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
            title="Recent"
          >
            <Clock className="w-6 h-6" />
          </button>
          
          <button 
            onClick={refreshIntegrations}
            className="relative w-12 h-12 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
            title="Notifications"
          >
            <Bell className="w-6 h-6" />
            {notifications > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                {notifications}
              </div>
            )}
          </button>
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
            title="Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Settings</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Dark Mode</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Notifications</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Auto Sync</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Animations</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
              </div>
              
              <button 
                onClick={() => setShowSettings(false)}
                className="mt-6 w-full bg-blue-600/80 hover:bg-blue-600 text-white py-3 rounded-xl transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .toggle {
          appearance: none;
          width: 48px;
          height: 24px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .toggle:checked {
          background: #3b82f6;
        }
        
        .toggle::before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: transform 0.3s;
        }
        
        .toggle:checked::before {
          transform: translateX(24px);
        }
      `}</style>
    </div>
  )
}

export default IntegrationHub
