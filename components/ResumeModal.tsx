import React from 'react';
import ModalPortal from './ModalPortal';

interface ResumeModalProps {
  isOpen: boolean;
  onResume: () => void;
  onDismiss: () => void;
  videoTitle?: string;
}

const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, onResume, onDismiss, videoTitle }) => {
  return (
    <ModalPortal isOpen={isOpen} onClose={onDismiss} title="Resume Playback?" size="sm">
      <div className="p-4 text-center">
        <div className="mb-4 text-lg font-semibold text-gray-200">
          Resume watching <span className="text-[#39FF14]">{videoTitle || 'previous content'}</span>?
        </div>
        <div className="flex justify-center gap-4 mt-6">
          <button
            className="px-4 py-2 rounded bg-[#39FF14] text-black font-bold hover:bg-[#2ed60a] transition"
            onClick={onResume}
          >
            Resume
          </button>
          <button
            className="px-4 py-2 rounded bg-gray-700 text-white font-bold hover:bg-gray-600 transition"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ResumeModal;
