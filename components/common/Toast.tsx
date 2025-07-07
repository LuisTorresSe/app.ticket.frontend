
import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
}

const Toast: React.FC<ToastProps> = ({ message, type }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2800); // Should be slightly less than the duration in context to allow for fade out
    return () => clearTimeout(timer);
  }, [message, type]);

  const baseStyles = 'fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg text-white transition-all duration-300 transform';
  
  const typeStyles = {
    success: 'bg-green-600',
    error: 'bg-danger',
    warning: 'bg-yellow-500',
  };

  const transformStyles = visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0';

  return (
    <div className={`${baseStyles} ${typeStyles[type]} ${transformStyles}`}>
      <p className="font-semibold">{message}</p>
    </div>
  );
};

export default Toast;
