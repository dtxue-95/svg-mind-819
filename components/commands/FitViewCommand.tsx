import React, { useCallback } from 'react';
import { FiBox } from 'react-icons/fi';

interface FitViewCommandProps {
    onFitView: () => void;
}

export const FitViewCommand: React.FC<FitViewCommandProps> = ({ onFitView }) => {
    return (
        <button onClick={onFitView} className="bottom-toolbar__button" title="Fit View">
            <FiBox />
        </button>
    );
};