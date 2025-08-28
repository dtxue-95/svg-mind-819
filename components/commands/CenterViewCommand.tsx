
import React, { useCallback } from 'react';
import { FiCrosshair } from 'react-icons/fi';

interface CenterViewCommandProps {
    onCenterView: () => void;
}

export const CenterViewCommand: React.FC<CenterViewCommandProps> = ({ onCenterView }) => {
    return (
        <button onClick={onCenterView} className="bottom-toolbar__button" title="Center View">
            <FiCrosshair />
        </button>
    );
};