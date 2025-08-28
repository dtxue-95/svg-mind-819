

import React from 'react';
import { FiZoomIn } from 'react-icons/fi';

interface ZoomInCommandProps {
    onZoomIn: () => void;
    currentScale: number;
}

export const ZoomInCommand: React.FC<ZoomInCommandProps> = ({ onZoomIn, currentScale }) => {
    const isZoomInDisabled = currentScale >= 4.0;

    return (
        <button
            onClick={onZoomIn}
            className="bottom-toolbar__button"
            title="Zoom In"
            disabled={isZoomInDisabled}
        >
            <FiZoomIn />
        </button>
    );
};