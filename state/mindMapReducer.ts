import type { MindMapData, NodeType, NodePriority } from '../types';
import { NODE_TYPE_PROPS } from '../constants';

export type MindMapAction =
    | { type: 'SET_MIND_MAP'; payload: MindMapData }
    | { type: 'UPDATE_NODE_TEXT'; payload: { nodeUuid: string; name: string } }
    | { type: 'UPDATE_NODE_TYPE'; payload: { nodeUuid: string; nodeType: NodeType } }
    | { type: 'UPDATE_NODE_PRIORITY'; payload: { nodeUuid: string; priorityLevel: NodePriority } }
    | { type: 'UPDATE_NODE_POSITION'; payload: { nodeUuid: string; position: { x: number; y: number } } }
    | { type: 'UPDATE_NODE_SIZE'; payload: { nodeUuid: string, width: number, height: number } }
    | { type: 'REPARENT_NODE'; payload: { nodeUuid: string; newParentUuid: string; oldParentUuid: string } }
    | { type: 'REORDER_NODE'; payload: { draggedNodeUuid: string; targetSiblingUuid: string; position: 'before' | 'after' } }
    | { type: 'TOGGLE_NODE_COLLAPSE', payload: { nodeUuid: string } }
    | { type: 'EXPAND_NODES', payload: { nodeUuids: string[] } }
    | { type: 'EXPAND_ALL_NODES' }
    | { type: 'COLLAPSE_ALL_NODES' };

export const mindMapReducer = (state: MindMapData, action: MindMapAction): MindMapData => {
    switch (action.type) {
        case 'SET_MIND_MAP':
            return action.payload;
        
        case 'UPDATE_NODE_TEXT': {
            const { nodeUuid, name } = action.payload;
            if (!state.nodes[nodeUuid]) return state;
            return {
                ...state,
                nodes: {
                    ...state.nodes,
                    [nodeUuid]: {
                        ...state.nodes[nodeUuid],
                        name,
                    },
                },
            };
        }

        case 'UPDATE_NODE_TYPE': {
            const { nodeUuid, nodeType } = action.payload;
            const node = state.nodes[nodeUuid];
            if (!node) return state;

            return {
                ...state,
                nodes: {
                    ...state.nodes,
                    [nodeUuid]: {
                        ...node,
                        nodeType,
                        name: NODE_TYPE_PROPS[nodeType].label,
                    },
                },
            };
        }

        case 'UPDATE_NODE_PRIORITY': {
            const { nodeUuid, priorityLevel } = action.payload;
            const node = state.nodes[nodeUuid];
            if (!node) return state;

            return {
                ...state,
                nodes: {
                    ...state.nodes,
                    [nodeUuid]: {
                        ...node,
                        priorityLevel,
                    },
                },
            };
        }

        case 'UPDATE_NODE_POSITION': {
            const { nodeUuid, position } = action.payload;
            if (!state.nodes[nodeUuid]) return state;
            return {
                ...state,
                nodes: {
                    ...state.nodes,
                    [nodeUuid]: {
                        ...state.nodes[nodeUuid],
                        position,
                    },
                },
            };
        }

        case 'UPDATE_NODE_SIZE': {
            const { nodeUuid, width, height } = action.payload;
            const node = state.nodes[nodeUuid];
            if (!node) return state;
            if (node.width === width && node.height === height) return state;
            
            return {
                ...state,
                nodes: {
                    ...state.nodes,
                    [nodeUuid]: {
                        ...node,
                        width,
                        height,
                    },
                },
            };
        }

        case 'REPARENT_NODE': {
            const { nodeUuid, newParentUuid, oldParentUuid } = action.payload;
            const node = state.nodes[nodeUuid];
            const oldParent = state.nodes[oldParentUuid];
            const newParent = state.nodes[newParentUuid];

            if (!node || !oldParent || !newParent) return state;

            return {
                ...state,
                nodes: {
                    ...state.nodes,
                    [nodeUuid]: {
                        ...node,
                        parentUuid: newParentUuid,
                    },
                    [oldParentUuid]: {
                        ...oldParent,
                        childNodeList: (oldParent.childNodeList ?? []).filter(uuid => uuid !== nodeUuid),
                    },
                    [newParentUuid]: {
                        ...newParent,
                        childNodeList: [...(newParent.childNodeList ?? []), nodeUuid],
                    },
                },
            };
        }
        
        case 'REORDER_NODE': {
            const { draggedNodeUuid, targetSiblingUuid, position } = action.payload;
            const draggedNode = state.nodes[draggedNodeUuid];
            const parentUuid = draggedNode?.parentUuid;
            if (!parentUuid) return state;

            const parent = state.nodes[parentUuid];
            const children = parent.childNodeList ? [...parent.childNodeList] : [];

            // Constraint check for STEP vs PRECONDITION
            if (draggedNode.nodeType === 'STEP') {
                const preconditionIndex = children.findIndex(uuid => state.nodes[uuid]?.nodeType === 'PRECONDITION');
                if (preconditionIndex !== -1) {
                    const tempChildren = children.filter(uuid => uuid !== draggedNodeUuid);
                    let targetIndex = tempChildren.indexOf(targetSiblingUuid);
                    
                    let newIndex = position === 'before' ? targetIndex : targetIndex + 1;
                    
                    if (newIndex <= preconditionIndex) {
                        console.warn('A STEP node cannot be reordered to be before a PRECONDITION node.');
                        return state; // Abort
                    }
                }
            }
            
            // Reorder logic
            const originalIndex = children.indexOf(draggedNodeUuid);
            if (originalIndex === -1) return state;
            children.splice(originalIndex, 1);

            let insertAtIndex = children.indexOf(targetSiblingUuid);
            if (insertAtIndex === -1) return state;
            if (position === 'after') {
                insertAtIndex++;
            }
            children.splice(insertAtIndex, 0, draggedNodeUuid);

            return {
                ...state,
                nodes: {
                    ...state.nodes,
                    [parentUuid]: {
                        ...parent,
                        childNodeList: children,
                    }
                }
            };
        }
        
        case 'TOGGLE_NODE_COLLAPSE': {
            const { nodeUuid } = action.payload;
            const node = state.nodes[nodeUuid];
            if (!node) return state;
            return {
                ...state,
                nodes: {
                    ...state.nodes,
                    [nodeUuid]: {
                        ...node,
                        isCollapsed: !node.isCollapsed,
                    },
                },
            };
        }

        case 'EXPAND_NODES': {
            const { nodeUuids } = action.payload;
            const newNodes = { ...state.nodes };
            let changed = false;

            nodeUuids.forEach(nodeUuid => {
                const node = newNodes[nodeUuid];
                if (node && node.isCollapsed) {
                    newNodes[nodeUuid] = { ...node, isCollapsed: false };
                    changed = true;
                }
            });

            if (!changed) return state;

            return {
                ...state,
                nodes: newNodes,
            };
        }

        case 'EXPAND_ALL_NODES': {
            const newNodes = { ...state.nodes };
            let changed = false;
            Object.keys(newNodes).forEach(uuid => {
                if (newNodes[uuid].isCollapsed) {
                    newNodes[uuid] = { ...newNodes[uuid], isCollapsed: false };
                    changed = true;
                }
            });
            if (!changed) return state;
            return { ...state, nodes: newNodes };
        }

        case 'COLLAPSE_ALL_NODES': {
            const newNodes = { ...state.nodes };
            let changed = false;
            Object.keys(newNodes).forEach(uuid => {
                if (uuid !== state.rootUuid && !newNodes[uuid].isCollapsed) {
                    newNodes[uuid] = { ...newNodes[uuid], isCollapsed: true };
                    changed = true;
                }
            });
            if (!changed) return state;
            return { ...state, nodes: newNodes };
        }

        default:
            return state;
    }
};