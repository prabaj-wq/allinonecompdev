import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Users, Shield, Database, FileText, UserCheck } from 'lucide-react'

const RoleManagementNavigation = () => {
  const location = useLocation()

  const navigationItems = [
    {
      path: '/rolemanagement',
      name: 'Hub',
      icon: Shield,
      description: 'Role Management Hub'
    },
    {
      path: '/rolemanagement/user-access-dashboard',
      name: 'User Dashboard',
      icon: Users,
      description: 'Monitor user permissions'
    },
    {
      path: '/rolemanagement/role-profile-management',
      name: 'Role Profiles',
      icon: Shield,
      description: 'Configure roles'
    },
    {
      path: '/rolemanagement/permission-matrix-management',
      name: 'Permission Matrix',
      icon: Database,
      description: 'Permission configuration'
    },
    {
      path: '/rolemanagement/compliance-audit-center',
      name: 'Compliance & Audit',
      icon: FileText,
      description: 'Monitor activities'
    },
    {
      path: '/rolemanagement/access-request-workflow',
      name: 'Access Requests',
      icon: UserCheck,
      description: 'Manage requests'
    }
  ]

  const isActive = (path) => {
    return location.pathname === path || (path === '/rolemanagement/user-access-dashboard' && location.pathname === '/rolemanagement')
  }

  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 mb-6'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-white flex items-center'>
          <Shield className='h-5 w-5 mr-2 text-blue-600 dark:text-blue-400' />
          Role Management Navigation
        </h2>
        <Link
          to='/rolemanagement'
          className='flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
        >
          Back to Hub
        </Link>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2'>
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
              <span className='text-xs font-medium text-center leading-tight'>{item.name}</span>
              <span className='text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center'>{item.description}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default RoleManagementNavigation
