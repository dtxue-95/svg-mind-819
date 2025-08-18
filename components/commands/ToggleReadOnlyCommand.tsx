
import React, { useCallback } from 'react';
import { FiLock, FiUnlock } from 'react-icons/fi';

interface ToggleReadOnlyCommandProps {
    onToggle: () => void;
    isReadOnly: boolean;
}

export const ToggleReadOnlyCommand: React.FC<ToggleReadOnlyCommandProps> = ({ onToggle, isReadOnly }) => {
    const handleToggle = useCallback(() => {
        onToggle();
    }, [onToggle]);

    return (
        <button onClick={handleToggle} className="bottom-toolbar__button" title={isReadOnly ? 'Enable Editing' : 'Read-Only Mode'}>
            {isReadOnly ? <FiLock /> : <FiUnlock />}
        </button>
    );
};