import React from 'react'
import { BookOpen, Calculator, TrendingUp, Shield, FileText, Database } from 'lucide-react'

const AccountPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6">
            <BookOpen className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Account Management
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Advanced chart of accounts with intelligent categorization and IFRS compliance
          </p>
        </div>

        {/* Coming Soon Badge */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-lg font-semibold shadow-lg">
            <Calculator className="w-5 h-5 mr-2" />
            Coming Soon - Q1 2025
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Smart Account Hierarchy
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Intelligent account categorization with automatic grouping and nesting
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              IFRS Compliance
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Built-in IFRS standards with automatic compliance checking
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Account Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Advanced analytics and reporting for account performance
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
              <Calculator className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Auto-Balancing
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Automatic account balancing and reconciliation features
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Account Templates
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Pre-built account structures for different industries
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Data Validation
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Real-time data validation and error detection
            </p>
          </div>
        </div>

        {/* Account Structure Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Account Structure Preview
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assets</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  1000 - Current Assets
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-4">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  1100 - Cash & Cash Equivalents
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-4">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  1200 - Accounts Receivable
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  2000 - Non-Current Assets
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liabilities & Equity</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  3000 - Current Liabilities
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-4">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  3100 - Accounts Payable
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-4">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  3200 - Short-term Debt
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  4000 - Shareholders' Equity
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-8 border border-emerald-200 dark:border-emerald-800">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Transform Your Chart of Accounts
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Our Account Management module will revolutionize how you organize, categorize, and manage your financial accounts 
            with intelligent automation and IFRS compliance built-in.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors">
              Join Waitlist
            </button>
            <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-semibold transition-colors">
              View Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountPage
