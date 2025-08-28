import React, { useState, useEffect, useCallback } from 'react';
import { FiMaximize, FiMinimize } from 'react-icons/fi';

interface FullscreenCommandProps {}

export const FullscreenCommand: React.FC<FullscreenCommandProps> = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleFullscreenChange = useCallback(() => {
        setIsFullscreen(!!document.fullscreenElement);
    }, []);

    useEffect(() => {
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [handleFullscreenChange]);

    const toggleFullscreen = useCallback(async () => {
        const element = document.getElementById('root'); // Or a more specific canvas parent
        if (!element) return;

        if (!document.fullscreenElement) {
            try {
                await element.requestFullscreen();
            } catch (err) {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            }
        } else {
            try {
                await document.exitFullscreen();
            } catch (err) {
                console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
            }
        }
    }, []);

    return (
        <button 
            onClick={toggleFullscreen} 
            className="bottom-toolbar__button" 
            title={isFullscreen ? "退出全屏" : "全屏"}
        >
            {isFullscreen ? <FiMinimize /> : <FiMaximize />}
        </button>
    );
};