import React from 'react'
import { useTwoFactor } from '../contexts/TwoFactorContext'
import TwoFactorVerification from './TwoFactorVerification'
import Layout from './Layout'
import ToastContainer from './ToastContainer'
import { Routes, Route, Navigate } from 'react-router-dom'

// Import all the page components
import DashboardEnhanced from '../pages/DashboardEnhanced'
import ModernDashboard from '../pages/ModernDashboard'
import Process from '../pages/Process'
import Consolidation from '../pages/Consolidation'
import Support from '../pages/Support'
import Profile from '../pages/Profile'
import FinancialStatements from '../pages/FinancialStatementsEnhanced'
import AssetRegister from '../pages/AssetRegister'
import BackupRestore from '../pages/BackupRestore'
import AuditMateriality from '../pages/AuditMateriality'
import Audit from '../pages/Audit'
import AuditTrail from '../pages/AuditTrail'
import Bills from '../pages/Bills'
import BankReconciliation from '../pages/BankReconciliation'
import SupplierReconciliation from '../pages/SupplierReconciliation'
import ForecastBudget from '../pages/ForecastBudget'
import IFRSTemplates from '../pages/IFRSTemplates'
import FSTItems from '../pages/FSTItems'
import ForexRates from '../pages/ForexRates'
import EntityManagement from '../pages/EntityManagement'
import AccountManagement from '../pages/AccountManagement'
import JournalEntries from '../pages/JournalEntries'
import EntityPage from '../pages/EntityPage'
import AccountPage from '../pages/AccountPage'
import TrialBalance from '../pages/TrialBalance'
import FinancialRatios from '../pages/FinancialRatios'
import CashFlow from '../pages/CashFlow'
import VarianceAnalysis from '../pages/VarianceAnalysis'
import TaxManagement from '../pages/TaxManagement'
import RegulatoryReporting from '../pages/RegulatoryReporting'
import InternalControls from '../pages/InternalControls'
import SystemMonitoring from '../pages/SystemMonitoring'
import SystemManagement from '../pages/SystemManagement'
import APIManagement from '../pages/APIManagement'
import DatabaseManagement from '../pages/DatabaseManagement'
import DataImportExport from '../pages/DataImportExport'
import ThirdPartyIntegration from '../pages/ThirdPartyIntegration'
import Documentation from '../pages/Documentation'
import Training from '../pages/Training'
import Settings from '../pages/Settings'
import IntegrationSummary from '../pages/IntegrationSummary'
import IntegrationHub from '../components/IntegrationHub'
import Workflows from '../pages/Workflows'
import GlobalCompliance from '../pages/GlobalCompliance'
import NarrativeReporting from '../pages/NarrativeReporting'
import WhatIfAnalysis from '../pages/WhatIfAnalysis'
import RealTimeAnalytics from '../pages/RealTimeAnalytics'
import HRManagementSuite from '../pages/hrmanagament'
import CustomAxes from '../pages/CustomAxes'
import ETLPage from '../components/ETLPage'
import BusinessValuation from '../pages/BusinessValuation'
import SQLQueryConsole from '../components/SQLQueryConsole'
import QuantumFinance from '../pages/QuantumFinance'
import BusinessTools from '../pages/BusinessTools'
import AxesTemplate from '../pages/AxesTemplate'
import AxesEntityEnhanced from '../pages/AxesEntityEnhanced'
import AxesAccountsEnhanced from '../pages/AxesAccountsEnhanced'
import AxesOverview from '../pages/AxesOverview'
import AxesDynamic from '../pages/AxesDynamic'
import Reports from '../pages/Reports'
import AdvancedFeatures from '../pages/AdvancedFeatures'

// Role Management Components
import RoleManagementHub from '../pages/rolemanagement/RoleManagementHub'
import UserAccessDashboard from '../pages/rolemanagement/UserAccessDashboard'
import RoleProfileManagement from '../pages/rolemanagement/RoleProfileManagement'
import PermissionMatrixManagement from '../pages/rolemanagement/PermissionMatrixManagement'
import ComplianceAuditCenter from '../pages/rolemanagement/ComplianceAuditCenter'
import AccessRequestWorkflow from '../pages/rolemanagement/AccessRequestWorkflow'
import SystemIntegrationMonitor from '../pages/rolemanagement/SystemIntegrationMonitor'

const TwoFactorWrapper = () => {
  // Comment out the 2FA context usage
  // const { requires2FA } = useTwoFactor()

  // Always bypass 2FA for now
  const requires2FA = false

  console.log('🔧 TwoFactorWrapper - requires2FA:', requires2FA)
  console.log('🔧 TwoFactorWrapper - Current URL:', window.location.pathname)

  // If 2FA is required, show 2FA verification
  if (requires2FA) {
    console.log('🔧 TwoFactorWrapper - Showing 2FA verification')
    return <TwoFactorVerification onVerificationSuccess={() => {}} />
  }

  console.log('🔧 TwoFactorWrapper - Showing app with routing')
  // If 2FA is verified or not required, show the app with routing
  return (
    <>
      <Routes>
        {/* Standalone Modern Dashboard - No Layout wrapper */}
        <Route path="/dashboard-modern" element={<ModernDashboard />} />
        
        {/* All other routes with Layout wrapper */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<DashboardEnhanced />} />
              <Route path="/dashboard-enhanced" element={<DashboardEnhanced />} />
          <Route path="/entity" element={<EntityPage />} />
          <Route path="/account" element={<AccountPage />} />

          <Route path="/process" element={<Process />} />
          <Route path="/etl" element={<ETLPage />} />
          <Route path="/consolidation" element={<Consolidation />} />
          <Route path="/support" element={<Support />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/financial-statements" element={<FinancialStatements />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/advanced-features" element={<AdvancedFeatures />} />
          <Route path="/asset-register" element={<AssetRegister />} />
          <Route path="/backup-restore" element={<BackupRestore />} />
          <Route path="/audit-materiality" element={<AuditMateriality />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="/audit-trail" element={<AuditTrail />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/bank-reconciliation" element={<BankReconciliation />} />
          <Route path="/supplier-reconciliation" element={<SupplierReconciliation />} />
          <Route path="/forecast-budget" element={<ForecastBudget />} />
          <Route path="/ifrs-templates" element={<IFRSTemplates />} />
          <Route path="/fst-items" element={<FSTItems />} />
          <Route path="/forex-rates" element={<ForexRates />} />
          <Route path="/entities" element={<EntityManagement />} />
          <Route path="/accounts" element={<AccountManagement />} />
          <Route path="/journal-entries" element={<JournalEntries />} />
          <Route path="/trial-balance" element={<TrialBalance />} />
          <Route path="/financial-ratios" element={<FinancialRatios />} />
          <Route path="/cash-flow" element={<CashFlow />} />
          <Route path="/variance-analysis" element={<VarianceAnalysis />} />
          <Route path="/tax-management" element={<TaxManagement />} />
          <Route path="/regulatory-reporting" element={<RegulatoryReporting />} />
          <Route path="/internal-controls" element={<InternalControls />} />
          <Route path="/system-monitoring" element={<SystemMonitoring />} />
          <Route path="/system-management" element={<SystemManagement />} />
          <Route path="/api-management" element={<APIManagement />} />
          <Route path="/database-management" element={<DatabaseManagement />} />
          <Route path="/data-import-export" element={<DataImportExport />} />
          <Route path="/third-party-integration" element={<ThirdPartyIntegration />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/training" element={<Training />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/hr-management" element={<HRManagementSuite />} />
          
          {/* New Advanced Features Routes */}
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/global-compliance" element={<GlobalCompliance />} />
          <Route path="/narrative-reporting" element={<NarrativeReporting />} />
          <Route path="/what-if-analysis" element={<WhatIfAnalysis />} />
          <Route path="/real-time-analytics" element={<RealTimeAnalytics />} />
          
          {/* Integration App Routes */}
          <Route path="/integration-summary" element={<IntegrationSummary />} />
          <Route path="/integration-hub" element={<IntegrationHub />} />
          <Route path="/custom-axes" element={<CustomAxes />} />
          <Route path="/business-valuation" element={<BusinessValuation />} />
          <Route path="/sql-query-console" element={<SQLQueryConsole />} />
          <Route path="/quantum-finance" element={<QuantumFinance />} />
          <Route path="/business-tools" element={<BusinessTools />} />
          
          {/* Axes Routes */}
          <Route path="/axes" element={<AxesOverview />} />
          <Route path="/axes/entity" element={<AxesEntityEnhanced />} />
          <Route path="/axes/account" element={<AxesAccountsEnhanced />} />
          <Route path="/axes/:axisName" element={<AxesDynamic />} />
          
          {/* Role Management Routes */}
          <Route path="/rolemanagement" element={<RoleManagementHub />} />
          <Route path="/rolemanagement/user-access-dashboard" element={<UserAccessDashboard />} />
          <Route path="/rolemanagement/role-profile-management" element={<RoleProfileManagement />} />
          <Route path="/rolemanagement/permission-matrix-management" element={<PermissionMatrixManagement />} />
          <Route path="/rolemanagement/compliance-audit-center" element={<ComplianceAuditCenter />} />
          <Route path="/rolemanagement/access-request-workflow" element={<AccessRequestWorkflow />} />
          <Route path="/rolemanagement/system-integration-monitor" element={<SystemIntegrationMonitor />} />
          
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
      <ToastContainer />
    </>
  )
}

export default TwoFactorWrapper
