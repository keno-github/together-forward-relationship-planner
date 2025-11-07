import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ onClick, label = 'Back', className = '' }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, x: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`glass-card-light px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:glass-card-strong transition-all ${className}`}
      style={{color: '#2B2B2B'}}
    >
      <ArrowLeft className="w-5 h-5" style={{color: '#C084FC'}} />
      <span>{label}</span>
    </motion.button>
  );
};

export default BackButton;
