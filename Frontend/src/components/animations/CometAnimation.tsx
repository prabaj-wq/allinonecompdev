import React from 'react';
import { motion } from 'framer-motion';

const CometAnimation: React.FC = () => {
  return (
    <div className="comet-container">
      <motion.div
        className="comet"
        initial={{ x: '-100vw', y: '-100vh', opacity: 0 }}
        animate={{ 
          x: '100vw', 
          y: '100vh', 
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 3,
          ease: "easeOut",
        }}
      >
        <div className="comet-head" />
        <div className="comet-tail" />
      </motion.div>
      
      {/* Additional smaller comets */}
      <motion.div
        className="comet small"
        initial={{ x: '-50vw', y: '-50vh', opacity: 0 }}
        animate={{ 
          x: '50vw', 
          y: '50vh', 
          opacity: [0, 0.7, 0],
        }}
        transition={{
          duration: 4,
          delay: 1,
          ease: "easeOut",
        }}
      >
        <div className="comet-head" />
        <div className="comet-tail" />
      </motion.div>
    </div>
  );
};

export default CometAnimation;