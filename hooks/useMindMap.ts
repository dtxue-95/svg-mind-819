import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useAutoLayout } from './useAutoLayout';
import { useNodeActions } from './useNodeActions';
import { autoLayout } from '../utils/autoLayout';
import { mindMapReducer, MindMapAction } from '../state/mindMapReducer';
import { createHistoryReducer } from './useMindMapState';
import type { MindMapData, NodeType, NodePriority, DataChangeCallback } from '../types';
import { OperationType } from '../types';
import { getNodeChainByUuid } from '../utils/dataChangeUtils';
import { convertDataChangeInfo } from '../utils/callbackDataConverter';
import { MIN_NODE_HEIGHT } from '../constants';

const historicMindMapReducer = createHistoryReducer(mindMapReducer, {
    ignoreActions: ['UPDATE_NODE_SIZE'],
});
const emptyMindMap: MindMapData = { rootUuid: '', nodes: {} };

export const useMindMap = (
    initialMindMap: MindMapData, 
    strictMode: boolean = false,
    onDataChange?: DataChangeCallback
) => {
    const [history, dispatch] = useReducer(historicMindMapReducer, {
        past: [],
        present: initialMindMap,
        future: [],
    });

    const { present: mindMap, past, future } = history;
    const canUndo = past.length > 0;
    const canRedo = future.length > 0;
    const isDirty = past.length > 0;
    
    const mindMapRef = useRef(mindMap);
    mindMapRef.current = mindMap;

    const onDataChangeRef = useRef(onDataChange);
    onDataChangeRef.current = onDataChange;
    
    const initialLoadFired = useRef(false);
    const initialLayoutDone = useRef(false);
    const isInitialMountRef = useRef(true);

    // This effect listens for changes in the initialMindMap prop (e.g., from an API call)
    // and resets the mind map state accordingly.
    useEffect(() => {
        // Don't reset on the very first render, as useReducer already initializes with this state.
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false;
            return;
        }

        // When new initial data is provided, reset the entire history.
        dispatch({ type: 'RESET_HISTORY', payload: initialMindMap });

        // Reset flags to allow re-triggering of initial layout and load events.
        initialLayoutDone.current = false;
        initialLoadFired.current = false;
    
    }, [initialMindMap]);

    const { triggerAutoLayout } = useAutoLayout(mindMap, dispatch, onDataChange);
    
    const { 
        addChildNode,
        addSiblingNode,
        deleteNode, 
        updateNodePosition,
        reparentNode,
    } = useNodeActions(mindMap, dispatch, autoLayout, strictMode, onDataChange);
    
    useEffect(() => {
        if (onDataChange && !initialLoadFired.current) {
            const info = {
                operationType: OperationType.LOAD_DATA,
                timestamp: Date.now(),
                description: 'Initial data loaded',
                previousData: emptyMindMap,
                currentData: initialMindMap,
            };
            onDataChange(convertDataChangeInfo(info));
            initialLoadFired.current = true;
        }
    }, [onDataChange, initialMindMap]);

    // This effect handles the initial auto-layout after all nodes have been measured.
    useEffect(() => {
        // We only want this to run once after the initial data load.
        if (initialLayoutDone.current || !mindMap.rootUuid) return;
        
        const nodes = Object.values(mindMap.nodes);
        if (nodes.length === 0) return;

        // Check if all nodes have a width defined. This signifies the end of the initial measurement pass.
        const allNodesMeasured = !nodes.some(n => typeof n.width === 'undefined');

        if (allNodesMeasured) {
            const laidOutMap = autoLayout(mindMap);

            if (onDataChangeRef.current) {
                const info = {
                    operationType: OperationType.LAYOUT,
                    timestamp: Date.now(),
                    description: 'Initial auto-layout applied',
                    previousData: mindMap,
                    currentData: laidOutMap,
                };
                onDataChangeRef.current(convertDataChangeInfo(info));
            }
            
            // Set the initial state without creating an undo history entry.
            dispatch({ type: 'RESET_HISTORY', payload: laidOutMap });
            initialLayoutDone.current = true;
        }
    }, [mindMap, dispatch]);

    const updateNodeSizeAndLayout = useCallback((nodeUuid: string, size: { width: number; height: number; }, options: { layout: boolean } = { layout: true }) => {
        const currentMindMap = mindMapRef.current;
        const node = currentMindMap.nodes[nodeUuid];
        if (!node || (node.width === size.width && node.height === size.height)) {
            return;
        }

        if (options.layout) {
            const stateWithUpdatedSize = {
                ...currentMindMap,
                nodes: {
                    ...currentMindMap.nodes,
                    [nodeUuid]: { ...node, width: size.width, height: size.height },
                },
            };
            // This is a "final" size update that requires a full layout.
            const laidOutMap = autoLayout(stateWithUpdatedSize);
            if (onDataChangeRef.current) {
                const info = {
                    operationType: OperationType.LAYOUT,
                    timestamp: Date.now(),
                    description: `Updated size for node '${node.name}' and re-laid out`,
                    previousData: currentMindMap,
                    currentData: laidOutMap,
                    affectedNodeUuids: [nodeUuid],
                    updatedNodes: [laidOutMap.nodes[nodeUuid]],
                };
                onDataChangeRef.current(convertDataChangeInfo(info));
            }
            dispatch({ type: 'SET_MIND_MAP', payload: laidOutMap });
        } else {
            // This is a "temporary" size update (e.g., initial measure, live textarea resize).
            // Just update the node size in the state without re-laying out the whole tree.
            dispatch({ type: 'UPDATE_NODE_SIZE', payload: { nodeUuid, width: size.width, height: size.height } });
        }
    }, [dispatch]);
    
    const finishNodeEditing = useCallback((
        nodeUuid: string, 
        name: string, 
        size: { width: number; height: number; },
        initialSize: { width: number; height: number; }
    ) => {
        const currentMindMap = mindMapRef.current;
        const node = currentMindMap.nodes[nodeUuid];
        if (!node) return;

        // This is the state we want to archive for undo.
        // It has the old text (from currentMindMap) and the old size (passed in).
        const stateBeforeEdit = {
            ...currentMindMap,
            nodes: {
                ...currentMindMap.nodes,
                [nodeUuid]: {
                    ...node,
                    width: initialSize.width,
                    height: initialSize.height,
                },
            },
        };

        // This is the state with final text and size, before layout.
        const stateWithUpdates = {
            ...currentMindMap,
            nodes: {
                ...currentMindMap.nodes,
                [nodeUuid]: { ...node, name, width: size.width, height: size.height },
            },
        };
        // This is the final state after layout.
        const laidOutMap = autoLayout(stateWithUpdates);

        if (onDataChangeRef.current) {
            const nodeAfter = laidOutMap.nodes[nodeUuid];
            const parentNode = laidOutMap.nodes[nodeAfter.parentUuid!];
            const chain = getNodeChainByUuid(laidOutMap, nodeUuid);
            const info = {
                operationType: OperationType.UPDATE_NODE_TEXT,
                timestamp: Date.now(),
                description: `Updated node '${node.name}'`,
                previousData: stateBeforeEdit, // Use the corrected "before" state
                currentData: laidOutMap,
                affectedNodeUuids: [nodeUuid],
                updatedNodes: [nodeAfter],
                currentNode: nodeAfter,
                parentNode: parentNode,
                uuidChain: chain.uuids,
                uuidChainNodes: chain.nodes,
                parentUuidChain: chain.uuids.slice(0, -1),
                parentUuidChainNodes: chain.nodes.slice(0, -1),
            };
            onDataChangeRef.current(convertDataChangeInfo(info));
        }
        
        // This special action manually sets the 'past' and 'present' states.
        dispatch({ type: 'COMMIT_EDIT', payload: { stateToArchive: stateBeforeEdit, newPresentState: laidOutMap } });
    }, [dispatch]);


    const undo = useCallback(() => {
        if (!canUndo) return;
        
        if (onDataChange) {
            const nextState = past[past.length - 1];
            const info = {
                operationType: OperationType.UNDO,
                timestamp: Date.now(),
                description: 'Undo last action',
                previousData: mindMap,
                currentData: nextState,
                affectedNodeUuids: Object.keys(nextState.nodes),
            };
            onDataChange(convertDataChangeInfo(info));
        }
        dispatch({ type: 'UNDO' });
    }, [canUndo, mindMap, past, dispatch, onDataChange]);

    const redo = useCallback(() => {
        if (!canRedo) return;
        
        if (onDataChange) {
            const nextState = future[0];
            const info = {
                operationType: OperationType.REDO,
                timestamp: Date.now(),
                description: 'Redo last action',
                previousData: mindMap,
                currentData: nextState,
                affectedNodeUuids: Object.keys(nextState.nodes),
            };
            onDataChange(convertDataChangeInfo(info));
        }
        dispatch({ type: 'REDO' });
    }, [canRedo, mindMap, future, dispatch, onDataChange]);


    const toggleNodeCollapse = useCallback((nodeUuid: string) => {
        const node = mindMap.nodes[nodeUuid];
        if (!node || !node.parentUuid) return;

        const nextState = mindMapReducer(mindMap, { type: 'TOGGLE_NODE_COLLAPSE', payload: { nodeUuid } });
        const laidOutMap = autoLayout(nextState);
        
        if (onDataChange) {
            const chain = getNodeChainByUuid(laidOutMap, nodeUuid);
            const info = {
                operationType: OperationType.TOGGLE_NODE_COLLAPSE,
                timestamp: Date.now(),
                description: `Node '${node.name}' ${node.isCollapsed ? 'expanded' : 'collapsed'}'`,
                previousData: mindMap,
                currentData: laidOutMap,
                affectedNodeUuids: [nodeUuid],
                updatedNodes: [laidOutMap.nodes[nodeUuid]],
                currentNode: laidOutMap.nodes[nodeUuid],
                parentNode: laidOutMap.nodes[node.parentUuid],
                uuidChain: chain.uuids,
                uuidChainNodes: chain.nodes,
                parentUuidChain: chain.uuids.slice(0, -1),
                parentUuidChainNodes: chain.nodes.slice(0, -1),
            };
            onDataChange(convertDataChangeInfo(info));
        }

        dispatch({ type: 'SET_MIND_MAP', payload: laidOutMap });
    }, [mindMap, dispatch, onDataChange]);

    const expandNodes = useCallback((nodeUuids: string[]) => {
        if (nodeUuids.length === 0) return;

        const nextState = mindMapReducer(mindMap, { type: 'EXPAND_NODES', payload: { nodeUuids } });
        if (nextState === mindMap) return;
        const laidOutMap = autoLayout(nextState);

        if (onDataChange) {
            const info = {
                operationType: OperationType.TOGGLE_NODE_COLLAPSE,
                timestamp: Date.now(),
                description: `Expanded ${nodeUuids.length} node(s)`,
                previousData: mindMap,
                currentData: laidOutMap,
                affectedNodeUuids: nodeUuids,
                updatedNodes: nodeUuids.map(uuid => laidOutMap.nodes[uuid]),
            };
            onDataChange(convertDataChangeInfo(info));
        }

        dispatch({ type: 'SET_MIND_MAP', payload: laidOutMap });
    }, [mindMap, dispatch, onDataChange]);

    const expandAllNodes = useCallback(() => {
        const nextState = mindMapReducer(mindMap, { type: 'EXPAND_ALL_NODES' });
        if (nextState === mindMap) return;
        const laidOutMap = autoLayout(nextState);

        if (onDataChange) {
             const changedNodes = Object.values(laidOutMap.nodes).filter(
                (node, i) => node.isCollapsed !== Object.values(mindMap.nodes)[i].isCollapsed
            );
            const info = {
                operationType: OperationType.TOGGLE_NODE_COLLAPSE,
                timestamp: Date.now(),
                description: 'Expanded all nodes',
                previousData: mindMap,
                currentData: laidOutMap,
                affectedNodeUuids: changedNodes.map(n => n.uuid!),
                updatedNodes: changedNodes,
            };
            onDataChange(convertDataChangeInfo(info));
        }
        dispatch({ type: 'SET_MIND_MAP', payload: laidOutMap });
    }, [mindMap, dispatch, onDataChange]);

    const collapseAllNodes = useCallback(() => {
        const nextState = mindMapReducer(mindMap, { type: 'COLLAPSE_ALL_NODES' });
        if (nextState === mindMap) return;
        const laidOutMap = autoLayout(nextState);

        if (onDataChange) {
            const changedNodes = Object.values(laidOutMap.nodes).filter(
                (node, i) => node.isCollapsed !== Object.values(mindMap.nodes)[i].isCollapsed
            );
            const info = {
                operationType: OperationType.TOGGLE_NODE_COLLAPSE,
                timestamp: Date.now(),
                description: 'Collapsed all nodes',
                previousData: mindMap,
                currentData: laidOutMap,
                affectedNodeUuids: changedNodes.map(n => n.uuid!),
                updatedNodes: changedNodes,
            };
            onDataChange(convertDataChangeInfo(info));
        }
        dispatch({ type: 'SET_MIND_MAP', payload: laidOutMap });
    }, [mindMap, dispatch, onDataChange]);

    const updateNodeType = useCallback((nodeUuid: string, nodeType: NodeType) => {
        const action: MindMapAction = { type: 'UPDATE_NODE_TYPE', payload: { nodeUuid, nodeType } };
        const nextState = mindMapReducer(mindMap, action);
        if (nextState === mindMap) return;

        if (onDataChange) {
            const nodeBefore = mindMap.nodes[nodeUuid];
            const nodeAfter = nextState.nodes[nodeUuid];
            const parentNode = nextState.nodes[nodeAfter.parentUuid!];
            const chain = getNodeChainByUuid(nextState, nodeUuid);
            const info = {
                operationType: OperationType.UPDATE_NODE_TYPE,
                timestamp: Date.now(),
                description: `Changed node '${nodeBefore.name}' type to ${nodeType}`,
                previousData: mindMap,
                currentData: nextState,
                affectedNodeUuids: [nodeUuid],
                updatedNodes: [nodeAfter],
                currentNode: nodeAfter,
                parentNode: parentNode,
                uuidChain: chain.uuids,
                uuidChainNodes: chain.nodes,
                parentUuidChain: chain.uuids.slice(0, -1),
                parentUuidChainNodes: chain.nodes.slice(0, -1),
            };
            onDataChange(convertDataChangeInfo(info));
        }
        dispatch(action);
    }, [mindMap, dispatch, onDataChange]);

    const updateNodePriority = useCallback((nodeUuid: string, priorityLevel: NodePriority) => {
        const action: MindMapAction = { type: 'UPDATE_NODE_PRIORITY', payload: { nodeUuid, priorityLevel } };
        const nextState = mindMapReducer(mindMap, action);
        if (nextState === mindMap) return;

        if (onDataChange) {
            const nodeBefore = mindMap.nodes[nodeUuid];
            const nodeAfter = nextState.nodes[nodeUuid];
            const parentNode = nextState.nodes[nodeAfter.parentUuid!];
            const chain = getNodeChainByUuid(nextState, nodeUuid);
            const info = {
                operationType: OperationType.UPDATE_NODE_PRIORITY,
                timestamp: Date.now(),
                description: `Updated priorityLevel for node '${nodeAfter.name}' to ${priorityLevel}`,
                previousData: mindMap,
                currentData: nextState,
                affectedNodeUuids: [nodeUuid],
                updatedNodes: [nodeAfter],
                currentNode: nodeAfter,
                parentNode: parentNode,
                uuidChain: chain.uuids,
                uuidChainNodes: chain.nodes,
                parentUuidChain: chain.uuids.slice(0, -1),
                parentUuidChainNodes: chain.nodes.slice(0, -1),
            };
            onDataChange(convertDataChangeInfo(info));
        }
        dispatch(action);
    }, [mindMap, dispatch, onDataChange]);
    
    const reorderNode = useCallback((draggedNodeUuid: string, targetSiblingUuid: string, position: 'before' | 'after') => {
        const action: MindMapAction = { type: 'REORDER_NODE', payload: { draggedNodeUuid, targetSiblingUuid, position } };
        const nextState = mindMapReducer(mindMap, action);
        if (nextState === mindMap) return; // No change, probably blocked by constraint

        // After reordering, update the sortNumber for all siblings
        const parentUuid = nextState.nodes[draggedNodeUuid]?.parentUuid;
        let stateWithSortedChildren = nextState;

        if (parentUuid) {
            const parentNode = nextState.nodes[parentUuid];
            const updatedNodes = { ...nextState.nodes };
            if (parentNode?.childNodeList) {
                parentNode.childNodeList.forEach((childUuid, index) => {
                    if (updatedNodes[childUuid]) {
                        updatedNodes[childUuid] = { ...updatedNodes[childUuid], sortNumber: index + 1 };
                    }
                });
                stateWithSortedChildren = { ...nextState, nodes: updatedNodes };
            }
        }

        const laidOutMap = autoLayout(stateWithSortedChildren);

        if (onDataChangeRef.current) {
            const nodeAfter = laidOutMap.nodes[draggedNodeUuid];
            const parentNode = laidOutMap.nodes[nodeAfter.parentUuid!];
            const chain = getNodeChainByUuid(laidOutMap, draggedNodeUuid);
            const info = {
                operationType: OperationType.REORDER_NODE,
                timestamp: Date.now(),
                description: `Reordered node '${nodeAfter.name}'`,
                previousData: mindMap,
                currentData: laidOutMap,
                affectedNodeUuids: [draggedNodeUuid],
                updatedNodes: [nodeAfter],
                currentNode: nodeAfter,
                parentNode: parentNode,
                uuidChain: chain.uuids,
                uuidChainNodes: chain.nodes,
                parentUuidChain: chain.uuids.slice(0, -1),
                parentUuidChainNodes: chain.nodes.slice(0, -1),
            };
            onDataChangeRef.current(convertDataChangeInfo(info));
        }

        dispatch({ type: 'SET_MIND_MAP', payload: laidOutMap });
    }, [mindMap, dispatch, onDataChange]);
    
    const resetHistory = useCallback(() => {
        dispatch({ type: 'CLEAR_HISTORY' });
    }, [dispatch]);


    return {
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
    };
};