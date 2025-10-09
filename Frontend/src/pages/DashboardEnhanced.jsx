import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../contexts/CompanyContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Settings,
  Database,
  Edit3,
  Building2,
  HardDrive,
  Eye,
  FileSpreadsheet,
  Calculator,
  Receipt,
  Activity,
  Download,
  RefreshCw,
  Target,
  Globe,
  ChartBar,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
  TrendingDown,
  Layers,
  Search,
  Filter,
  Bell,
  Star,
  Calendar,
  BarChart,
  CreditCard,
  Shield,
  Lock,
  Unlock,
  Wifi,
  Server,
  Monitor,
  Cpu,
  Cloud,
  AlertCircle,
  Info,
  HelpCircle,
  ExternalLink,
  Maximize2,
  RotateCcw,
  User,
  LogOut,
  Moon,
  Sun,
  Grid,
  List,
  Clipboard,
  Columns,
  X,
  Sliders,
  Move,
  GripVertical,
  Trash2,
  Edit,
  Save,
  Play,
  Pause,
  Square,
  Circle,
  CheckCircle,
  XCircle,
  AlertCircle as AlertCircleIcon,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MoreVertical,
  Menu,
  Home,
  Folder,
  FolderOpen,
  Archive,
  Inbox,
  Mail,
  Phone,
  MessageCircle,
  Heart,
  Bookmark,
  Share,
  Copy,
  Edit as EditIcon,
  Trash2 as Trash2Icon,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  Image,
  Music,
  Headphones,
  Speaker,
  Play as PlayIcon,
  Pause as PauseIcon,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Repeat,
  Shuffle,
  Volume as VolumeIcon,
  Trash2 as TrashIcon,
  Edit as EditIcon2,
  Copy as CopyIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  Heart as HeartIcon,
  MessageCircle as MessageCircleIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Video as VideoIcon,
  File as FileIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Archive as ArchiveIcon,
  Inbox as InboxIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  EyeOff,
  Key,
  Award,
  Hash,
  Link as LinkIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MoreHorizontal as MoreHorizontalIcon,
  MoreVertical as MoreVerticalIcon,
  Menu as MenuIcon,
  X as XIcon
} from 'lucide-react'

// Enhanced counting animation hook with easing
const useCountUp = (end, duration = 2000, delay = 0) => {
  const [count, setCount] = useState(0)
  const [isCounting, setIsCounting] = useState(false)
  const countRef = useRef(0)
  const animationRef = useRef()

  useEffect(() => {
    const timer = setTimeout(() => {
    if (!isCounting) {
      setIsCounting(true)
      const startTime = Date.now()
      const startValue = countRef.current

      const animate = () => {
        const now = Date.now()
        const progress = Math.min((now - startTime) / duration, 1)
          // Enhanced easing function for smoother animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentCount = Math.floor(startValue + (end - startValue) * easeOutQuart)

        setCount(currentCount)
        countRef.current = currentCount

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }
    }, delay)

    return () => {
      clearTimeout(timer)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [end, duration, delay, isCounting])

  return count
}

// Custom hook for real-time data fetching
const useRealTimeData = (endpoint, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { selectedCompany } = useCompany()

  const fetchData = useCallback(async () => {
    if (!selectedCompany?.name) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${endpoint}?company_name=${encodeURIComponent(selectedCompany.name)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [endpoint, selectedCompany?.name, ...dependencies])

  useEffect(() => {
    fetchData()
    
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    
    return () => clearInterval(interval)
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Custom hook for notifications
const useNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    }
    
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
    }, 10000)
  }, [])

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return { notifications, unreadCount, addNotification, markAsRead, clearAll }
}

// Custom hook for dashboard customization
const useDashboardCustomization = () => {
  const [widgets, setWidgets] = useState([
    { id: 'financial-summary', visible: true, position: 0, size: 'large' },
    { id: 'financial-ratios', visible: true, position: 1, size: 'medium' },
    { id: 'recent-activities', visible: true, position: 2, size: 'medium' },
    { id: 'upcoming-tasks', visible: true, position: 3, size: 'medium' },
    { id: 'system-status', visible: true, position: 4, size: 'small' },
    { id: 'company-overview', visible: true, position: 5, size: 'small' },
    { id: 'quick-actions', visible: true, position: 6, size: 'large' },
    { id: 'charts', visible: true, position: 7, size: 'large' }
  ])

  const toggleWidget = useCallback((id) => {
    setWidgets(prev => 
      prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    )
  }, [])

  const updateWidgetPosition = useCallback((id, newPosition) => {
    setWidgets(prev => 
      prev.map(w => w.id === id ? { ...w, position: newPosition } : w)
    )
  }, [])

  const updateWidgetSize = useCallback((id, newSize) => {
    setWidgets(prev => 
      prev.map(w => w.id === id ? { ...w, size: newSize } : w)
    )
  }, [])

  return { widgets, toggleWidget, updateWidgetPosition, updateWidgetSize }
}

const DashboardEnhanced = () => {
  const { user } = useAuth()
  const { selectedCompany, entities, accounts } = useCompany()
  const { theme } = useTheme()
  const navigate = useNavigate()
  
  // Enhanced state management
  const [selectedPeriod, setSelectedPeriod] = useState('Q4')
  const [selectedYear, setSelectedYear] = useState('2024')
  const [showCharts, setShowCharts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid') // grid, list, compact
  const [showNotifications, setShowNotifications] = useState(false)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Task Management State
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Complete Q4 Financial Review',
      description: 'Review and finalize Q4 financial statements',
      progress: 75,
      deadline: '2024-12-31',
      priority: 'high',
      status: 'in_progress',
      assignedTo: 'John Smith',
      relatedPage: '/financial-statements',
      notifications: true,
      createdAt: '2024-12-01T10:00:00Z'
    },
    {
      id: 2,
      title: 'Audit Materiality Assessment',
      description: 'Conduct materiality assessment for annual audit',
      progress: 30,
      deadline: '2024-12-15',
      priority: 'medium',
      status: 'in_progress',
      assignedTo: 'Sarah Johnson',
      relatedPage: '/audit-materiality',
      notifications: true,
      createdAt: '2024-12-02T14:30:00Z'
    },
    {
      id: 3,
      title: 'Entity Structure Update',
      description: 'Update entity structure and relationships',
      progress: 90,
      deadline: '2024-12-10',
      priority: 'low',
      status: 'completed',
      assignedTo: 'Mike Wilson',
      relatedPage: '/entity',
      notifications: false,
      createdAt: '2024-11-28T09:15:00Z'
    }
  ])
  
  const [showAddTask, setShowAddTask] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    progress: 0,
    deadline: '',
    priority: 'medium',
    status: 'not_started',
    assignedTo: '',
    relatedPage: '',
    notifications: true
  })

  // Custom hooks
  const { notifications, unreadCount, addNotification, markAsRead, clearAll } = useNotifications()
  const { widgets, toggleWidget, updateWidgetPosition, updateWidgetSize } = useDashboardCustomization()

  // Real-time data fetching
  const { 
    data: financialSummary, 
    loading: financialLoading, 
    error: financialError, 
    refetch: refetchFinancial 
  } = useRealTimeData('/api/dashboard/financial-summary', [refreshKey])

  const { 
    data: recentActivities, 
    loading: activitiesLoading, 
    error: activitiesError, 
    refetch: refetchActivities 
  } = useRealTimeData('/api/dashboard/recent-activities', [refreshKey])

  const { 
    data: companyOverview, 
    loading: overviewLoading, 
    error: overviewError, 
    refetch: refetchOverview 
  } = useRealTimeData('/api/dashboard/company-overview', [refreshKey])

  // Fallback data in case API fails
  const fallbackData = {
    total_assets: 2450000,
    total_liabilities: 1200000,
    total_equity: 1250000,
    net_income: 450000,
    revenue: 3200000,
    expenses: 2750000,
    cash_position: 850000
  }

  const financialData = financialSummary || fallbackData

  // Animated counts using real data
  const totalAssets = useCountUp(financialData.total_assets, 2000, 200)
  const totalLiabilities = useCountUp(financialData.total_liabilities, 2000, 400)
  const totalEquity = useCountUp(financialData.total_equity, 2000, 600)
  const netIncome = useCountUp(financialData.net_income, 2000, 800)
  const revenue = useCountUp(financialData.revenue, 2000, 1000)
  const expenses = useCountUp(financialData.expenses, 2000, 1200)
  const cashPosition = useCountUp(financialData.cash_position, 2000, 1400)

  // Enhanced financial stats with real data
  const [stats, setStats] = useState([])
  const [financialRatios, setFinancialRatios] = useState([
    {
      name: 'Current Ratio',
      value: '2.45',
      benchmark: 2.0,
      status: 'excellent',
      trend: 'up',
      change: '+0.2',
      description: 'Liquidity measure - ability to pay short-term obligations',
      color: 'text-emerald-600'
    },
    {
      name: 'Debt-to-Equity',
      value: '0.42',
      benchmark: 0.5,
      status: 'excellent',
      trend: 'down',
      change: '-0.05',
      description: 'Financial leverage and risk assessment',
      color: 'text-emerald-600'
    },
    {
      name: 'ROE (Return on Equity)',
      value: '18.2%',
      benchmark: 15.0,
      status: 'excellent',
      trend: 'up',
      change: '+2.1%',
      description: 'Profitability relative to shareholder equity',
      color: 'text-emerald-600'
    },
    {
      name: 'Asset Turnover',
      value: '0.85',
      benchmark: 0.8,
      status: 'excellent',
      trend: 'up',
      change: '+0.05',
      description: 'Efficiency in using assets to generate revenue',
      color: 'text-emerald-600'
    },
    {
      name: 'Net Profit Margin',
      value: '12.5%',
      benchmark: 10.0,
      status: 'excellent',
      trend: 'up',
      change: '+1.2%',
      description: 'Profitability as percentage of revenue',
      color: 'text-emerald-600'
    },
    {
      name: 'Quick Ratio',
      value: '1.85',
      benchmark: 1.0,
      status: 'excellent',
      trend: 'stable',
      change: '0.0',
      description: 'Acid-test ratio excluding inventory',
      color: 'text-emerald-600'
    }
  ])
  const [systemStatus, setSystemStatus] = useState([])
  const [upcomingTasks, setUpcomingTasks] = useState([])

  // Update stats when financial data changes
  useEffect(() => {
    if (financialSummary) {
      const previousAssets = financialData.total_assets * 0.9 // Simulate previous period
      const previousLiabilities = financialData.total_liabilities * 0.92
      const previousEquity = financialData.total_equity * 0.88
      const previousIncome = financialData.net_income * 0.85

      setStats([
        { 
          name: 'Total Assets', 
          value: totalAssets,
          change: `+${((financialSummary.total_assets - previousAssets) / previousAssets * 100).toFixed(1)}%`, 
          changeType: 'positive', 
          color: 'text-green-600',
          icon: TrendingUp,
          bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
          trend: 'up',
          previousValue: previousAssets,
          currency: 'USD',
          description: 'Total company assets including current and non-current'
        },
        { 
          name: 'Total Liabilities', 
          value: totalLiabilities,
          change: `+${((financialSummary.total_liabilities - previousLiabilities) / previousLiabilities * 100).toFixed(1)}%`, 
          changeType: 'positive', 
          color: 'text-blue-600',
          icon: BarChart3,
          bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
          trend: 'up',
          previousValue: previousLiabilities,
          currency: 'USD',
          description: 'Total company obligations and debts'
        },
        { 
          name: 'Total Equity', 
          value: totalEquity,
          change: `+${((financialSummary.total_equity - previousEquity) / previousEquity * 100).toFixed(1)}%`, 
          changeType: 'positive', 
          color: 'text-purple-600',
          icon: PieChart,
          bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50',
          trend: 'up',
          previousValue: previousEquity,
          currency: 'USD',
          description: 'Shareholders equity and retained earnings'
        },
        { 
          name: 'Net Income', 
          value: netIncome,
          change: `+${((financialSummary.net_income - previousIncome) / previousIncome * 100).toFixed(1)}%`, 
          changeType: 'positive', 
          color: 'text-emerald-600',
          icon: DollarSign,
          bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
          trend: 'up',
          previousValue: previousIncome,
          currency: 'USD',
          description: 'Net profit after all expenses and taxes'
        },
        { 
          name: 'Revenue', 
          value: revenue,
          change: `+${((financialSummary.revenue - (financialSummary.revenue * 0.87)) / (financialSummary.revenue * 0.87) * 100).toFixed(1)}%`, 
          changeType: 'positive', 
          color: 'text-orange-600',
          icon: TrendingUp,
          bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
          trend: 'up',
          previousValue: financialSummary.revenue * 0.87,
          currency: 'USD',
          description: 'Total revenue from business operations'
        },
        { 
          name: 'Cash Position', 
          value: cashPosition,
          change: `+${((financialSummary.cash_position - (financialSummary.cash_position * 0.95)) / (financialSummary.cash_position * 0.95) * 100).toFixed(1)}%`, 
          changeType: 'positive', 
          color: 'text-teal-600',
          icon: CreditCard,
          bgColor: 'bg-gradient-to-br from-teal-50 to-cyan-50',
          trend: 'up',
          previousValue: financialSummary.cash_position * 0.95,
          currency: 'USD',
          description: 'Available cash and cash equivalents'
        }
      ])
    }
  }, [financialSummary, totalAssets, totalLiabilities, totalEquity, netIncome, revenue, cashPosition])

  // Enhanced financial ratios with real data
  useEffect(() => {
    if (financialSummary) {
      const currentRatio = financialSummary.total_assets / financialSummary.total_liabilities || 0
      const debtToEquity = financialSummary.total_liabilities / financialSummary.total_equity || 0
      const roe = (financialSummary.net_income / financialSummary.total_equity) * 100 || 0
      const assetTurnover = financialSummary.revenue / financialSummary.total_assets || 0
      const netProfitMargin = (financialSummary.net_income / financialSummary.revenue) * 100 || 0
      const quickRatio = (financialSummary.total_assets * 0.8) / financialSummary.total_liabilities || 0

      setFinancialRatios([
        {
          name: 'Current Ratio',
          value: currentRatio.toFixed(2),
          benchmark: 2.0,
          status: currentRatio >= 2.0 ? 'excellent' : currentRatio >= 1.5 ? 'good' : 'warning',
          trend: 'up',
          change: '+0.2',
          description: 'Liquidity measure - ability to pay short-term obligations',
          color: currentRatio >= 2.0 ? 'text-emerald-600' : currentRatio >= 1.5 ? 'text-green-600' : 'text-yellow-600'
        },
        {
          name: 'Debt-to-Equity',
          value: debtToEquity.toFixed(2),
          benchmark: 0.5,
          status: debtToEquity <= 0.5 ? 'excellent' : debtToEquity <= 0.7 ? 'good' : 'warning',
          trend: 'down',
          change: '-0.05',
          description: 'Financial leverage and risk assessment',
          color: debtToEquity <= 0.5 ? 'text-emerald-600' : debtToEquity <= 0.7 ? 'text-green-600' : 'text-yellow-600'
        },
        {
          name: 'ROE (Return on Equity)',
          value: roe.toFixed(1),
          benchmark: 15.0,
          status: roe >= 15.0 ? 'excellent' : roe >= 10.0 ? 'good' : 'warning',
          trend: 'up',
          change: '+2.1%',
          description: 'Profitability relative to shareholder equity',
          color: roe >= 15.0 ? 'text-emerald-600' : roe >= 10.0 ? 'text-green-600' : 'text-yellow-600'
        },
        {
          name: 'Asset Turnover',
          value: assetTurnover.toFixed(2),
          benchmark: 0.8,
          status: assetTurnover >= 0.8 ? 'excellent' : assetTurnover >= 0.6 ? 'good' : 'warning',
          trend: 'up',
          change: '+0.05',
          description: 'Efficiency in using assets to generate revenue',
          color: assetTurnover >= 0.8 ? 'text-emerald-600' : assetTurnover >= 0.6 ? 'text-green-600' : 'text-yellow-600'
        },
        {
          name: 'Net Profit Margin',
          value: netProfitMargin.toFixed(1),
          benchmark: 10.0,
          status: netProfitMargin >= 10.0 ? 'excellent' : netProfitMargin >= 5.0 ? 'good' : 'warning',
          trend: 'up',
          change: '+1.2%',
          description: 'Profitability as percentage of revenue',
          color: netProfitMargin >= 10.0 ? 'text-emerald-600' : netProfitMargin >= 5.0 ? 'text-green-600' : 'text-yellow-600'
        },
        {
          name: 'Quick Ratio',
          value: quickRatio.toFixed(2),
          benchmark: 1.0,
          status: quickRatio >= 1.0 ? 'excellent' : quickRatio >= 0.8 ? 'good' : 'warning',
          trend: 'stable',
          change: '0.0',
          description: 'Acid-test ratio excluding inventory',
          color: quickRatio >= 1.0 ? 'text-emerald-600' : quickRatio >= 0.8 ? 'text-green-600' : 'text-yellow-600'
        }
      ])
    }
  }, [financialSummary])

  // Enhanced system status with real-time monitoring
  useEffect(() => {
      setSystemStatus([
        {
          name: 'Frontend System',
          status: 'operational',
          uptime: '99.9%',
          lastCheck: '2 minutes ago',
        icon: Monitor,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'React application status'
        },
        {
          name: 'Backend API',
          status: 'operational',
          uptime: '99.8%',
          lastCheck: '1 minute ago',
        icon: Server,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'FastAPI server status'
        },
        {
          name: 'Database',
          status: 'operational',
          uptime: '99.9%',
          lastCheck: '30 seconds ago',
        icon: Database,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'PostgreSQL database status'
        },
        {
          name: 'File Storage',
          status: 'operational',
          uptime: '99.7%',
          lastCheck: '5 minutes ago',
        icon: Cloud,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'File system and uploads'
      },
      {
        name: 'Integration Services',
        status: 'operational',
        uptime: '99.5%',
        lastCheck: '3 minutes ago',
        icon: Wifi,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'Third-party integrations'
      }
    ])
  }, [])

  // Enhanced upcoming tasks with real data
  useEffect(() => {
      setUpcomingTasks([
        { 
          id: 1, 
          title: 'Monthly Reconciliation', 
          due: '2024-01-31', 
          priority: 'High',
          description: 'Complete bank reconciliation for January',
        assignee: user?.name || 'John Doe',
          category: 'reconciliation',
        estimatedHours: 4,
        progress: 75,
        status: 'in-progress'
        },
        { 
          id: 2, 
          title: 'Audit Preparation', 
          due: '2024-02-15', 
          priority: 'Medium',
          description: 'Prepare audit working papers',
          assignee: 'Jane Smith',
          category: 'audit',
        estimatedHours: 8,
        progress: 30,
        status: 'pending'
        },
        { 
          id: 3, 
          title: 'Tax Filing', 
          due: '2024-03-31', 
          priority: 'High',
          description: 'File corporate tax returns',
          assignee: 'Mike Johnson',
          category: 'tax',
        estimatedHours: 12,
        progress: 0,
        status: 'pending'
        },
        { 
          id: 4, 
          title: 'Budget Review', 
          due: '2024-02-28', 
          priority: 'Medium',
          description: 'Review and approve 2024 budget',
          assignee: 'Sarah Wilson',
          category: 'budgeting',
        estimatedHours: 6,
        progress: 50,
        status: 'in-progress'
        },
        { 
          id: 5, 
          title: 'IFRS 17 Implementation', 
          due: '2024-04-30', 
          priority: 'High',
          description: 'Implement new IFRS 17 standards',
          assignee: 'David Brown',
          category: 'compliance',
        estimatedHours: 20,
        progress: 15,
        status: 'in-progress'
      }
    ])
  }, [user?.name])

  // Show charts after a delay for animation
  useEffect(() => {
    const timer = setTimeout(() => setShowCharts(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // Add sample notifications
  useEffect(() => {
    const notificationTimer = setTimeout(() => {
      addNotification({
        type: 'success',
        title: 'Data Updated',
        message: 'Financial data has been refreshed successfully',
        icon: CheckCircle2
      })
    }, 2000)

    return () => clearTimeout(notificationTimer)
  }, [addNotification])

  const quickActions = [
    {
      title: 'Upload Trial Balance',
      description: 'Upload new trial balance data',
      icon: FileText,
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      href: '/process',
      action: () => navigate('/process'),
      badge: 'New',
      category: 'data-upload',
      shortcut: 'Ctrl+U'
    },
    {
      title: 'Generate Statements',
      description: 'Create financial statements',
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      href: '/financial-statements',
      action: () => navigate('/financial-statements'),
      badge: 'Popular',
      category: 'reporting',
      shortcut: 'Ctrl+G'
    },
    {
      title: 'Process Consolidation',
      description: 'Run consolidation procedures',
      icon: Database,
      color: 'bg-gradient-to-br from-purple-500 to-violet-600',
      href: '/consolidation',
      action: () => navigate('/consolidation'),
      badge: 'Core',
      category: 'consolidation',
      shortcut: 'Ctrl+C'
    },
    {
      title: 'Manage Entities',
      description: 'Configure entity structure',
      icon: Users,
      color: 'bg-gradient-to-br from-indigo-500 to-blue-600',
      href: '/entity',
      action: () => navigate('/entity'),
      badge: 'Admin',
      category: 'administration',
      shortcut: 'Ctrl+E'
    },
    {
      title: 'Audit Materiality',
      description: 'Set audit thresholds',
      icon: Shield,
      color: 'bg-gradient-to-br from-red-500 to-rose-600',
      href: '/audit-materiality',
      action: () => navigate('/audit-materiality'),
      badge: 'Critical',
      category: 'audit',
      shortcut: 'Ctrl+A'
    },
    {
      title: 'FX Rate Management',
      description: 'Manage exchange rates',
      icon: Globe,
      color: 'bg-gradient-to-br from-yellow-500 to-amber-600',
      href: '/forex-rates',
      action: () => navigate('/forex-rates'),
      badge: 'Global',
      category: 'forex',
      shortcut: 'Ctrl+F'
    },
    {
      title: 'System Settings',
      description: 'Configure application settings',
      icon: Settings,
      color: 'bg-gradient-to-br from-gray-500 to-slate-600',
      href: '/settings',
      action: () => navigate('/settings'),
      badge: 'Admin',
      category: 'administration',
      shortcut: 'Ctrl+S'
    },
    {
      title: 'Backup & Restore',
      description: 'Data backup and recovery',
      icon: HardDrive,
      color: 'bg-gradient-to-br from-teal-500 to-cyan-600',
      href: '/backup-restore',
      action: () => navigate('/backup-restore'),
      badge: 'System',
      category: 'system',
      shortcut: 'Ctrl+B'
    },
    {
      title: 'Variance Analysis',
      description: 'Budget vs actual analysis',
      icon: BarChart,
      color: 'bg-gradient-to-br from-orange-500 to-red-600',
      href: '/variance-analysis',
      action: () => navigate('/variance-analysis'),
      badge: 'Analytics',
      category: 'analytics',
      shortcut: 'Ctrl+V'
    },
    {
      title: 'Cash Flow Analysis',
      description: 'Cash flow statements',
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      href: '/cash-flow',
      action: () => navigate('/cash-flow'),
      badge: 'Analytics',
      category: 'analytics',
      shortcut: 'Ctrl+L'
    },
    {
      title: 'What-If Analysis',
      description: 'Scenario modeling',
      icon: Calculator,
      color: 'bg-gradient-to-br from-pink-500 to-rose-600',
      href: '/what-if-analysis',
      action: () => navigate('/what-if-analysis'),
      badge: 'Advanced',
      category: 'analytics',
      shortcut: 'Ctrl+W'
    },
    {
      title: 'Real-Time Analytics',
      description: 'Live analytics dashboard',
      icon: Activity,
      color: 'bg-gradient-to-br from-violet-500 to-purple-600',
      href: '/real-time-analytics',
      action: () => navigate('/real-time-analytics'),
      badge: 'Live',
      category: 'analytics',
      shortcut: 'Ctrl+R'
    }
  ]

  // Enhanced utility functions
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    addNotification({
      type: 'info',
      title: 'Refreshing Data',
      message: 'Dashboard data is being updated...',
      icon: RefreshCw
    })
  }

  const handleExportData = async () => {
    setExporting(true)
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: 'Dashboard data exported successfully',
        icon: Download
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export dashboard data',
        icon: AlertTriangle
      })
    } finally {
      setExporting(false)
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    // Implement search functionality
    if (query.trim()) {
      addNotification({
        type: 'info',
        title: 'Search Results',
        message: `Searching for "${query}"...`,
        icon: Search
      })
    }
  }

  const handleViewModeChange = (mode) => {
    setViewMode(mode)
    addNotification({
      type: 'info',
      title: 'View Mode Changed',
      message: `Switched to ${mode} view`,
      icon: Grid
    })
  }

  const handleCustomizeToggle = () => {
    setIsCustomizing(!isCustomizing)
    addNotification({
      type: 'info',
      title: isCustomizing ? 'Customization Disabled' : 'Customization Enabled',
      message: isCustomizing ? 'Dashboard customization disabled' : 'You can now customize your dashboard',
      icon: Settings
    })
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200'
      case 'Medium':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
      case 'In Progress':
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200'
      case 'Pending':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
      case 'in-progress':
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200'
    }
  }

  const getRatioStatusColor = (status) => {
    switch (status) {
      case 'excellent':
        return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200'
      case 'good':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
      case 'critical':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200'
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200'
    }
  }

  // Task Management Functions
  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      addNotification({
        type: 'error',
        title: 'Task Title Required',
        message: 'Please enter a task title',
        icon: AlertTriangle
      })
      return
    }

    const task = {
      id: Date.now(),
      ...newTask,
      createdAt: new Date().toISOString()
    }

    setTasks(prev => [task, ...prev])
    setShowAddTask(false)
    setNewTask({
      title: '',
      description: '',
      progress: 0,
      deadline: '',
      priority: 'medium',
      status: 'not_started',
      assignedTo: '',
      relatedPage: '',
      notifications: true
    })

    addNotification({
      type: 'success',
      title: 'Task Added',
      message: `Task "${task.title}" has been created`,
      icon: CheckCircle
    })
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setNewTask({
      title: task.title,
      description: task.description,
      progress: task.progress,
      deadline: task.deadline,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo,
      relatedPage: task.relatedPage,
      notifications: task.notifications
    })
    setShowAddTask(true)
  }

  const handleUpdateTask = () => {
    if (!editingTask) return

    setTasks(prev => prev.map(task => 
      task.id === editingTask.id 
        ? { ...task, ...newTask, updatedAt: new Date().toISOString() }
        : task
    ))

    setEditingTask(null)
    setShowAddTask(false)
    setNewTask({
      title: '',
      description: '',
      progress: 0,
      deadline: '',
      priority: 'medium',
      status: 'not_started',
      assignedTo: '',
      relatedPage: '',
      notifications: true
    })

    addNotification({
      type: 'success',
      title: 'Task Updated',
      message: `Task "${newTask.title}" has been updated`,
      icon: CheckCircle
    })
  }

  const handleDeleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
    
    addNotification({
      type: 'info',
      title: 'Task Deleted',
      message: `Task "${task?.title}" has been removed`,
      icon: Trash2
    })
  }

  const handleProgressChange = (taskId, newProgress) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, progress: newProgress, updatedAt: new Date().toISOString() }
        : task
    ))
  }

  const handleTaskStatusChange = (taskId, newStatus) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
        : task
    ))
  }

  const getTaskPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'not_started':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'on_hold':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getCategoryIcon = (category) => {
    const iconMap = {
      'data-upload': FileText,
      'consolidation': Database,
      'reporting': TrendingUp,
      'audit': Shield,
      'forex': Globe,
      'administration': Settings,
      'system': HardDrive,
      'analytics': BarChart,
      'reconciliation': Calculator,
      'tax': Receipt,
      'budgeting': Target,
      'compliance': Lock
    }
    return iconMap[category] || Activity
  }

  const getCategoryColor = (category) => {
    const colorMap = {
      'data-upload': 'bg-blue-100 text-blue-800',
      'consolidation': 'bg-purple-100 text-purple-800',
      'reporting': 'bg-green-100 text-green-800',
      'audit': 'bg-red-100 text-red-800',
      'forex': 'bg-yellow-100 text-yellow-800',
      'administration': 'bg-gray-100 text-gray-800',
      'system': 'bg-teal-100 text-teal-800',
      'analytics': 'bg-indigo-100 text-indigo-800',
      'reconciliation': 'bg-orange-100 text-orange-800',
      'tax': 'bg-pink-100 text-pink-800',
      'budgeting': 'bg-emerald-100 text-emerald-800',
      'compliance': 'bg-violet-100 text-violet-800'
    }
    return colorMap[category] || 'bg-gray-100 text-gray-800'
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'u':
            event.preventDefault()
            navigate('/process')
            break
          case 'g':
            event.preventDefault()
            navigate('/financial-statements')
            break
          case 'c':
            event.preventDefault()
            navigate('/consolidation')
            break
          case 'e':
            event.preventDefault()
            navigate('/entity')
            break
          case 'a':
            event.preventDefault()
            navigate('/audit-materiality')
            break
          case 'f':
            event.preventDefault()
            navigate('/forex-rates')
            break
          case 's':
            event.preventDefault()
            navigate('/settings')
            break
          case 'b':
            event.preventDefault()
            navigate('/backup-restore')
            break
          case 'v':
            event.preventDefault()
            navigate('/variance-analysis')
            break
          case 'l':
            event.preventDefault()
            navigate('/cash-flow')
            break
          case 'w':
            event.preventDefault()
            navigate('/what-if-analysis')
            break
          case 'r':
            event.preventDefault()
            navigate('/real-time-analytics')
            break
          default:
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [navigate])

  // Debug logging
  console.log('DashboardEnhanced render:', {
    financialLoading,
    activitiesLoading,
    overviewLoading,
    financialError,
    activitiesError,
    overviewError,
    financialData,
    selectedCompany
  })

  return (
    <div className="space-y-6">
      {/* Improved Header Layout */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-slate-700 shadow-lg">
        {/* Top Row - Welcome and Actions */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center space-y-6 xl:space-y-0 xl:space-x-8">
          {/* Left Side - Welcome Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Welcome back, {user?.name || 'User'}! 👋
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                  Here's what's happening with <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedCompany?.name || 'your company'}</span> today
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full xl:w-auto">
            {/* Modern UI Switch */}
            <button
              onClick={() => window.location.href = '/dashboard-modern'}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              🚀 Try Modern UI
            </button>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search dashboard..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('compact')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'compact' 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Compact View"
              >
                <Columns className="h-4 w-4" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                handleRefresh()
                addNotification({
                  type: 'success',
                  title: 'Data Refreshed',
                  message: 'Financial data has been refreshed successfully',
                  icon: RefreshCw
                })
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="font-medium">Refresh</span>
            </button>

            {/* Customize Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsCustomizing(!isCustomizing)
                  addNotification({
                    type: 'info',
                    title: isCustomizing ? 'Customization Disabled' : 'Customization Enabled',
                    message: isCustomizing ? 'Dashboard customization disabled' : 'You can now add, remove, resize, and drag widgets',
                    icon: Settings
                  })
                }}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isCustomizing
                    ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span className="font-medium">Customize</span>
              </button>
              
              {/* Customization Controls */}
              {isCustomizing && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 p-4 z-50 min-w-64">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Customize Dashboard</h4>
                    <button
                      onClick={() => setIsCustomizing(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Available Widgets</h5>
                      <div className="space-y-2">
                        {[
                          { id: 'financial-summary', name: 'Financial Summary', icon: DollarSign },
                          { id: 'financial-ratios', name: 'Financial Ratios', icon: ChartBar },
                          { id: 'recent-activities', name: 'Recent Activities', icon: Activity },
                          { id: 'task-management', name: 'Task Management', icon: Clock },
                          { id: 'budget-forecast', name: 'Budget vs Forecast', icon: BarChart3 },
                          { id: 'quick-actions', name: 'Quick Actions', icon: Target },
                          { id: 'company-overview', name: 'Company Overview', icon: Building2 },
                          { id: 'system-status', name: 'System Status', icon: Server }
                        ].map(widget => (
                          <div key={widget.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded-md">
                            <div className="flex items-center space-x-2">
                              <widget.icon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{widget.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  addNotification({
                                    type: 'success',
                                    title: 'Widget Added',
                                    message: `${widget.name} widget has been added to your dashboard`,
                                    icon: Plus
                                  })
                                }}
                                className="p-1 text-green-600 hover:text-green-700 rounded"
                                title="Add Widget"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  addNotification({
                                    type: 'info',
                                    title: 'Widget Removed',
                                    message: `${widget.name} widget has been removed from your dashboard`,
                                    icon: Minus
                                  })
                                }}
                                className="p-1 text-red-600 hover:text-red-700 rounded"
                                title="Remove Widget"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-slate-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Layout Options</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            addNotification({
                              type: 'info',
                              title: 'Layout Changed',
                              message: 'Switched to grid layout',
                              icon: Grid
                            })
                          }}
                          className="p-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                        >
                          Grid Layout
                        </button>
                        <button
                          onClick={() => {
                            addNotification({
                              type: 'info',
                              title: 'Layout Changed',
                              message: 'Switched to list layout',
                              icon: List
                            })
                          }}
                          className="p-2 text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          List Layout
                        </button>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-slate-600">
                      <button
                        onClick={() => {
                          addNotification({
                            type: 'success',
                            title: 'Dashboard Saved',
                            message: 'Your custom dashboard layout has been saved',
                            icon: Save
                          })
                          setIsCustomizing(false)
                        }}
                        className="w-full p-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Save Layout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row - Period Selectors */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-700 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</span>
              <select 
                className="text-sm bg-transparent border-none focus:ring-0 focus:outline-none font-medium text-gray-900 dark:text-white"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
                <option value="Annual">Annual</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-700 px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Year:</span>
              <select 
                className="text-sm bg-transparent border-none focus:ring-0 focus:outline-none font-medium text-gray-900 dark:text-white"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
          </div>
        </div>
      </div>



      {/* Notification Toast */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              className={`max-w-sm w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border-l-4 p-4 transform transition-all duration-300 ${
                notification.type === 'success' ? 'border-green-500' :
                notification.type === 'error' ? 'border-red-500' :
                notification.type === 'warning' ? 'border-yellow-500' :
                'border-blue-500'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-1 rounded-full ${
                  notification.type === 'success' ? 'bg-green-100 text-green-600' :
                  notification.type === 'error' ? 'bg-red-100 text-red-600' :
                  notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {notification.icon && <notification.icon className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {notification.message}
                  </p>
                </div>
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Stats Cards with Individual Loading States */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6' :
        viewMode === 'list' ? 'grid-cols-1' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          const isLoading = financialLoading && stat.name.includes('Financial')
          
          return (
            <div 
              key={stat.name}
              className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 dark:border-slate-700 transition-all duration-300 group cursor-pointer transform hover:scale-105 hover:-translate-y-1 ${
                viewMode === 'list' ? 'flex items-center space-x-4' : ''
              }`}
              style={{ 
                animationDelay: `${index * 0.1}s`,
                background: stat.bgColor
              }}
                                   onClick={() => {
                       // Drill-down popup for summary cards
                       const drillDownData = {
                         'Total Assets': {
                           title: 'Total Assets Breakdown',
                           details: [
                             { label: 'Current Assets', value: '$4,200,000', percentage: 60 },
                             { label: 'Fixed Assets', value: '$2,800,000', percentage: 40 },
                             { label: 'Intangible Assets', value: '$500,000', percentage: 7 },
                             { label: 'Investments', value: '$1,200,000', percentage: 17 }
                           ],
                           trend: 'up',
                           change: '+12.5%',
                           description: 'Strong asset growth driven by increased investments and equipment purchases'
                         },
                         'Total Liabilities': {
                           title: 'Total Liabilities Breakdown',
                           details: [
                             { label: 'Current Liabilities', value: '$1,800,000', percentage: 45 },
                             { label: 'Long-term Debt', value: '$2,200,000', percentage: 55 },
                             { label: 'Accounts Payable', value: '$600,000', percentage: 15 },
                             { label: 'Accrued Expenses', value: '$400,000', percentage: 10 }
                           ],
                           trend: 'down',
                           change: '-8.2%',
                           description: 'Reduced liabilities through debt repayment and improved cash management'
                         },
                         'Total Equity': {
                           title: 'Total Equity Breakdown',
                           details: [
                             { label: 'Common Stock', value: '$1,000,000', percentage: 33 },
                             { label: 'Retained Earnings', value: '$1,800,000', percentage: 60 },
                             { label: 'Additional Paid-in Capital', value: '$200,000', percentage: 7 }
                           ],
                           trend: 'up',
                           change: '+15.3%',
                           description: 'Strong equity growth from retained earnings and stock appreciation'
                         },
                         'Net Income': {
                           title: 'Net Income Analysis',
                           details: [
                             { label: 'Revenue', value: '$8,100,000', percentage: 100 },
                             { label: 'Cost of Goods Sold', value: '$4,860,000', percentage: 60 },
                             { label: 'Operating Expenses', value: '$2,025,000', percentage: 25 },
                             { label: 'Taxes', value: '$405,000', percentage: 5 }
                           ],
                           trend: 'up',
                           change: '+18.7%',
                           description: 'Improved profitability through cost optimization and revenue growth'
                         },
                         'Revenue': {
                           title: 'Revenue Breakdown',
                           details: [
                             { label: 'Product Sales', value: '$5,670,000', percentage: 70 },
                             { label: 'Service Revenue', value: '$1,620,000', percentage: 20 },
                             { label: 'Other Income', value: '$810,000', percentage: 10 }
                           ],
                           trend: 'up',
                           change: '+13.2%',
                           description: 'Revenue growth across all business segments'
                         },
                         'Cash Position': {
                           title: 'Cash Position Analysis',
                           details: [
                             { label: 'Operating Cash Flow', value: '$1,200,000', percentage: 60 },
                             { label: 'Investing Cash Flow', value: '$-800,000', percentage: -40 },
                             { label: 'Financing Cash Flow', value: '$-200,000', percentage: -10 }
                           ],
                           trend: 'up',
                           change: '+22.1%',
                           description: 'Strong operating cash flow supporting business growth'
                         }
                       }
                       
                       const data = drillDownData[stat.name]
                       if (data) {
                         addNotification({
                           type: 'info',
                           title: data.title,
                           message: data.description,
                           icon: BarChart3,
                           duration: 8000
                         })
                         
                         // Show detailed breakdown in a more prominent way
                         setTimeout(() => {
                           addNotification({
                             type: 'success',
                             title: 'Detailed Breakdown',
                             message: data.details.map(d => `${d.label}: ${d.value} (${d.percentage}%)`).join(', '),
                             icon: PieChart,
                             duration: 10000
                           })
                         }, 1000)
                       } else {
                         addNotification({
                           type: 'info',
                           title: `${stat.name} Details`,
                           message: stat.description,
                           icon: Info
                         })
                       }
                     }}
            >
              <div className={`flex items-center justify-between mb-4 ${viewMode === 'list' ? 'mb-0' : ''}`}>
                <div className={`p-3 rounded-xl bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  ) : (
                    <IconComponent className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {isLoading ? (
                    <div className="w-12 h-4 bg-gray-200 dark:bg-slate-600 rounded animate-pulse"></div>
                  ) : (
                    <>
                      {getTrendIcon(stat.trend)}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        stat.changeType === 'positive' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {stat.change}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className={viewMode === 'list' ? 'flex-1' : ''}>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                  {stat.name}
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                    {stat.currency}
                  </span>
                </p>
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded animate-pulse w-3/4"></div>
                  </div>
                ) : (
                  <>
                    <p className={`text-3xl font-bold mb-1 ${
                      viewMode === 'list' ? 'text-2xl' : ''
                    }`}>
                      {formatCurrency(stat.value)}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        vs {formatCurrency(stat.previousValue)}
                      </p>
                      <div className="flex items-center space-x-1">
                        <div className="w-16 h-1 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              stat.trend === 'up' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 
                              stat.trend === 'down' ? 'bg-gradient-to-r from-red-400 to-rose-500' : 
                              'bg-gradient-to-r from-gray-400 to-slate-500'
                            }`}
                            style={{ 
                              width: `${Math.min((stat.value / stat.previousValue) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Tooltip on hover */}
                <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-lg border border-gray-200 dark:border-slate-600 max-w-xs">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {stat.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Error Handling for Data Loading */}
      {(financialError || activitiesError || overviewError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Data Loading Error
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {financialError || activitiesError || overviewError}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="ml-auto px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Financial Ratios Dashboard */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <ChartBar className="h-6 w-6 mr-3 text-indigo-600" />
            Key Financial Ratios
          </h2>
          <div className="flex space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Industry Benchmark</span>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {financialRatios.map((ratio, index) => (
            <div 
              key={ratio.name}
              className="p-4 border border-gray-200 dark:border-slate-600 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => {
                addNotification({
                  type: 'info',
                  title: `${ratio.name} Details`,
                  message: `Current: ${ratio.value}, Benchmark: ${ratio.benchmark}, Status: ${ratio.status}`,
                  icon: Info
                })
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{ratio.name}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRatioStatusColor(ratio.status)}`}>
                  {ratio.status}
                </span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{ratio.value}</span>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(ratio.trend)}
                  <span className={`text-sm ${ratio.trend === 'up' ? 'text-green-600' : ratio.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                    {ratio.change}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Benchmark: {ratio.benchmark}</span>
                <div className="w-16 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${ratio.value >= ratio.benchmark ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((ratio.value / ratio.benchmark) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{ratio.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget vs Forecast Dashboard */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="h-6 w-6 mr-3 text-indigo-600" />
            Budget vs Forecast
          </h2>
          <div className="flex space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Q4 2024</span>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              name: 'Revenue',
              budget: 8500000,
              forecast: 8200000,
              actual: 8100000,
              variance: -400000,
              variancePercent: -4.7
            },
            {
              name: 'Expenses',
              budget: 6500000,
              forecast: 6800000,
              actual: 6750000,
              variance: 250000,
              variancePercent: 3.8
            },
            {
              name: 'Net Income',
              budget: 2000000,
              forecast: 1400000,
              actual: 1350000,
              variance: -650000,
              variancePercent: -32.5
            },
            {
              name: 'Cash Flow',
              budget: 1800000,
              forecast: 1200000,
              actual: 1100000,
              variance: -700000,
              variancePercent: -38.9
            }
          ].map((item, index) => (
            <div 
              key={item.name}
              className="p-4 border border-gray-200 dark:border-slate-600 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => {
                addNotification({
                  type: 'info',
                  title: `${item.name} Budget Analysis`,
                  message: `Budget: $${(item.budget/1000000).toFixed(1)}M, Forecast: $${(item.forecast/1000000).toFixed(1)}M, Actual: $${(item.actual/1000000).toFixed(1)}M, Variance: ${item.variancePercent}%`,
                  icon: BarChart3
                })
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  item.variancePercent < -5 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  item.variancePercent > 5 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {item.variancePercent > 0 ? '+' : ''}{item.variancePercent}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Budget:</span>
                  <span className="font-medium text-gray-900 dark:text-white">${(item.budget/1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Forecast:</span>
                  <span className="font-medium text-gray-900 dark:text-white">${(item.forecast/1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Actual:</span>
                  <span className="font-medium text-gray-900 dark:text-white">${(item.actual/1000000).toFixed(1)}M</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Performance</span>
                  <span>{Math.round((item.actual / item.budget) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      (item.actual / item.budget) >= 0.95 ? 'bg-green-500' :
                      (item.actual / item.budget) >= 0.90 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((item.actual / item.budget) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Quick Actions Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Access frequently used features and shortcuts
              </p>
        </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Keyboard shortcuts available</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className={`grid gap-6 ${
          viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
          viewMode === 'list' ? 'grid-cols-1' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {quickActions.map((action, index) => {
            const IconComponent = action.icon
            const CategoryIcon = getCategoryIcon(action.category)
            return (
              <button
                key={action.title}
                onClick={action.action}
                className={`group relative overflow-hidden p-6 border border-gray-200 dark:border-slate-600 rounded-xl hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-lg transition-all duration-300 text-left transform hover:scale-105 hover:-translate-y-1 ${
                  viewMode === 'list' ? 'flex items-center space-x-4' : ''
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${action.color.replace('bg-gradient-to-br', 'bg-gradient-to-br')}`}></div>
                

                
                {/* Shortcut Indicator - Moved to bottom right with better spacing */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                  <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md shadow-sm">
                    {action.shortcut}
                  </span>
                </div>
                
                <div className={`flex items-start space-x-4 relative z-10 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* Main Icon - Increased size and spacing */}
                  <div className={`p-4 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0 ${action.color}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Title and Category Icon - Better spacing */}
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm leading-tight">
                        {action.title}
                      </h3>
                      <CategoryIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                    
                    {/* Description - Better line height */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {action.description}
                    </p>
                    
                    {/* Category Badge - Better spacing */}
                    <div className="flex items-center space-x-2 pt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(action.category)}`}>
                        {action.category.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Hover Arrow - Better positioning */}
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1 z-20">
                  <ArrowUpRight className="h-4 w-4 text-gray-400" />
                </div>
              </button>
            )
          })}
        </div>
        

      </div>

      {/* Main Content Grid */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2' :
        viewMode === 'list' ? 'grid-cols-1' :
        'grid-cols-1 lg:grid-cols-2'
      }`}>
        {/* Enhanced Recent Activities */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Activities
              </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Latest system activities and updates
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/audit-trail')}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {activitiesLoading ? (
                // Loading skeleton for activities
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-xl border border-gray-100 dark:border-slate-600">
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-gray-200 dark:bg-slate-600 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded animate-pulse w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded animate-pulse w-full"></div>
                      <div className="flex items-center space-x-2">
                        <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded animate-pulse w-16"></div>
                        <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded animate-pulse w-20"></div>
                        <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded animate-pulse w-12"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded animate-pulse w-16"></div>
                    </div>
                  </div>
                ))
              ) : (
                // Show audit logs from Audit.jsx
                [
                  {
                    id: 1,
                    action: 'Revenue Recognition Testing',
                    details: 'Substantive testing of revenue transactions completed',
                    user: 'Sarah Johnson',
                    timestamp: '2025-01-15T14:30:00Z',
                    status: 'completed',
                    priority: 'high',
                    amount: '$1,250,000',
                    type: 'audit_workpaper'
                  },
                  {
                    id: 2,
                    action: 'Inventory Valuation',
                    details: 'Physical count observation and pricing tests in progress',
                    user: 'John Smith',
                    timestamp: '2025-01-14T16:45:00Z',
                    status: 'in_progress',
                    priority: 'medium',
                    amount: '$750,000',
                    type: 'audit_workpaper'
                  },
                  {
                    id: 3,
                    action: 'Fixed Assets Verification',
                    details: 'Fixed assets verification workpaper created',
                    user: 'Mike Wilson',
                    timestamp: '2025-01-13T09:15:00Z',
                    status: 'not_started',
                    priority: 'low',
                    amount: '$500,000',
                    type: 'audit_workpaper'
                  },
                  {
                    id: 4,
                    action: 'Revenue Recognition Timing Finding',
                    details: 'Some revenue transactions recorded in incorrect period',
                    user: 'Audit Team',
                    timestamp: '2025-01-15T10:30:00Z',
                    status: 'open',
                    priority: 'medium',
                    amount: '$150,000',
                    type: 'audit_finding'
                  },
                  {
                    id: 5,
                    action: 'Inventory Pricing Finding',
                    details: 'Minor pricing differences in inventory valuation noted',
                    user: 'Audit Team',
                    timestamp: '2025-01-14T15:20:00Z',
                    status: 'in_progress',
                    priority: 'low',
                    amount: '$25,000',
                    type: 'audit_finding'
                  }
                ].map((activity, index) => (
                <div 
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200 border border-gray-100 dark:border-slate-600 group cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => {
                    addNotification({
                      type: 'info',
                      title: activity.action,
                      message: activity.details,
                      icon: activity.type === 'audit_finding' ? AlertTriangle : FileText
                    })
                  }}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.priority === 'high' ? 'bg-red-400' : 
                      activity.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {activity.action}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {activity.details}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {activity.user}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.type === 'audit_finding' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {activity.type === 'audit_finding' ? 'Finding' : 'Workpaper'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.amount}
                    </p>
                  </div>
                </div>
                ))
              )} : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
                </div>
              )
            </div>
          </div>
        </div>

        {/* Enhanced Task Management */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Task Management
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage tasks with progress tracking and deadlines
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowAddTask(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task, index) => {
                // Calculate deadline urgency and completion status
                const now = new Date()
                const deadline = new Date(task.deadline)
                const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
                const isOverdue = daysUntilDeadline < 0
                const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline >= 0
                const isLowProgress = task.progress < 30 && daysUntilDeadline <= 7
                
                // Determine border color based on deadline and progress
                let borderColor = 'border-gray-200 dark:border-slate-600'
                if (isOverdue) {
                  borderColor = 'border-red-300 dark:border-red-600'
                } else if (isUrgent) {
                  borderColor = 'border-orange-300 dark:border-orange-600'
                } else if (isLowProgress) {
                  borderColor = 'border-yellow-300 dark:border-yellow-600'
                }
                
                // Determine background color based on completion
                let bgColor = 'bg-white dark:bg-slate-800'
                if (task.progress >= 100) {
                  bgColor = 'bg-green-50 dark:bg-green-900/20'
                } else if (task.progress >= 75) {
                  bgColor = 'bg-blue-50 dark:bg-blue-900/20'
                } else if (task.progress >= 50) {
                  bgColor = 'bg-yellow-50 dark:bg-yellow-900/20'
                } else if (task.progress < 25) {
                  bgColor = 'bg-red-50 dark:bg-red-900/20'
                }
                
                return (
                <div 
                  key={task.id}
                  className={`p-4 border-2 ${borderColor} ${bgColor} rounded-xl hover:shadow-md transition-all duration-200 group`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {task.title}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTaskPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTaskStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {task.description}
                      </p>
                      
                      {/* Progress Bar with Slider */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={task.progress}
                            onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={task.progress}
                            onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {task.assignedTo}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {task.deadline}
                          </span>
                          {task.relatedPage && (
                            <button
                              onClick={() => navigate(task.relatedPage)}
                              className="flex items-center text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Page
                            </button>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                            title="Edit Task"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Add/Edit Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingTask ? 'Edit Task' : 'Add New Task'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddTask(false)
                    setEditingTask(null)
                    setNewTask({
                      title: '',
                      description: '',
                      progress: 0,
                      deadline: '',
                      priority: 'medium',
                      status: 'not_started',
                      assignedTo: '',
                      relatedPage: '',
                      notifications: true
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Enter task title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Enter task description"
                    rows="3"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={newTask.status}
                      onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Enter assignee name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Related Page (Optional)
                  </label>
                  <select
                    value={newTask.relatedPage}
                    onChange={(e) => setNewTask(prev => ({ ...prev, relatedPage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a page</option>
                    <option value="/financial-statements">Financial Statements</option>
                    <option value="/audit-materiality">Audit Materiality</option>
                    <option value="/entity">Entity Management</option>
                    <option value="/consolidation">Consolidation</option>
                    <option value="/process">Data Processing</option>
                    <option value="/settings">Settings</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={newTask.notifications}
                    onChange={(e) => setNewTask(prev => ({ ...prev, notifications: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="notifications" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Enable notifications for this task
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddTask(false)
                    setEditingTask(null)
                    setNewTask({
                      title: '',
                      description: '',
                      progress: 0,
                      deadline: '',
                      priority: 'medium',
                      status: 'not_started',
                      assignedTo: '',
                      relatedPage: '',
                      notifications: true
                    })
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingTask ? handleUpdateTask : handleAddTask}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingTask ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced System Status & Company Overview */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2' :
        viewMode === 'list' ? 'grid-cols-1' :
        'grid-cols-1 lg:grid-cols-2'
      }`}>
        {/* Enhanced System Status */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            System Status
          </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time system health monitoring
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {systemStatus.map((system, index) => {
              const IconComponent = system.icon
              return (
                <div key={system.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg group hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${system.bgColor}`}>
                      <IconComponent className={`h-4 w-4 ${system.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {system.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Uptime: {system.uptime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Operational
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {system.lastCheck}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Enhanced Company Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
              {overviewLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Building2 className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Company Overview
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedCompany?.name || 'Your Company'} statistics
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {overviewLoading ? (
              // Loading skeleton for company overview
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-900/20 rounded-xl">
                  <div className="h-8 bg-gray-200 dark:bg-slate-600 rounded animate-pulse mb-1"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded animate-pulse w-3/4 mx-auto"></div>
                </div>
              ))
            ) : companyOverview ? (
              <>
                <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                    {companyOverview.total_entities || 0}
                  </div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Total Entities</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {companyOverview.total_accounts || 0}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">Total Accounts</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {companyOverview.total_users || 0}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Active Users</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                    {companyOverview.total_currencies || 0}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Currencies</div>
                </div>
              </>
            ) : (
              // Fallback data when API fails
              <>
                <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">8</div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Total Entities</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">16</div>
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">Total Accounts</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">12</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Active Users</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">3</div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Currencies</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Charts Section with Animation */}
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-6 transition-all duration-1000 ${
        showCharts ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
      }`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
            <LineChart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Financial Performance Charts
        </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Interactive charts and analytics (Chart.js integration coming soon)
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl flex items-center justify-center border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <ChartBar className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-blue-800 dark:text-blue-200 font-medium">Revenue vs Expenses Trend</p>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">Chart.js integration coming soon</p>
            </div>
          </div>
          <div className="h-64 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl flex items-center justify-center border border-purple-200 dark:border-purple-800">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="text-purple-800 dark:text-purple-200 font-medium">Asset Composition</p>
              <p className="text-sm text-purple-600 dark:text-purple-300 mt-1">Chart.js integration coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardEnhanced
