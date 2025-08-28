

import React from 'react';
import { FiZoomOut } from 'react-icons/fi';

interface ZoomOutCommandProps {
    onZoomOut: () => void;
    currentScale: number;
}

export const ZoomOutCommand: React.FC<ZoomOutCommandProps> = ({ onZoomOut, currentScale }) => {
    const isZoomOutDisabled = currentScale <= 0.1;

    return (
        <button
            onClick={onZoomOut}
            className="bottom-toolbar__button"
            title="Zoom Out"
            disabled={isZoomOutDisabled}
        >
            <FiZoomOut />
        </button>
    );
};