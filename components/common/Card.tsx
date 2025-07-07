import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-secondary border border-border-color rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out ${className}`}>
      {children}
    </div>
  );
};

export default Card;