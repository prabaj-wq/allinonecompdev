import React from 'react';
import { Button, Typography } from 'antd';
import { motion } from 'framer-motion';
import { RocketOutlined } from '@ant-design/icons';
import CometAnimation from '../animations/CometAnimation';

const { Title, Text } = Typography;

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="onboarding-step welcome-step"
    >
      <CometAnimation />
      
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="onboarding-icon"
      >
        <RocketOutlined className="welcome-icon bounce-animation" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Title level={2} className="onboarding-title">
          Welcome to ConsolidationPro
        </Title>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Text className="onboarding-subtitle">
          Let's set up your company database in just a few steps
        </Text>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="onboarding-actions"
      >
        <Button 
          type="primary" 
          size="large" 
          onClick={onNext}
          className="onboarding-button pulse-animation"
        >
          Get Started
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 1 }}
          >
            →
          </motion.span>
        </Button>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{ marginTop: '30px' }}
      >
        <Text type="secondary" style={{ fontSize: '14px' }}>
          Trusted by enterprises worldwide
        </Text>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeStep;