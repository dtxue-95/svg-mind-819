# React SVG 思维导图组件

一个使用 React, TypeScript 和 SVG 构建的交互式思维导图组件。它允许用户以可视化方式创建、组织和编辑层级化的思想节点。

## 核心功能

- **节点操作**:
    - **添加/删除**: 支持添加子节点、同级节点和删除节点（包括所有后代）。
    - **编辑文本**: 双击节点即可编辑其文本内容。
    - **移动与排序**:
        - **自由拖拽 (`isDraggable`)**: 自由移动节点位置，不改变其父子关系。
        - **结构化拖拽 (`enableStrictDrag`)**: 根据预设规则拖拽节点以更改其父节点。
        - **同级排序 (`enableNodeReorder`)**: 通过拖拽对同级节点进行排序。
    - **键盘快捷键**: 支持 `Tab` (子节点), `Enter` (同级节点), `Delete` (删除), `Cmd/Ctrl+Z/Y` (撤销/重做) 等。
- **视图控制**:
    - **缩放与平移**: 支持鼠标滚轮缩放和画布拖拽平移。
    - **视图命令**: 一键适应视图、视图居中、全屏模式。
    - **小地图 (Minimap)**: 提供全局概览和快速导航功能。
- **布局与结构**:
    - **自动布局**: 一键整理所有节点，使其排列整齐。
    - **折叠/展开**: 支持单个节点或所有节点的折叠与展开。
- **状态管理**:
    - **历史记录**: 无限次撤销和重做。
    - **“未保存”状态 (`isDirty`)**: 自动追踪是否有未保存的更改，用于控制“保存”按钮的可用性。
    - **命令式 API**: 通过 `ref` 提供 `resetHistory()` 和 `setReadOnly()` 等方法，允许外部在保存成功后重置组件状态。
- **高度可定制**:
    - **工具栏**: 可完全自定义顶部和底部工具栏的按钮及其顺序。
    - **上下文菜单**: 为节点和画布提供功能丰富的右键菜单。
    - **节点属性**: 支持修改节点类型和优先级。
    - **回调函数**: 提供强大的 `onDataChange`, `onSave`, `onExecuteUseCase` 回调，轻松与外部应用状态集成。
    - **外观**: 可自定义画布背景、节点背景色、AI 标签等。
    - **自定义面板 (`Panel`)**: 允许在画布的任意位置渲染自定义 React 组件。

---

## 快速上手

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { mockInitialData } from './mockData';
import './styles.css';

function SimpleExample() {
    return (
        <div style={{width: '100%', height: '100vh'}}>
            <App initialData={mockInitialData} />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SimpleExample />
  </React.StrictMode>
);
```

---

## 综合用法示例

这个示例演示了更高级的用法，包括异步数据加载、处理保存逻辑、使用 `ref` 和各种回调。

```jsx
import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App, { AppRef, Panel, DataChangeInfo, MindMapNodeData, RawNode, OperationType } from './App';
import './styles.css';

// 模拟一个 API 调用
const fakeApi = {
  fetchData: (): Promise<RawNode> => new Promise(resolve => setTimeout(() => resolve({
    uuid: "async-root-uuid",
    name: "从 API 加载的数据",
    nodeType: "rootNode",
    childNodeList: [{ uuid: "async-child-1", name: "第一个子节点", nodeType: "moduleNode" }]
  }), 1500)),
  saveData: (data: RawNode): Promise<{success: boolean}> => new Promise(resolve => {
    console.log("正在向服务器保存数据...", data);
    // 模拟一个可能失败的保存操作
    const isSuccess = Math.random() > 0.2;
    setTimeout(() => {
      console.log(isSuccess ? "保存成功！" : "保存失败！");
      resolve({ success: isSuccess });
    }, 1000);
  }),
};


function ComprehensiveExample() {
    const mindMapRef = useRef<AppRef>(null);
    const [mindMapData, setMindMapData] = useState<RawNode | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. 异步加载初始数据
    useEffect(() => {
      fakeApi.fetchData().then(data => {
        setMindMapData(data);
        setIsLoading(false);
      });
    }, []);

    // 2. onDataChange 回调：监听所有内部变更
    const handleDataChange = (info: DataChangeInfo) => {
        if (info.operationType !== OperationType.LOAD_DATA) {
            console.log(`操作类型: ${info.operationType}`, info);
        }
    };

    // 3. onSave 回调：处理用户点击“保存”按钮的逻辑
    const handleSave = async (info: DataChangeInfo) => {
        console.log("UI 保存按钮被点击，准备保存...");
        
        try {
            const result = await fakeApi.saveData(info.currentRawData);

            if (result.success) {
                // 4. 保存成功：重置历史记录并设为只读
                alert("保存成功！");
                mindMapRef.current?.resetHistory();
                mindMapRef.current?.setReadOnly(true);
            } else {
                // 5. 保存失败：提示用户，并保持编辑状态
                alert("保存失败，请检查网络后重试。");
            }
        } catch (error) {
            alert("保存时发生未知错误。");
            console.error(error);
        }
    };
    
    // 6. onExecuteUseCase 回调
    const handleExecuteUseCase = (info: DataChangeInfo) => {
      alert(`正在执行用例: ${info.currentNode?.name}`);
    };
    
    // 7. 使用 ref API 从外部触发操作
    const handleSetNewData = () => {
        const newData = { uuid: "new-data-root", name: "由外部设置的全新数据", nodeType: "rootNode" };
        mindMapRef.current?.setData(newData);
    };

    if (isLoading) {
        return <div>正在加载思维导图...</div>;
    }

    return (
        <div style={{width: '100%', height: '100vh', position: 'relative'}}>
            <div style={{ position: 'absolute', top: 5, left: 5, zIndex: 100, background: '#fff', padding: '5px', borderRadius: '5px' }}>
              <button onClick={handleSetNewData}>从外部设置新数据</button>
            </div>

            <App
              ref={mindMapRef}
              initialData={mindMapData!}
              onDataChange={handleDataChange}
              onSave={handleSave}
              onExecuteUseCase={handleExecuteUseCase}
              showMinimap={true}
              // 初始进入编辑模式
              isReadOnly={false} 
            >
              <Panel position="top-left">
                <div style={{padding: '10px', background: 'rgba(255,255,255,0.8)', borderRadius: '8px', border: '1px solid #ddd', marginTop: '30px'}}>
                    <h3>综合示例</h3>
                    <p>尝试编辑节点，然后点击保存。</p>
                </div>
              </Panel>
            </App>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ComprehensiveExample />);
```

---

## API 参考

### Props (`App` 组件)

| Prop 名称                  | 类型                                       | 描述                                                                                                                                                             | 默认值                                                   |
| -------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `initialData`              | `RawNode`                                  | 用于初始化思维导图的层级化数据结构。在组件挂载后，此 Prop 的变更**不会**自动更新导图，请使用 `ref.current.setData()` 方法。                                         | 内置的示例数据                                           |
| `children`                 | `React.ReactNode`                          | 在画布上渲染自定义子组件，通常与 `<Panel>` 组件结合使用。                                                                                                        | `undefined`                                              |
| `onDataChange`             | `(info: DataChangeInfo) => void`           | **核心回调**。当导图数据发生任何变更时触发。                                                                                                                     | `(info) => console.log(...)`                             |
| `onSave`                   | `(info: DataChangeInfo) => void`           | 当用户点击工具栏中的“保存”按钮时触发的回调函数。**这是实现保存逻辑的主要入口。**                                                                                   | `(info) => console.log(...)`                             |
| `onExecuteUseCase`         | `(info: DataChangeInfo) => void`           | 当用户通过上下文菜单或 API 执行用例时触发的回调函数。                                                                                                            | `(info) => console.log(...)`                             |
| `getNodeBackgroundColor`   | `(node: MindMapNodeData) => string`        | 一个回调函数，接收每个节点的数据并返回一个 CSS 颜色字符串作为节点背景色。                                                                                          | `undefined`                                              |
| `isDraggable`              | `boolean`                                  | 是否允许用户通过拖拽自由移动节点位置（不改变父子关系）。                                                                                                         | `false`                                                  |
| `enableStrictDrag`         | `boolean`                                  | 是否启用结构化拖拽模式，允许节点根据规则重新父级化。                                                                                                             | `true`                                                   |
| `enableNodeReorder`        | `boolean`                                  | 是否允许通过拖拽来对同级节点进行排序。                                                                                                                           | `true`                                                   |
| `reorderableNodeTypes`     | `NodeType[]`                               | 定义了哪些节点类型可以被拖拽挂载和排序。                                                                                                                         | `['MODULE', 'TEST_POINT', 'USE_CASE', 'STEP']`           |
| `enableUseCaseExecution`   | `boolean`                                  | 是否启用“执行用例”功能。                                                                                                                                         | `true`                                                   |
| `enableReadOnlyUseCaseExecution` | `boolean`                            | 在只读模式下，是否允许通过右键菜单执行用例。                                                                                                                     | `true`                                                   |
| `strictMode`               | `boolean`                                  | 是否启用严格模式，强制执行节点层级规则。                                                                                                                         | `true`                                                   |
| `showAITag`                | `boolean`                                  | 是否显示 `generateModeName: 'AI'` 节点的 AI 标识。                                                                                                                   | `true`                                                   |
| `showNodeType`             | `boolean`                                  | 是否在节点上显示其类型标签。                                                                                                                                     | `true`                                                   |
| `showPriority`             | `boolean`                                  | 是否在节点上显示其优先级标签。                                                                                                                                   | `true`                                                   |
| `showMinimap`              | `boolean`                                  | 是否显示右下角的小地图预览。                                                                                                                                     | `false`                                                  |
| `canvasBackgroundColor`    | `string`                                   | 自定义画布的背景颜色。                                                                                                                                           | `'#f7f7f7'`                                              |
| `showBackgroundDots`       | `boolean`                                  | 是否在画布背景上显示网格点。                                                                                                                                     | `true`                                                   |
| `showTopToolbar`, `showBottomToolbar` | `boolean`                       | 是否显示顶部/底部工具栏。                                                                                                                                        | `true`                                                   |
| `topToolbarCommands`       | `CommandId[]`                              | 自定义顶部工具栏中显示的按钮及其顺序。                                                                                                                           | `[...]` (默认命令)                                       |
| `bottomToolbarCommands`    | `CommandId[]`                              | 自定义底部工具栏中显示的按钮及其顺序。                                                                                                                           | `[...]` (默认命令)                                       |
| `showContextMenu`, `showCanvasContextMenu` | `boolean`                    | 是否显示节点/画布的右键上下文菜单。                                                                                                                              | `true`                                                   |
| `priorityEditableNodeTypes`| `NodeType[]`                               | 定义了哪些节点类型可以编辑其优先级。                                                                                                                             | `['MODULE', 'TEST_POINT', 'USE_CASE', 'GENERAL']`        |

### 命令式 API (`ref`)

通过 `ref` 访问组件实例上的方法，以实现对组件的外部控制。

```typescript
export interface AppRef {
  save: () => DataChangeInfo;
  executeUseCase: (nodeUuid: string) => void;
  setData: (newData: RawNode) => void;
  resetHistory: () => void;
  setReadOnly: (isReadOnly: boolean) => void;
}
```

- **`save(): DataChangeInfo`**
  - **作用**: 命令式地触发一次数据获取。
  - **返回**: 包含当前思维导图完整数据的 `DataChangeInfo` 对象。
  - **用途**: 当你需要从外部按钮或其他非思维导图UI触发保存时调用。它**不会**触发 `onSave` 回调。

- **`executeUseCase(nodeUuid: string)`**
  - **作用**: 触发指定 `uuid` 的用例节点的 `onExecuteUseCase` 回调。
  - **用途**: 从外部UI（如测试用例列表）触发用例执行。

- **`setData(newData: RawNode)`**
  - **作用**: **完全替换**思维导图中的所有数据。
  - **用途**: 在组件挂载后，通过异步 API 获取数据并加载到导图中。调用此方法后，组件会自动重置历史记录并进入只读状态。

- **`resetHistory()`**
  - **作用**: **清空撤销/重做历史记录**，并将当前状态设为新的“原始”状态。
  - **用途**: **在外部保存操作成功后调用**。这将使 `isDirty` 状态变为 `false`，并禁用“保存”按钮，直到用户再次进行修改。

- **`setReadOnly(isReadOnly: boolean)`**
  - **作用**: 命令式地设置思维导图的只读状态。
  - **用途**: **在外部保存操作成功后调用**，将 `isReadOnly` 设为 `true`，以防止用户在保存后立即进行新的编辑。

---

## 核心工作流详解

### 1. 异步数据加载

组件初始化时需要 `initialData`。如果你的数据是异步获取的，请遵循以下模式：

1.  在父组件中设置一个 state（例如 `mindMapData`），初始值为 `null` 或一个空的骨架结构。
2.  在 `useEffect` 中获取数据，然后更新 `mindMapData` state。
3.  在渲染 `App` 组件时，可以先显示一个加载指示器，直到 `mindMapData` 加载完成。
4.  如果你需要在组件**已经渲染后**加载**全新的数据**（而不是第一次加载），请使用 `ref.current.setData(newData)` 方法。

### 2. 保存与状态管理（重要）

为了实现健壮的保存功能，组件内部的 `isDirty` 状态与外部的 `onSave` 回调和 `ref` 方法协同工作。

**推荐的保存流程如下：**

1.  **用户编辑**: 用户对思维导图进行任何修改（添加、删除、编辑文本等）。组件内部的 `isDirty` 状态变为 `true`。顶部工具栏的“保存”按钮自动变为可用状态。

2.  **触发保存**: 用户点击“保存”按钮。
    - 这会触发你传入的 `onSave` prop，并将包含最新数据的 `DataChangeInfo` 对象作为参数传递给你。

3.  **处理保存逻辑**: 在你的 `onSave` 函数中：
    - 调用你的后端 API 来保存 `info.currentRawData`。
    - `await` API 的返回结果。

4.  **处理 API 结果**:
    - **如果 API 调用成功**:
        - 向用户显示成功提示（如 `alert` 或 `toast`）。
        - 调用 `ref.current.resetHistory()`。这会清空撤销/重做栈，并将 `isDirty` 状态重置为 `false`，“保存”按钮会再次变为不可用。
        - 调用 `ref.current.setReadOnly(true)`。将思维导图设为只读模式，这是一个好习惯，可以防止用户在确认保存成功前进行新的修改。
    - **如果 API 调用失败**:
        - 向用户显示错误提示。
        - **什么都不做**。不要调用 `resetHistory` 或 `setReadOnly`。这样，思维导图将保持在可编辑状态，`isDirty` 仍为 `true`，“保存”按钮也依然可用，用户可以修正问题或重试保存。

这个流程确保了组件的状态能够准确反映数据是否已成功持久化。

---

## 深入 `onDataChange` 回调

`onDataChange` 是一个强大的 prop，它会在思维导图内部发生**任何**有意义的变更时触发。

- **用途**: 实现自动保存、与外部状态（如 Redux）同步、驱动外部 UI（如显示选中节点的详细信息面板）、记录用户操作日志等。
- **与 `onSave` 的区别**: `onSave` 仅在用户**点击保存按钮**时触发，是用户意图明确的保存操作。而 `onDataChange` 在**每次变更**时都会触发，频率更高。
- **`DataChangeInfo` 对象**: 每次回调都会收到一个 `DataChangeInfo` 对象，其中最重要的字段是：
    - `operationType: OperationType`: **最关键的字段**。它告知你发生了什么操作（例如 `ADD_NODE`, `UPDATE_NODE_TEXT`, `SELECT_NODE`）。
    - `currentRawData: RawNode`: 变更**之后**整个思维导图的完整、**层级化**数据。这是保存或同步状态的理想格式。
    - `currentNode?: RawNode`: 操作中涉及的主要节点。

---

## 其他导出组件

### `<Panel>`

`<Panel>` 组件允许你在思维导图画布的指定位置渲染自定义内容。

- **Props**:
  - `position: PanelPosition`: 面板位置，如 `'top-left'`, `'bottom-center'` 等。
  - `children: React.ReactNode`: 要渲染的内容。
  - `className?: string`: 自定义 CSS 类。
  - `style?: React.CSSProperties`: 自定义内联样式。

---

## 数据结构

#### `RawNode` (输入/输出数据)

用于初始化或导出思维导图的层级数据对象。

```typescript
interface RawNode {
    id?: number | string;
    uuid?: string;
    name?: string;
    nodeType?: 'rootNode' | 'moduleNode' | 'testPointNode' | 'caseNode' | 'preconditionNode' | 'stepNode' | 'resultNode' | string;
    priorityLevel?: "0" | "1" | "2" | "3";
    childNodeList?: RawNode[];
    // ... 其他字段
}
```

#### `OperationType`

`operationType` 字段用于标识发生了何种类型的变更。

| 值                        | 描述                     |
| ------------------------- | ------------------------ |
| `ADD_NODE`                | 添加了一个新节点         |
| `DELETE_NODE`             | 删除了一个或多个节点     |
| `UPDATE_NODE_TEXT`        | 更新了节点的文本和尺寸   |
| `MOVE_NODE`               | 移动了节点位置           |
| `REORDER_NODE`            | 对同级节点进行了排序     |
| `TOGGLE_NODE_COLLAPSE`    | 展开或折叠了节点         |
| `LAYOUT`                  | 应用了自动布局           |
| `UNDO` / `REDO`           | 执行了撤销/重做操作      |
| `LOAD_DATA`               | 初始数据加载完成         |
| `SELECT_NODE`             | 选中或取消选中了一个节点 |
| `SAVE`                    | 触发了保存操作           |
| `EXECUTE_USE_CASE`        | 触发了用例执行操作       |

### 可定制命令 (`CommandId`)

你可以通过 `topToolbarCommands` 和 `bottomToolbarCommands` props 来自定义工具栏中显示的按钮。

**顶部工具栏可用命令:**
`'undo'`, `'redo'`, `'separator'`, `'addSibling'`, `'addChild'`, `'delete'`, `'save'`, `'closeTop'`

**底部工具栏可用命令:**
`'zoomOut'`, `'zoomIn'`, `'zoomDisplay'`, `'separator'`, `'toggleReadOnly'`, `'fitView'`, `'centerView'`, `'layout'`, `'fullscreen'`, `'search'`, `'closeBottom'`

bbbccc
