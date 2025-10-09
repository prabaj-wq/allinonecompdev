import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { motion } from 'framer-motion';
import { ApartmentOutlined, UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ConfirmStepProps {
  companyData: any;
  adminData: any;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({ companyData, adminData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="onboarding-step confirm-step"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Title level={3} className="onboarding-title">
          Review & Confirm
        </Title>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Text type="secondary" className="onboarding-subtitle">
          Please review your information before completing setup
        </Text>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="review-section"
      >
        <Card className="review-card" title={
          <span>
            <ApartmentOutlined style={{ marginRight: 8, color: '#0366d6' }} />
            Company Information
          </span>
        } size="small">
          <div className="review-item">
            <Text strong>Company Name:</Text>
            <Text>{companyData?.companyName || 'Not provided'}</Text>
          </div>
          <div className="review-item">
            <Text strong>Industry:</Text>
            <Text>{companyData?.industry || 'Not provided'}</Text>
          </div>
          <div className="review-item">
            <Text strong>Environment:</Text>
            <Tag 
              className="environment-tag"
              color={companyData?.environmentType === 'production' ? 'green' : 'blue'}
            >
              {companyData?.environmentType?.charAt(0).toUpperCase() + companyData?.environmentType?.slice(1) || 'Not provided'}
            </Tag>
          </div>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="review-section"
      >
        <Card className="review-card" title={
          <span>
            <UserOutlined style={{ marginRight: 8, color: '#0366d6' }} />
            Admin Account
          </span>
        } size="small">
          <div className="review-item">
            <Text strong>Username:</Text>
            <Text>{adminData?.username || 'Not provided'}</Text>
          </div>
          <div className="review-item">
            <Text strong>Email:</Text>
            <Text>{adminData?.email || 'Not provided'}</Text>
          </div>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="terms-section"
      >
        <Text type="secondary">
          By clicking "Complete Setup", you agree to our Terms of Service and Privacy Policy.
        </Text>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmStep;