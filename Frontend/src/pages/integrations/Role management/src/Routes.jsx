import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
// Add your imports here
import UserAccessDashboard from "pages/user-access-dashboard";
import RoleProfileManagement from "pages/role-profile-management";
import PermissionMatrixManagement from "pages/permission-matrix-management";
import ComplianceAuditCenter from "pages/compliance-audit-center";
import AccessRequestWorkflow from "pages/access-request-workflow";
import SystemIntegrationMonitor from "pages/system-integration-monitor";
import NotFound from "pages/NotFound";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your routes here */}
        <Route path="/" element={<UserAccessDashboard />} />
        <Route path="/user-access-dashboard" element={<UserAccessDashboard />} />
        <Route path="/role-profile-management" element={<RoleProfileManagement />} />
        <Route path="/permission-matrix-management" element={<PermissionMatrixManagement />} />
        <Route path="/compliance-audit-center" element={<ComplianceAuditCenter />} />
        <Route path="/access-request-workflow" element={<AccessRequestWorkflow />} />
        <Route path="/system-integration-monitor" element={<SystemIntegrationMonitor />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;