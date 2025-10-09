import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import IntegrationPage from '../../components/IntegrationPage'
import { 
  ShoppingCart, 
  FileText, 
  Truck, 
  DollarSign 
} from 'lucide-react'

const PurchaseOrderManagement = () => {
  const quickActions = [
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      label: "Purchase Orders"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Vendor Management"
    },
    {
      icon: <Truck className="w-5 h-5" />,
      label: "Delivery Tracking"
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: "Cost Analysis"
    }
  ]

  return (
    <ProtectedRoute integrationName="Purchase order management">
      <IntegrationPage
        integrationName="Purchase order management"
        port={3006}
        description="Procurement, purchase orders, and vendor management"
        quickActions={quickActions}
        version="2.3.0"
        users="22 active"
        lastUpdated="4 days ago"
      />
    </ProtectedRoute>
  )
}

export default PurchaseOrderManagement
