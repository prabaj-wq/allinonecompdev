import React from 'react'
import { useTwoFactor } from '../contexts/TwoFactorContext'
import TwoFactorVerification from './TwoFactorVerification'
import Layout from './Layout'
import ToastContainer from './ToastContainer'
import PageAccessWrapper from './PageAccessWrapper'
import { Routes, Route, Navigate } from 'react-router-dom'

// Import all the page components
import DashboardEnhanced from '../pages/DashboardEnhanced'
import ModernDashboard from '../pages/ModernDashboard'
import Process from '../pages/Process'
import DataInput from '../pages/DataInput'
import Consolidation from '../pages/Consolidation'
import Support from '../pages/Support'
import Profile from '../pages/Profile'
import FinancialStatements from '../pages/FinancialStatementsEnhanced'
import FinancialReports from '../pages/FinancialReports'
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
import JournalEntry from '../pages/JournalEntry'
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
import CustomAxesManager from '../pages/CustomAxesManager'
import FiscalManagement from '../pages/FiscalManagement'
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
import ProcessBuilderV2 from '../components/ProcessBuilderV2'

// Role Management Components
import RoleManagementHub from '../pages/rolemanagement/RoleManagementHub'
import UserAccessDashboard from '../pages/rolemanagement/UserAccessDashboard'
import RoleProfileManagement from '../pages/rolemanagement/RoleProfileManagement'
import PermissionMatrixManagement from '../pages/rolemanagement/PermissionMatrixManagement'
import ComplianceAuditCenter from '../pages/rolemanagement/ComplianceAuditCenter'
import AccessRequestWorkflow from '../pages/rolemanagement/AccessRequestWorkflow'

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
          <Route path="/entity" element={
            <PageAccessWrapper requiredPage="/entity" pageName="Entity Management">
              <EntityPage />
            </PageAccessWrapper>
          } />
          <Route path="/account" element={
            <PageAccessWrapper requiredPage="/accounts" pageName="Account Management">
              <AccountPage />
            </PageAccessWrapper>
          } />

          <Route path="/process" element={
            <PageAccessWrapper requiredPage="/process" pageName="Process Management">
              <Process />
            </PageAccessWrapper>
          } />
          <Route path="/data-input" element={
            <PageAccessWrapper requiredPage="/process" pageName="Data Input">
              <DataInput />
            </PageAccessWrapper>
          } />
          <Route path="/etl" element={
            <PageAccessWrapper requiredPage="/etl" pageName="ETL Management">
              <ETLPage />
            </PageAccessWrapper>
          } />
          <Route path="/consolidation" element={
            <PageAccessWrapper requiredPage="/consolidation" pageName="Consolidation">
              <Consolidation />
            </PageAccessWrapper>
          } />
          <Route path="/process-builder" element={
            <PageAccessWrapper requiredPage="/process" pageName="Process Builder">
              <ProcessBuilderV2 />
            </PageAccessWrapper>
          } />
          <Route path="/support" element={<Support />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/financial-statements" element={
            <PageAccessWrapper requiredPage="/financial-statements" pageName="Financial Statements">
              <FinancialStatements />
            </PageAccessWrapper>
          } />
          <Route path="/financial-reports" element={
            <PageAccessWrapper requiredPage="/process" pageName="Financial Reports">
              <FinancialReports />
            </PageAccessWrapper>
          } />
          <Route path="/reports" element={
            <PageAccessWrapper requiredPage="/reports" pageName="Reports">
              <Reports />
            </PageAccessWrapper>
          } />
          <Route path="/advanced-features" element={
            <PageAccessWrapper requiredPage="/advanced-features" pageName="Advanced Features">
              <AdvancedFeatures />
            </PageAccessWrapper>
          } />
          <Route path="/asset-register" element={
            <PageAccessWrapper requiredPage="/asset-register" pageName="Asset Register">
              <AssetRegister />
            </PageAccessWrapper>
          } />
          <Route path="/backup-restore" element={
            <PageAccessWrapper requiredPage="/backup-restore" pageName="Backup & Restore">
              <BackupRestore />
            </PageAccessWrapper>
          } />
          <Route path="/audit-materiality" element={<AuditMateriality />} />
          <Route path="/audit" element={
            <PageAccessWrapper requiredPage="/audit" pageName="Audit">
              <Audit />
            </PageAccessWrapper>
          } />
          <Route path="/audit-trail" element={
            <PageAccessWrapper requiredPage="/audit-trail" pageName="Audit Trail">
              <AuditTrail />
            </PageAccessWrapper>
          } />
          <Route path="/bills" element={<Bills />} />
          <Route path="/bank-reconciliation" element={<BankReconciliation />} />
          <Route path="/supplier-reconciliation" element={<SupplierReconciliation />} />
          <Route path="/forecast-budget" element={<ForecastBudget />} />
          <Route path="/ifrs-templates" element={<IFRSTemplates />} />
          <Route path="/fst-items" element={<FSTItems />} />
          <Route path="/forex-rates" element={<ForexRates />} />
          <Route path="/entities" element={
            <PageAccessWrapper requiredPage="/entity" pageName="Entity Management">
              <EntityManagement />
            </PageAccessWrapper>
          } />
          <Route path="/accounts" element={
            <PageAccessWrapper requiredPage="/accounts" pageName="Account Management">
              <AccountManagement />
            </PageAccessWrapper>
          } />
          <Route path="/journal-entries" element={
            <PageAccessWrapper requiredPage="/journal-entries" pageName="Journal Entries">
              <JournalEntries />
            </PageAccessWrapper>
          } />
          <Route path="/journal-entry" element={
            <PageAccessWrapper requiredPage="/journal-entries" pageName="Journal Entry">
              <JournalEntry />
            </PageAccessWrapper>
          } />
          <Route path="/trial-balance" element={
            <PageAccessWrapper requiredPage="/trial-balance" pageName="Trial Balance">
              <TrialBalance />
            </PageAccessWrapper>
          } />
          <Route path="/financial-ratios" element={
            <PageAccessWrapper requiredPage="/financial-ratios" pageName="Financial Ratios">
              <FinancialRatios />
            </PageAccessWrapper>
          } />
          <Route path="/cash-flow" element={
            <PageAccessWrapper requiredPage="/cash-flow" pageName="Cash Flow">
              <CashFlow />
            </PageAccessWrapper>
          } />
          <Route path="/variance-analysis" element={
            <PageAccessWrapper requiredPage="/variance-analysis" pageName="Variance Analysis">
              <VarianceAnalysis />
            </PageAccessWrapper>
          } />
          <Route path="/tax-management" element={
            <PageAccessWrapper requiredPage="/tax-management" pageName="Tax Management">
              <TaxManagement />
            </PageAccessWrapper>
          } />
          <Route path="/regulatory-reporting" element={<RegulatoryReporting />} />
          <Route path="/internal-controls" element={<InternalControls />} />
          <Route path="/system-monitoring" element={<SystemMonitoring />} />
          <Route path="/system-management" element={
            <PageAccessWrapper requiredPage="/system-management" pageName="System Management">
              <SystemManagement />
            </PageAccessWrapper>
          } />
          <Route path="/api-management" element={
            <PageAccessWrapper requiredPage="/api-management" pageName="API Management">
              <APIManagement />
            </PageAccessWrapper>
          } />
          <Route path="/database-management" element={<DatabaseManagement />} />
          <Route path="/data-import-export" element={<DataImportExport />} />
          <Route path="/third-party-integration" element={<ThirdPartyIntegration />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/training" element={<Training />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/hr-management" element={<HRManagementSuite />} />
          
          {/* New Advanced Features Routes - With Access Control */}
          <Route path="/workflows" element={
            <PageAccessWrapper requiredPage="/workflows" pageName="Workflow Management">
              <Workflows />
            </PageAccessWrapper>
          } />
          <Route path="/global-compliance" element={
            <PageAccessWrapper requiredPage="/global-compliance" pageName="Global Compliance">
              <GlobalCompliance />
            </PageAccessWrapper>
          } />
          <Route path="/narrative-reporting" element={
            <PageAccessWrapper requiredPage="/narrative-reporting" pageName="Narrative Reporting">
              <NarrativeReporting />
            </PageAccessWrapper>
          } />
          <Route path="/what-if-analysis" element={
            <PageAccessWrapper requiredPage="/what-if-analysis" pageName="What-If Analysis">
              <WhatIfAnalysis />
            </PageAccessWrapper>
          } />
          <Route path="/real-time-analytics" element={
            <PageAccessWrapper requiredPage="/real-time-analytics" pageName="Real-Time Analytics">
              <RealTimeAnalytics />
            </PageAccessWrapper>
          } />
          
          {/* Integration App Routes */}
          <Route path="/integration-summary" element={<IntegrationSummary />} />
          <Route path="/integration-hub" element={
            <PageAccessWrapper requiredPage="/integration-hub" pageName="Integration Hub">
              <IntegrationHub />
            </PageAccessWrapper>
          } />
          <Route path="/custom-axes" element={<CustomAxes />} />
          <Route path="/custom-axes/:axisName/manage" element={<CustomAxesManager />} />
          <Route path="/business-valuation" element={<BusinessValuation />} />
          <Route path="/sql-query-console" element={<SQLQueryConsole />} />
          <Route path="/quantum-finance" element={<QuantumFinance />} />
          <Route path="/business-tools" element={<BusinessTools />} />
          <Route path="/fiscal-management" element={
            <PageAccessWrapper requiredPage="/fiscal-management" pageName="Fiscal Management">
              <FiscalManagement />
            </PageAccessWrapper>
          } />
          
          {/* Axes Routes - With Access Control */}
          <Route path="/axes" element={
            <PageAccessWrapper requiredPage="/axes" pageName="Axes Overview">
              <AxesOverview />
            </PageAccessWrapper>
          } />
          <Route path="/axes/entity" element={
            <PageAccessWrapper requiredPage="/entity" pageName="Entity Management">
              <AxesEntityEnhanced />
            </PageAccessWrapper>
          } />
          <Route path="/axes/account" element={
            <PageAccessWrapper requiredPage="/accounts" pageName="Account Management">
              <AxesAccountsEnhanced />
            </PageAccessWrapper>
          } />
          <Route path="/axes/:axisName" element={
            <PageAccessWrapper requiredPage="/axes" pageName="Dynamic Axes">
              <AxesDynamic />
            </PageAccessWrapper>
          } />
          
          {/* Role Management Routes - Admin Only */}
          <Route path="/rolemanagement" element={
            <PageAccessWrapper requiredPage="/rolemanagement" pageName="Role Management">
              <RoleManagementHub />
            </PageAccessWrapper>
          } />
          <Route path="/rolemanagement/user-access-dashboard" element={
            <PageAccessWrapper requiredPage="/rolemanagement" pageName="User Access Dashboard">
              <UserAccessDashboard />
            </PageAccessWrapper>
          } />
          <Route path="/rolemanagement/role-profile-management" element={
            <PageAccessWrapper requiredPage="/rolemanagement" pageName="Role Profile Management">
              <RoleProfileManagement />
            </PageAccessWrapper>
          } />
          <Route path="/rolemanagement/permission-matrix-management" element={
            <PageAccessWrapper requiredPage="/rolemanagement" pageName="Permission Matrix Management">
              <PermissionMatrixManagement />
            </PageAccessWrapper>
          } />
          <Route path="/rolemanagement/compliance-audit-center" element={
            <PageAccessWrapper requiredPage="/rolemanagement" pageName="Compliance & Audit Center">
              <ComplianceAuditCenter />
            </PageAccessWrapper>
          } />
          <Route path="/rolemanagement/access-request-workflow" element={
            <PageAccessWrapper requiredPage="/rolemanagement" pageName="Access Request Workflow">
              <AccessRequestWorkflow />
            </PageAccessWrapper>
          } />
          
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
