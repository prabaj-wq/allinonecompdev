import React, { useState } from 'react'
import { Modal, Form, Input, Select, Button, Steps, Alert, message } from 'antd'
import { ApartmentOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Step } = Steps
const { Option } = Select

interface CreateCompanyModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: (companyData: any) => void
}

interface CompanyFormData {
  company_name: string
  industry: string
  environment_type: string
  admin_username: string
  admin_email: string
  admin_password: string
}

const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyForm] = Form.useForm()
  const [adminForm] = Form.useForm()
  const [formData, setFormData] = useState<Partial<CompanyFormData>>({})

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Education',
    'Government',
    'Energy',
    'Telecommunications',
    'Transportation',
    'Other'
  ]

  const environmentTypes = [
    { value: 'production', label: 'Production' },
    { value: 'development', label: 'Development' }
  ]

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        const values = await companyForm.validateFields()
        
        // Check if company name is available
        const checkResponse = await axios.get(`/api/company-management/check-company-name?company_name=${encodeURIComponent(values.company_name)}`)
        
        if (!checkResponse.data.available) {
          setError('Company name already exists. Please choose a different name.')
          return
        }
        
        setFormData({ ...formData, ...values })
        setError(null)
        setCurrentStep(1)
      } else if (currentStep === 1) {
        const values = await adminForm.validateFields()
        setFormData({ ...formData, ...values })
        setCurrentStep(2)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
    setError(null)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.post('/api/company-management/create-company', formData)
      
      if (response.data.success) {
        message.success('Company created successfully!')
        
        // Store authentication data
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('selectedCompany', response.data.company_name)
        localStorage.setItem('user', JSON.stringify({
          username: response.data.username,
          company: response.data.company_name,
          role: 'admin',
          full_name: response.data.username
        }))
        
        onSuccess(response.data)
        handleReset()
      }
    } catch (error: any) {
      console.error('Error creating company:', error)
      if (error.response?.data?.detail) {
        setError(error.response.data.detail)
      } else {
        setError('Failed to create company. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentStep(0)
    setFormData({})
    setError(null)
    companyForm.resetFields()
    adminForm.resetFields()
  }

  const handleCancel = () => {
    handleReset()
    onCancel()
  }

  const steps = [
    {
      title: 'Company Info',
      icon: <ApartmentOutlined />,
      content: (
        <Form
          form={companyForm}
          layout="vertical"
          initialValues={formData}
        >
          <Form.Item
            name="company_name"
            label="Company Name"
            rules={[
              { required: true, message: 'Please enter company name' },
              { min: 2, message: 'Company name must be at least 2 characters' }
            ]}
          >
            <Input placeholder="Enter company name" />
          </Form.Item>

          <Form.Item
            name="industry"
            label="Industry"
            rules={[{ required: true, message: 'Please select an industry' }]}
          >
            <Select placeholder="Select industry">
              {industries.map(industry => (
                <Option key={industry} value={industry}>{industry}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="environment_type"
            label="Environment Type"
            rules={[{ required: true, message: 'Please select environment type' }]}
          >
            <Select placeholder="Select environment type">
              {environmentTypes.map(env => (
                <Option key={env.value} value={env.value}>{env.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      )
    },
    {
      title: 'Admin User',
      icon: <UserOutlined />,
      content: (
        <Form
          form={adminForm}
          layout="vertical"
          initialValues={formData}
        >
          <Form.Item
            name="admin_username"
            label="Admin Username"
            rules={[
              { required: true, message: 'Please enter admin username' },
              { min: 3, message: 'Username must be at least 3 characters' }
            ]}
          >
            <Input placeholder="Enter admin username" />
          </Form.Item>

          <Form.Item
            name="admin_email"
            label="Admin Email"
            rules={[
              { required: true, message: 'Please enter admin email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter admin email" />
          </Form.Item>

          <Form.Item
            name="admin_password"
            label="Admin Password"
            rules={[
              { required: true, message: 'Please enter admin password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password placeholder="Enter admin password" />
          </Form.Item>
        </Form>
      )
    },
    {
      title: 'Review',
      icon: <CheckCircleOutlined />,
      content: (
        <div>
          <h3>Review Company Information</h3>
          <div style={{ marginBottom: 16 }}>
            <strong>Company Name:</strong> {formData.company_name}
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>Industry:</strong> {formData.industry}
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>Environment:</strong> {formData.environment_type}
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>Admin Username:</strong> {formData.admin_username}
          </div>
          <div style={{ marginBottom: 16 }}>
            <strong>Admin Email:</strong> {formData.admin_email}
          </div>
          <Alert
            message="Ready to Create"
            description="Click 'Create Company' to set up your new company database with the admin user."
            type="info"
            showIcon
          />
        </div>
      )
    }
  ]

  return (
    <Modal
      title="Create New Company"
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={null}
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Step key={index} title={step.title} icon={step.icon} />
        ))}
      </Steps>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ minHeight: 300 }}>
        {steps[currentStep].content}
      </div>

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        {currentStep > 0 && (
          <Button style={{ marginRight: 8 }} onClick={handlePrevious}>
            Previous
          </Button>
        )}
        
        {currentStep < steps.length - 1 ? (
          <Button type="primary" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            Create Company
          </Button>
        )}
      </div>
    </Modal>
  )
}

export default CreateCompanyModal
