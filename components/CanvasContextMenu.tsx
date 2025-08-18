import React from 'react';
import { FiMaximize, FiMinimize, FiCrosshair, FiBox } from 'react-icons/fi';
import { ContextMenuItem } from './ContextMenuItem';
import type { MindMapNodeData } from '../types';

interface CanvasContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onExpandAllNodes: () => void;
    onCollapseAllNodes: () => void;
    onFitView: () => void;
    onCenterView: () => void;
    isExpandAllDisabled: boolean;
    isCollapseAllDisabled: boolean;
    selectedNode: MindMapNodeData | null;
    onToggleCollapse: (nodeUuid: string) => void;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
    x, y, onClose, onExpandAllNodes, onCollapseAllNodes, onFitView, onCenterView, isExpandAllDisabled, isCollapseAllDisabled, selectedNode, onToggleCollapse
}) => {

    const handleExpandAll = () => { onExpandAllNodes(); onClose(); };
    const handleCollapseAll = () => { onCollapseAllNodes(); onClose(); };
    const handleFitView = () => { onFitView(); onClose(); };
    const handleCenterView = () => { onCenterView(); onClose(); };
    const handleToggleCollapse = () => {
        if (selectedNode?.uuid) {
            onToggleCollapse(selectedNode.uuid);
        }
        onClose();
    };

    const canToggleCollapse = selectedNode && selectedNode.childNodeList && selectedNode.childNodeList.length > 0;

    return (
        <div className="context-menu" style={{ top: y, left: x }} onContextMenu={(e) => e.preventDefault()}>
            <ul>
                {selectedNode && (
                    <>
                        <ContextMenuItem onClick={handleToggleCollapse} disabled={!canToggleCollapse}>
                            {selectedNode.isCollapsed ? <FiMaximize /> : <FiMinimize />}
                            {selectedNode.isCollapsed ? '展开当前节点' : '收起当前节点'}
                        </ContextMenuItem>
                        <ContextMenuItem isSeparator />
                    </>
                )}
                <ContextMenuItem onClick={handleExpandAll} disabled={isExpandAllDisabled}>
                    <FiMaximize /> 展开所有节点
                </ContextMenuItem>
                <ContextMenuItem onClick={handleCollapseAll} disabled={isCollapseAllDisabled}>
                    <FiMinimize /> 收起所有节点
                </ContextMenuItem>
                <ContextMenuItem onClick={handleCenterView}>
                    <FiCrosshair /> 居中
                </ContextMenuItem>
                <ContextMenuItem onClick={handleFitView}>
                    <FiBox /> 适应视图
                </ContextMenuItem>
            </ul>
        </div>
    );
};