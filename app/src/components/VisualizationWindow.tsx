import React, { useState } from 'react';
import { FullscreenModal } from './FullscreenModal';
import './VisualizationWindow.css';

interface VisualizationWindowProps {
  title: string;
  children: React.ReactNode;
  fullscreenChildren?: React.ReactNode; // Optional different content for fullscreen
  className?: string;
}

export const VisualizationWindow: React.FC<VisualizationWindowProps> = ({
  title,
  children,
  fullscreenChildren,
  className = '',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <div className={`viz-window ${className}`}>
        <div className="viz-header">
          <h3 className="viz-title">{title}</h3>
          <button
            className="viz-fullscreen-btn"
            onClick={() => setIsFullscreen(true)}
            title="Expand to fullscreen"
          >
            ⛶
          </button>
        </div>
        <div className="viz-content">{children}</div>
      </div>

      <FullscreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title={title}
      >
        {fullscreenChildren || children}
      </FullscreenModal>
    </>
  );
};
