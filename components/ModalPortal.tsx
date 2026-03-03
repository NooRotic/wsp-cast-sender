import React from 'react';

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const ModalPortal: React.FC<ModalPortalProps> = ({ isOpen, onClose, title, size = 'md', children }) => {
  if (!isOpen) return null;
  
  // Create size class mapping to avoid template literal issues
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-xl', 
    lg: 'max-w-3xl'
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className={`bg-[#181c1f] rounded-xl shadow-lg p-6 w-full ${sizeClasses[size]}`}> 
        {title && <div className="text-lg font-bold mb-4 text-[#39FF14]">{title}</div>}
        <button className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={onClose} aria-label="Close">×</button>
        {children}
      </div>
    </div>
  );
};

export default ModalPortal;
