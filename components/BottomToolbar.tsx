import React from 'react';
import { FiSearch, FiLayout } from 'react-icons/fi';
import type { CanvasAction } from '../state/canvasReducer';
import type { CanvasState } from '../state/canvasState';
import type { MindMapData, CommandId, CanvasTransform } from '../types';
import { ZoomInCommand } from './commands/ZoomInCommand';
import { ZoomOutCommand } from './commands/ZoomOutCommand';
import { FitViewCommand } from './commands/FitViewCommand';
import { CenterViewCommand } from './commands/CenterViewCommand';
import { ToggleReadOnlyCommand } from './commands/ToggleReadOnlyCommand';
import { CloseToolbarCommand } from './commands/CloseToolbarCommand';
import { FullscreenCommand } from './commands/FullscreenCommand';

interface BottomToolbarProps {
    dispatch: React.Dispatch<CanvasAction>;
    canvasState: CanvasState;
    onLayout: () => void;
    commands: CommandId[];
    isReadOnly: boolean;
    onToggleReadOnly: () => void;
    onZoom: (scaleAmount: number) => void;
    onFitView: () => void;
    onCenterView: () => void;
    currentTransform: CanvasTransform | null;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
    dispatch,
    canvasState,
    onLayout,
    commands,
    isReadOnly,
    onToggleReadOnly,
    onZoom,
    onFitView,
    onCenterView,
    currentTransform
}) => {
    const { isSearchActive } = canvasState;

    const handleToggleSearch = () => {
        dispatch({ type: isSearchActive ? 'STOP_SEARCH' : 'START_SEARCH' });
    };

    const hasCloseButton = commands.includes('closeBottom');
    const mainCommands = commands.filter(c => c !== 'closeBottom');

    if (!currentTransform) return null;

    const renderCommand = (commandId: CommandId, index: number) => {
        switch (commandId) {
            case 'zoomOut':
                return <ZoomOutCommand key={`${commandId}-${index}`} onZoomOut={() => onZoom(1 / 1.2)} currentScale={currentTransform.scale} />;
            case 'zoomDisplay':
                return (
                    <div key={`${commandId}-${index}`} className="bottom-toolbar__zoom-display">
                        {Math.round(currentTransform.scale * 100)}%
                    </div>
                );
            case 'zoomIn':
                return <ZoomInCommand key={`${commandId}-${index}`} onZoomIn={() => onZoom(1.2)} currentScale={currentTransform.scale} />;
            case 'separator':
                return <div key={`${commandId}-${index}`} className="bottom-toolbar__separator" />;
            case 'toggleReadOnly':
                return <ToggleReadOnlyCommand key={`${commandId}-${index}`} onToggle={onToggleReadOnly} isReadOnly={isReadOnly} isActive={!isReadOnly} />;
            case 'fitView':
                return <FitViewCommand key={`${commandId}-${index}`} onFitView={onFitView} />;
            case 'centerView':
                return <CenterViewCommand key={`${commandId}-${index}`} onCenterView={onCenterView} />;
            case 'layout':
                return <button key={`${commandId}-${index}`} onClick={onLayout} className="bottom-toolbar__button" title="Auto-Layout"><FiLayout /></button>;
            case 'fullscreen':
                return <FullscreenCommand key={`${commandId}-${index}`} />;
            case 'search':
                return (
                    <button key={`${commandId}-${index}`} onClick={handleToggleSearch} className={`bottom-toolbar__button ${isSearchActive ? 'bottom-toolbar__button--active' : ''}`} title={isSearchActive ? 'Close Search' : 'Search Nodes'}>
                        <FiSearch />
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bottom-toolbar">
            {mainCommands.map(renderCommand)}
            {hasCloseButton && <CloseToolbarCommand dispatch={dispatch} />}
        </div>
    );
};