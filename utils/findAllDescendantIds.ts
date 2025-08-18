import type { MindMapData } from '../types';

export const findAllDescendantUuids = (mindMap: MindMapData, nodeUuid: string): Set<string> => {
    const nodesToDelete = new Set<string>();
    const queue = [nodeUuid];

    while (queue.length > 0) {
        const currentUuid = queue.shift()!;
        nodesToDelete.add(currentUuid);
        const node = mindMap.nodes[currentUuid];
        if (node) {
            queue.push(...(node.childNodeList ?? []));
        }
    }

    return nodesToDelete;
};

export const countAllDescendants = (mindMap: MindMapData, nodeUuid: string): number => {
    const node = mindMap.nodes[nodeUuid];
    if (!node || !node.childNodeList || node.childNodeList.length === 0) {
        return 0;
    }

    let count = node.childNodeList.length;
    for (const childUuid of node.childNodeList) {
        const childNode = mindMap.nodes[childUuid];
        // Only count the immediate child and its descendants if it's not collapsed itself
        if (childNode && !childNode.isCollapsed) {
             count += countAllDescendants(mindMap, childUuid);
        } else if (childNode && childNode.isCollapsed) {
            // If the direct child is collapsed, we still need to count it and all its children.
            count += countAllDescendants(mindMap, childUuid);
        }
    }
    return count;
};

export const findAllAncestorUuids = (mindMap: MindMapData, nodeUuid: string): string[] => {
    const ancestors: string[] = [];
    let currentNode = mindMap.nodes[nodeUuid];

    while (currentNode && currentNode.parentUuid) {
        const parent = mindMap.nodes[currentNode.parentUuid];
        if (parent) {
            ancestors.push(parent.uuid!);
            currentNode = parent;
        } else {
            // Parent not found, break loop
            break;
        }
    }

    return ancestors;
};