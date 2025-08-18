import React, { useImperativeHandle, forwardRef, useCallback, useState, useEffect, useMemo } from 'react';
import { useMindMap } from './hooks/useMindMap';
import { MindMapCanvas } from './components/MindMapCanvas';
import type { RawNode, CommandId, NodeType, DataChangeCallback, DataChangeInfo, MindMapNodeData } from './types';
import { OperationType } from './types';
import { createInitialMindMap } from './utils/createInitialMindMap';
import { convertDataChangeInfo } from './utils/callbackDataConverter';
import { getNodeChainByUuid } from './utils/dataChangeUtils';

// Export Panel component and types for external use
export { Panel } from './components/Panel';
export type { PanelPosition } from './components/Panel';
export type { RawNode, CommandId, NodeType, DataChangeCallback, DataChangeInfo, MindMapNodeData };


const defaultTopCommands: CommandId[] = ['undo', 'redo', 'separator', 'addSibling', 'addChild', 'delete', 'save', 'closeTop'];
const defaultBottomCommands: CommandId[] = ['zoomOut', 'zoomDisplay', 'zoomIn', 'separator', 'toggleReadOnly', 'fitView', 'centerView', 'layout', 'fullscreen', 'search', 'closeBottom'];
const defaultPriorityEditableNodeTypes: NodeType[] = ['MODULE', 'TEST_POINT', 'USE_CASE', 'GENERAL'];
const defaultReorderableNodeTypes: NodeType[] = ['MODULE', 'TEST_POINT', 'USE_CASE', 'STEP'];


export interface AppRef {
  save: () => DataChangeInfo;
  executeUseCase: (nodeUuid: string) => void;
  setData: (newData: RawNode) => void;
  resetHistory: () => void;
  setReadOnly: (isReadOnly: boolean) => void;
}

interface AppProps {
    initialData?: RawNode;
    showAITag?: boolean;
    isDraggable?: boolean;
    enableStrictDrag?: boolean;
    enableNodeReorder?: boolean;
    reorderableNodeTypes?: NodeType[];
    showNodeType?: boolean;
    showPriority?: boolean;
    showTopToolbar?: boolean;
    showBottomToolbar?: boolean;
    topToolbarCommands?: CommandId[];
    bottomToolbarCommands?: CommandId[];
    strictMode?: boolean;
    showContextMenu?: boolean;
    showCanvasContextMenu?: boolean;
    priorityEditableNodeTypes?: NodeType[];
    onDataChange?: DataChangeCallback;
    onSave?: (info: DataChangeInfo) => void;
    enableUseCaseExecution?: boolean;
    onExecuteUseCase?: (info: DataChangeInfo) => void;
    canvasBackgroundColor?: string;
    showBackgroundDots?: boolean;
    showMinimap?: boolean;
    getNodeBackgroundColor?: (node: MindMapNodeData) => string | null | undefined;
    enableReadOnlyUseCaseExecution?: boolean;
    children?: React.ReactNode;
}

const App = forwardRef<AppRef, AppProps>(({
    initialData = {} as RawNode,
    showAITag = true,
    isDraggable = false,
    enableStrictDrag = true,
    enableNodeReorder = true,
    reorderableNodeTypes = defaultReorderableNodeTypes,
    showNodeType = true,
    showPriority = true,
    showTopToolbar = true,
    showBottomToolbar = true,
    topToolbarCommands = defaultTopCommands,
    bottomToolbarCommands = defaultBottomCommands,
    strictMode = true,
    showContextMenu = true,
    showCanvasContextMenu = true,
    priorityEditableNodeTypes = defaultPriorityEditableNodeTypes,
    onDataChange = (info) => { console.log('Mind Map Data Changed:', info); },
    onSave = (info) => { console.log('Mind Map Data Save:', info); },
    enableUseCaseExecution = true,
    onExecuteUseCase = (info) => { console.log('Use Case Executed:', info); },
    canvasBackgroundColor = '#f7f7f7',
    showBackgroundDots = true,
    showMinimap = false,
    getNodeBackgroundColor,
    enableReadOnlyUseCaseExecution = true,
    children,
}, ref) => {
    // State to hold the data for the mind map. Initialized from props.
    const [currentData, setCurrentData] = useState<RawNode>(initialData);
    const [isReadOnly, setIsReadOnly] = useState(true);

    // Effect to update the internal state when the initialData prop changes.
    // This allows the mind map to update when data is loaded asynchronously.
    useEffect(() => {
        // We compare UUIDs to prevent unnecessary re-renders if the parent passes a new object with the same data.
        if (initialData?.uuid && initialData.uuid !== currentData?.uuid) {
            setCurrentData(initialData);
        }
    }, [initialData, currentData?.uuid]);

    // Create the mind map structure from the current data state.
    // useMemo ensures this expensive operation only runs when data changes.
    const initialMindMap = useMemo(() => createInitialMindMap(currentData), [currentData]);

    const {
        mindMap,
        addChildNode,
        addSiblingNode,
        deleteNode,
        updateNodePosition,
        reparentNode,
        reorderNode,
        triggerAutoLayout,
        updateNodeSizeAndLayout,
        finishNodeEditing,
        toggleNodeCollapse,
        expandNodes,
        expandAllNodes,
        collapseAllNodes,
        updateNodeType,
        updateNodePriority,
        undo,
        redo,
        canUndo,
        canRedo,
        isDirty,
        resetHistory,
    } = useMindMap(initialMindMap, strictMode, onDataChange);

    const constructSavePayload = useCallback((): DataChangeInfo => {
        const info = {
            operationType: OperationType.SAVE,
            timestamp: Date.now(),
            description: 'Data saved via trigger.',
            // For a save event, previous and current data are the same snapshot.
            previousData: mindMap,
            currentData: mindMap,
            affectedNodeUuids: Object.keys(mindMap.nodes),
        };
        // Use the existing converter to create the full payload
        return convertDataChangeInfo(info);
    }, [mindMap]);

    const handleExecuteUseCase = useCallback((nodeUuid: string) => {
        if (!onExecuteUseCase) return;

        const node = mindMap.nodes[nodeUuid];
        if (!node) return;
        
        const parentNode = node.parentUuid ? mindMap.nodes[node.parentUuid] : undefined;
        const chain = getNodeChainByUuid(mindMap, nodeUuid);

        const info = {
            operationType: OperationType.EXECUTE_USE_CASE,
            timestamp: Date.now(),
            description: `Triggered execution for use case '${node.name}'`,
            previousData: mindMap,
            currentData: mindMap,
            affectedNodeUuids: [nodeUuid],
            currentNode: node,
            parentNode,
            uuidChain: chain.uuids,
            uuidChainNodes: chain.nodes,
            parentUuidChain: chain.uuids.slice(0, -1),
            parentUuidChainNodes: chain.nodes.slice(0, -1),
        };

        onExecuteUseCase(convertDataChangeInfo(info));
    }, [mindMap, onExecuteUseCase]);

    useImperativeHandle(ref, () => ({
        save: () => {
            const saveData = constructSavePayload();
            return saveData;
        },
        executeUseCase: (nodeUuid: string) => {
            if (enableUseCaseExecution) {
                handleExecuteUseCase(nodeUuid);
            } else {
                console.warn('Use case execution is disabled via API props.');
            }
        },
        setData: (newData: RawNode) => {
            setCurrentData(newData);
            // After setting completely new data, we treat it as a new baseline.
            resetHistory();
            setIsReadOnly(true);
        },
        resetHistory: () => {
            resetHistory();
        },
        setReadOnly: (readOnly: boolean) => {
            setIsReadOnly(readOnly);
        }
    }), [constructSavePayload, enableUseCaseExecution, handleExecuteUseCase, resetHistory]);

    const handleSaveRequest = () => {
        if (onSave) {
            const saveData = constructSavePayload();
            onSave(saveData);
        }
    };

    const handleToggleReadOnly = useCallback(() => {
        setIsReadOnly(prev => !prev);
    }, []);

    return (
        <main>
            <MindMapCanvas
                mindMapData={mindMap}
                onAddChildNode={addChildNode}
                onAddSiblingNode={addSiblingNode}
                onDeleteNode={deleteNode}
                onFinishEditing={finishNodeEditing}
                onUpdateNodePosition={updateNodePosition}
                onReparentNode={reparentNode}
                onReorderNode={reorderNode}
                onLayout={triggerAutoLayout}
                onUpdateNodeSize={updateNodeSizeAndLayout}
                onToggleCollapse={toggleNodeCollapse}
                onExpandNodes={expandNodes}
                onSave={handleSaveRequest}
                showAITag={showAITag}
                isDraggable={isDraggable}
                enableStrictDrag={enableStrictDrag}
                enableNodeReorder={enableNodeReorder}
                reorderableNodeTypes={reorderableNodeTypes}
                showNodeType={showNodeType}
                showPriority={showPriority}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                showTopToolbar={showTopToolbar}
                showBottomToolbar={showBottomToolbar}
                topToolbarCommands={topToolbarCommands}
                bottomToolbarCommands={bottomToolbarCommands}
                strictMode={strictMode}
                showContextMenu={showContextMenu}
                showCanvasContextMenu={showCanvasContextMenu}
                onExpandAllNodes={expandAllNodes}
                onCollapseAllNodes={collapseAllNodes}
                onUpdateNodeType={updateNodeType}
                onUpdateNodePriority={updateNodePriority}
                priorityEditableNodeTypes={priorityEditableNodeTypes}
                onDataChange={onDataChange}
                onExecuteUseCase={handleExecuteUseCase}
                enableUseCaseExecution={enableUseCaseExecution}
                canvasBackgroundColor={canvasBackgroundColor}
                showBackgroundDots={showBackgroundDots}
                showMinimap={showMinimap}
                getNodeBackgroundColor={getNodeBackgroundColor}
                enableReadOnlyUseCaseExecution={enableReadOnlyUseCaseExecution}
                isReadOnly={isReadOnly}
                onToggleReadOnly={handleToggleReadOnly}
                isDirty={isDirty}
            >
                {children}
            </MindMapCanvas>
        </main>
    );
});

export default App;