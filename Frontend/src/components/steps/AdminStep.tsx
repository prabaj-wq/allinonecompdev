import React from 'react';
import { Form, Input, Typography } from 'antd';
import { motion } from 'framer-motion';
import { UserOutlined, EyeInvisibleOutlined, EyeTwoTone, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface AdminStepProps {
  form: any;
  passwordStrength: number;
  passwordFeedback: string;
  onPasswordChange: (password: string) => void;
}

const AdminStep: React.FC<AdminStepProps> = ({ 
  form, 
  passwordStrength, 
  passwordFeedback,
  onPasswordChange
}) => {
  // Get color based on password strength
  const getStrengthColor = () => {
    if (passwordStrength < 50) return '#ff4d4f';
    if (passwordStrength < 75) return '#faad14';
    return '#52c41a';
  };

  // Get icon based on password strength
  const getStrengthIcon = () => {
    if (passwordStrength < 50) return '⚠️';
    if (passwordStrength < 75) return '👍';
    return '✅';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="onboarding-step admin-step"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Title level={3} className="onboarding-title">
          Admin Account
        </Title>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Text type="secondary" className="onboarding-subtitle">
          Create your administrator account
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
            name="username"
            label={<span className="form-label">Username</span>}
            rules={[{ required: true, message: 'Please enter admin username' }]}
          >
            <Input 
              size="large" 
              placeholder="e.g. admin" 
              className="onboarding-input"
              prefix={<UserOutlined />}
            />
          </Form.Item>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Form.Item
            name="email"
            label={<span className="form-label">Email</span>}
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              size="large" 
              placeholder="e.g. admin@company.com" 
              className="onboarding-input"
              prefix={<span className="input-prefix">✉️</span>}
            />
          </Form.Item>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Form.Item
            name="password"
            label={<span className="form-label">Password</span>}
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 8, message: 'Password must be at least 8 characters' }
            ]}
          >
            <Input.Password 
              size="large" 
              placeholder="Enter a strong password" 
              className="onboarding-input"
              prefix={<LockOutlined />}
              iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
          </Form.Item>
          
          {form.getFieldValue('password') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="password-strength-container"
            >
              <div className="password-strength-header">
                <Text strong>Password Strength</Text>
                <Text 
                  className={`strength-label ${
                    passwordStrength < 50 ? 'weak' : 
                    passwordStrength < 75 ? 'medium' : 'strong'
                  }`}
                >
                  {getStrengthIcon()} {passwordFeedback}
                </Text>
              </div>
              <div className="password-strength-bar">
                <div 
                  className="strength-fill"
                  style={{ 
                    width: `${passwordStrength}%`,
                    backgroundColor: getStrengthColor()
                  }}
                />
              </div>
              <div className="password-requirements">
                <Text className={passwordStrength >= 25 ? 'requirement-met' : 'requirement-pending'}>
                  {passwordStrength >= 25 ? '✓' : '○'} At least 8 characters
                </Text>
                <Text className={passwordStrength >= 50 ? 'requirement-met' : 'requirement-pending'}>
                  {passwordStrength >= 50 ? '✓' : '○'} Contains uppercase letter
                </Text>
                <Text className={passwordStrength >= 75 ? 'requirement-met' : 'requirement-pending'}>
                  {passwordStrength >= 75 ? '✓' : '○'} Contains number
                </Text>
                <Text className={passwordStrength >= 100 ? 'requirement-met' : 'requirement-pending'}>
                  {passwordStrength >= 100 ? '✓' : '○'} Contains special character
                </Text>
              </div>
            </motion.div>
          )}
        </motion.div>
      </Form>
    </motion.div>
  );
};

export default AdminStep;