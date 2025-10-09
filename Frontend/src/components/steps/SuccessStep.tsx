import React, { useEffect, useState } from 'react';
import { Typography, Progress } from 'antd';
import { motion } from 'framer-motion';
import { CheckCircleOutlined } from '@ant-design/icons';
import Confetti from 'react-confetti';

const { Title, Text } = Typography;

interface SuccessStepProps {
  windowSize: { width: number; height: number };
  redirecting: boolean;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ windowSize, redirecting }) => {
  const [comets, setComets] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);
  
  // Generate comets for animation
  useEffect(() => {
    const newComets = [];
    for (let i = 0; i < 15; i++) {
      newComets.push({
        id: i,
        x: Math.random() * windowSize.width,
        y: Math.random() * windowSize.height,
        delay: Math.random() * 2
      });
    }
    setComets(newComets);
  }, [windowSize]);

  return (
    <div className="success-container">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={500}
      />
      
      {/* Comet animations */}
      {comets.map(comet => (
        <motion.div
          key={comet.id}
          className="comet"
          initial={{ 
            x: comet.x, 
            y: comet.y,
            opacity: 0,
            scale: 0.5
          }}
          animate={{ 
            x: comet.x + 300, 
            y: comet.y - 300,
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 3,
            delay: comet.delay,
            repeat: Infinity,
            repeatDelay: 5 + Math.random() * 5
          }}
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            backgroundColor: '#fff',
            borderRadius: '50%',
            boxShadow: '0 0 10px 2px rgba(255, 255, 255, 0.8)',
          }}
        />
      ))}
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="success-icon bounce-animation"
      >
        <CheckCircleOutlined />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Title level={2} className="success-title">
          Setup Complete!
        </Title>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Text className="success-text">
          Your ConsolidationPro instance has been successfully configured.
        </Text>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="redirect-section"
      >
        <Text type="secondary">
          {redirecting ? "Redirecting to dashboard..." : "Preparing your dashboard..."}
        </Text>
        <div className="progress-container">
          <Progress percent={100} showInfo={false} className="redirect-progress" />
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ marginTop: '30px' }}
      >
        <Text type="secondary" style={{ fontSize: '14px' }}>
          Thank you for choosing ConsolidationPro
        </Text>
      </motion.div>
    </div>
  );
};

export default SuccessStep;