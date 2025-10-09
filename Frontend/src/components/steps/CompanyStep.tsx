import React, { useState } from 'react';
import { Form, Input, Select, Typography } from 'antd';
import { motion } from 'framer-motion';
import { ApartmentOutlined, DownOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface CompanyStepProps {
  form: any;
  industries: string[];
  environmentTypes: string[];
}

const CompanyStep: React.FC<CompanyStepProps> = ({ form, industries, environmentTypes }) => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');

  const handleIndustryChange = (value: string) => {
    setSelectedIndustry(value);
    form.setFieldsValue({ industry: value });
  };

  // Map environment types to display labels
  const environmentTypeOptions = [
    { value: 'production', label: 'Production', icon: '🚀', color: '#28a745' },
    { value: 'development', label: 'Development', icon: '🔧', color: '#0366d6' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="onboarding-step company-step"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Title level={3} className="onboarding-title">
          Company Information
        </Title>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Text type="secondary" className="onboarding-subtitle">
          Tell us about your organization
        </Text>
      </motion.div>
      
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="onboarding-form"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Form.Item
            name="companyName"
            label={<span className="form-label">Company Name</span>}
            rules={[{ required: true, message: 'Please enter your company name' }]}
          >
            <Input 
              size="large" 
              placeholder="e.g. Acme Corporation" 
              className="onboarding-input"
              prefix={<ApartmentOutlined />}
            />
          </Form.Item>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Form.Item
            name="industry"
            label={<span className="form-label">Industry</span>}
            rules={[{ required: true, message: 'Please select your industry' }]}
          >
            <Select 
              size="large" 
              placeholder="Select industry"
              className="onboarding-input"
              showSearch
              optionFilterProp="children"
              suffixIcon={<DownOutlined />}
              onChange={handleIndustryChange}
              value={selectedIndustry}
            >
              {industries.map(industry => (
                <Option key={industry} value={industry}>{industry}</Option>
              ))}
            </Select>
          </Form.Item>
        </motion.div>
        
        {selectedIndustry === 'Other' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Form.Item
              name="otherIndustry"
              label={<span className="form-label">Please specify your industry</span>}
              rules={[{ required: true, message: 'Please specify your industry' }]}
            >
              <Input 
                size="large" 
                placeholder="Enter your industry" 
                className="onboarding-input"
              />
            </Form.Item>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Form.Item
            name="environmentType"
            label={<span className="form-label">Environment</span>}
            rules={[{ required: true, message: 'Please select environment type' }]}
          >
            <Select 
              size="large" 
              placeholder="Select environment"
              className="onboarding-input"
              suffixIcon={<DownOutlined />}
            >
              {environmentTypeOptions.map(type => (
                <Option key={type.value} value={type.value}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: type.color }}>{type.icon}</span>
                    {type.label}
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </motion.div>
      </Form>
    </motion.div>
  );
};

export default CompanyStep;