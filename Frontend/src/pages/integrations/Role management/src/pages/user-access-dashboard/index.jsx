import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import DashboardStats from './components/DashboardStats';
import UserTable from './components/UserTable';
import ActivityFeed from './components/ActivityFeed';
import SystemIntegrationPanel from './components/SystemIntegrationPanel';
import QuickActions from './components/QuickActions';

import Button from '../../components/ui/Button';

const UserAccessDashboard = () => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for dashboard stats
  const dashboardStats = {
    totalUsers: 2847,
    activeSessions: 1234,
    pendingRequests: 23,
    securityAlerts: 5,
    roleAssignments: 156,
    systemIntegrations: 8
  };

  // Mock user data
  const mockUsers = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      employeeId: "EMP001",
      department: "engineering",
      role: "admin",
      status: "active",
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000),
      riskScore: 25,
      activePermissions: 42
    },
    {
      id: 2,
      name: "Michael Chen",
      email: "michael.chen@company.com",
      employeeId: "EMP002",
      department: "marketing",
      role: "manager",
      status: "active",
      lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000),
      riskScore: 65,
      activePermissions: 28
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      email: "emily.rodriguez@company.com",
      employeeId: "EMP003",
      department: "sales",
      role: "user",
      status: "inactive",
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
      riskScore: 15,
      activePermissions: 18
    },
    {
      id: 4,
      name: "David Kim",
      email: "david.kim@company.com",
      employeeId: "EMP004",
      department: "hr",
      role: "manager",
      status: "suspended",
      lastLogin: new Date(Date.now() - 72 * 60 * 60 * 1000),
      riskScore: 85,
      activePermissions: 0
    },
    {
      id: 5,
      name: "Lisa Thompson",
      email: "lisa.thompson@company.com",
      employeeId: "EMP005",
      department: "finance",
      role: "user",
      status: "pending",
      lastLogin: new Date(Date.now() - 168 * 60 * 60 * 1000),
      riskScore: 35,
      activePermissions: 12
    },
    {
      id: 6,
      name: "James Wilson",
      email: "james.wilson@company.com",
      employeeId: "EMP006",
      department: "operations",
      role: "viewer",
      status: "active",
      lastLogin: new Date(Date.now() - 30 * 60 * 1000),
      riskScore: 10,
      activePermissions: 8
    },
    {
      id: 7,
      name: "Anna Martinez",
      email: "anna.martinez@company.com",
      employeeId: "EMP007",
      department: "engineering",
      role: "admin",
      status: "active",
      lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000),
      riskScore: 45,
      activePermissions: 38
    },
    {
      id: 8,
      name: "Robert Brown",
      email: "robert.brown@company.com",
      employeeId: "EMP008",
      department: "marketing",
      role: "user",
      status: "active",
      lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000),
      riskScore: 55,
      activePermissions: 22
    }
  ];

  // Mock activity data
  const mockActivities = [
    {
      id: 1,
      type: "login",
      user: "Sarah Johnson",
      description: "Successful login from new device",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      severity: "low",
      details: {
        ip: "192.168.1.100",
        location: "New York, NY",
        device: "Chrome on Windows"
      }
    },
    {
      id: 2,
      type: "permission",
      user: "Michael Chen",
      description: "Permission granted for Finance module",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      severity: "medium",
      details: {
        ip: "192.168.1.105",
        location: "San Francisco, CA"
      }
    },
    {
      id: 3,
      type: "security",
      user: "David Kim",
      description: "Multiple failed login attempts detected",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      severity: "high",
      details: {
        ip: "203.0.113.45",
        location: "Unknown",
        device: "Unknown"
      }
    },
    {
      id: 4,
      type: "role",
      user: "Emily Rodriguez",
      description: "Role changed from User to Manager",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      severity: "medium",
      details: {
        ip: "192.168.1.110",
        location: "Chicago, IL"
      }
    },
    {
      id: 5,
      type: "logout",
      user: "Lisa Thompson",
      description: "User logged out",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      severity: "low",
      details: {
        ip: "192.168.1.115",
        location: "Boston, MA"
      }
    }
  ];

  // Mock integration data
  const mockIntegrations = [
    {
      id: 1,
      name: "Active Directory",
      description: "Microsoft Active Directory integration",
      icon: "Building",
      status: "connected",
      lastSync: new Date(Date.now() - 30 * 60 * 1000),
      autoSync: true,
      stats: {
        totalUsers: 2847,
        syncedToday: 156,
        errors: 0
      },
      recentActivities: [
        {
          type: "success",
          message: "Synchronized 156 user accounts",
          timestamp: new Date(Date.now() - 30 * 60 * 1000)
        },
        {
          type: "success",
          message: "Updated 23 user roles",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ]
    },
    {
      id: 2,
      name: "LDAP Server",
      description: "Lightweight Directory Access Protocol",
      icon: "Server",
      status: "syncing",
      lastSync: new Date(Date.now() - 5 * 60 * 1000),
      autoSync: true,
      stats: {
        totalUsers: 1234,
        syncedToday: 89,
        errors: 2
      },
      recentActivities: [
        {
          type: "warning",
          message: "2 sync errors encountered",
          timestamp: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
          type: "success",
          message: "Synchronized 89 user accounts",
          timestamp: new Date(Date.now() - 60 * 60 * 1000)
        }
      ]
    },
    {
      id: 3,
      name: "HR Management System",
      description: "Human Resources information system",
      icon: "Users",
      status: "connected",
      lastSync: new Date(Date.now() - 60 * 60 * 1000),
      autoSync: false,
      stats: {
        totalUsers: 2847,
        syncedToday: 45,
        errors: 0
      },
      recentActivities: [
        {
          type: "success",
          message: "Employee onboarding sync completed",
          timestamp: new Date(Date.now() - 60 * 60 * 1000)
        }
      ]
    },
    {
      id: 4,
      name: "Okta SSO",
      description: "Single Sign-On identity provider",
      icon: "Shield",
      status: "error",
      lastSync: new Date(Date.now() - 6 * 60 * 60 * 1000),
      autoSync: true,
      stats: {
        totalUsers: 2847,
        syncedToday: 0,
        errors: 5
      },
      recentActivities: [
        {
          type: "error",
          message: "Connection timeout - sync failed",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
        }
      ]
    }
  ];

  const handleBulkAction = (action) => {
    setRefreshing(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log(`Performing ${action} on users:`, selectedUsers);
      setRefreshing(false);
      setSelectedUsers([]);
    }, 2000);
  };

  const handleQuickAction = (actionId) => {
    console.log(`Quick action triggered: ${actionId}`);
    // Handle quick action logic here
  };

  const handleRefreshDashboard = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Breadcrumb />
          
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                User Access Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor and manage user permissions across your organization
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleRefreshDashboard}
                loading={refreshing}
                iconName="RefreshCw"
                iconPosition="left"
              >
                Refresh
              </Button>
              <Button
                variant="default"
                iconName="Plus"
                iconPosition="left"
              >
                Add User
              </Button>
            </div>
          </div>

          {/* Dashboard Stats */}
          <DashboardStats stats={dashboardStats} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-8">
            {/* User Table - Takes up 3 columns */}
            <div className="xl:col-span-3">
              <UserTable
                users={mockUsers}
                onUserSelect={setSelectedUsers}
                selectedUsers={selectedUsers}
                onBulkAction={handleBulkAction}
              />
            </div>

            {/* Activity Feed - Takes up 1 column */}
            <div className="xl:col-span-1">
              <ActivityFeed activities={mockActivities} />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Integration Panel */}
            <SystemIntegrationPanel integrations={mockIntegrations} />

            {/* Quick Actions */}
            <QuickActions onActionClick={handleQuickAction} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserAccessDashboard;