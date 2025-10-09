import React from 'react';
import { motion } from 'framer-motion';

const ParallaxBackground: React.FC = () => {
  return (
    <div className="parallax-background">
      <motion.div
        className="parallax-layer parallax-layer-1"
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="parallax-layer parallax-layer-2"
        animate={{
          y: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      <motion.div
        className="parallax-layer parallax-layer-3"
        animate={{
          y: [0, -40, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
    </div>
  );
};

export default ParallaxBackground;