import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useCompany } from '../../contexts/CompanyContext'
import {
  Users,
  Shield,
  Database,
  AlertTriangle,
  UserCheck,
  Activity,
  ArrowRight,
  Settings,
  FileText,
  Lock
} from 'lucide-react'
import AdminAuthWrapper from './components/AdminAuthWrapper'

const RoleManagementHub = () => {
  // ===== CONTEXT HOOKS =====
  const { selectedCompany: authSelectedCompany } = useAuth()
  const { selectedCompany: companyContextCompany } = useCompany()
  
  // Use the company from auth context as primary, fallback to company context
  const selectedCompany = authSelectedCompany || companyContextCompany

  const roleManagementPages = [
    {
      title: 'User Access Dashboard',
      description: 'Monitor and manage user permissions, view user statistics, and track active sessions',
      href: '/rolemanagement/user-access-dashboard',
      icon: Users,
      color: 'blue',
      features: ['User Statistics', 'Active Sessions', 'Permission Overview', 'User Management']
    },
    {
      title: 'Role Profile Management',
      description: 'Create, edit, and manage user roles with granular permission assignments',
      href: '/rolemanagement/role-profile-management',
      icon: Shield,
      color: 'green',
      features: ['Create Roles', 'Edit Permissions', 'Role Templates', 'Permission Groups']
    },
    {
      title: 'Permission Matrix Management',
      description: 'Visual matrix for detailed permission configuration across all roles and modules',
      href: '/rolemanagement/permission-matrix-management',
      icon: Database,
      color: 'purple',
      features: ['Permission Matrix', 'Bulk Updates', 'Module Permissions', 'Access Control']
    },
    {
      title: 'Compliance & Audit Center',
      description: 'Monitor system activities, track compliance, and review audit logs',
      href: '/rolemanagement/compliance-audit-center',
      icon: FileText,
      color: 'orange',
      features: ['Audit Logs', 'Compliance Reports', 'Activity Monitoring', 'Security Events']
    },
    {
      title: 'Access Request Workflow',
      description: 'Review and manage user access requests, approvals, and role change workflows',
      href: '/rolemanagement/access-request-workflow',
      icon: UserCheck,
      color: 'indigo',
      features: ['Access Requests', 'Approval Workflow', 'Request History', 'Notifications']
    },
    {
      title: 'System Integration Monitor',
      description: 'Monitor database connections, system health, and integration status',
      href: '/rolemanagement/system-integration-monitor',
      icon: Activity,
      color: 'teal',
      features: ['Database Health', 'Connection Status', 'System Metrics', 'Integration Logs']
    }
  ]

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
        icon: 'text-blue-600 dark:text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/30',
        icon: 'text-green-600 dark:text-green-400',
        button: 'bg-green-600 hover:bg-green-700'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
        icon: 'text-purple-600 dark:text-purple-400',
        button: 'bg-purple-600 hover:bg-purple-700'
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
        icon: 'text-orange-600 dark:text-orange-400',
        button: 'bg-orange-600 hover:bg-orange-700'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        border: 'border-indigo-200 dark:border-indigo-800',
        hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
        icon: 'text-indigo-600 dark:text-indigo-400',
        button: 'bg-indigo-600 hover:bg-indigo-700'
      },
      teal: {
        bg: 'bg-teal-50 dark:bg-teal-900/20',
        border: 'border-teal-200 dark:border-teal-800',
        hover: 'hover:bg-teal-100 dark:hover:bg-teal-900/30',
        icon: 'text-teal-600 dark:text-teal-400',
        button: 'bg-teal-600 hover:bg-teal-700'
      }
    }
    return colorMap[color] || colorMap.blue
  }

  return (
    <AdminAuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
        <main className="p-6 space-y-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Role Management System
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                  Complete access control and permission management for {selectedCompany}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Manage users, roles, permissions, and monitor system security across your organization
                </p>
              </div>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roleManagementPages.map((page, index) => {
                const colors = getColorClasses(page.color)
                const Icon = page.icon
                
                return (
                  <div
                    key={index}
                    className={`${colors.bg} ${colors.border} ${colors.hover} rounded-xl border p-6 transition-all duration-200 hover:shadow-lg group`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 ${colors.bg} rounded-lg ${colors.border} border`}>
                        <Icon className={`h-6 w-6 ${colors.icon}`} />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {page.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                      {page.description}
                    </p>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Features:</h4>
                      <ul className="space-y-1">
                        {page.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <div className={`w-1.5 h-1.5 ${colors.button} rounded-full mr-2`}></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <a
                      href={page.href}
                      className={`inline-flex items-center justify-center w-full px-4 py-2 ${colors.button} text-white rounded-lg transition-colors duration-200 font-medium`}
                    >
                      Access {page.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                )
              })}
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                System Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg inline-flex mb-2">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">User Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Complete user lifecycle</p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg inline-flex mb-2">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Role-Based Access</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Granular permissions</p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg inline-flex mb-2">
                    <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Audit & Compliance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Full activity tracking</p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-teal-100 dark:bg-teal-900/20 rounded-lg inline-flex mb-2">
                    <Activity className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Real-time Monitoring</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Live system health</p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </AdminAuthWrapper>
  )
}

export default RoleManagementHub
