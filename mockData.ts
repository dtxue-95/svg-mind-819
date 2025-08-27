import type { RawNode } from './types';

export const mockInitialData: RawNode = {
    "id": 283,
    "uuid":"99eebc90456741789ee8dae41d3f6359",
    "name": "V2测试",
    "nodeType": "rootNode",
    "childNodeList": [
        {
            "id": 510,
            "uuid":"2ccbc90456741789ee8dae41u5dsa3444",
            "name": "接口用例列表管理模块",
            "generateModeName":"人工",
            "nodeType": "moduleNode",
            "childNodeList": [
                {
                    "id": 736,
                    "parentId": 510,
                    "uuid":"2ccbc90456741789ee8dae41u5dsa3447",
                    "name": "接口导入功能",
                    "nodeType": "testPointNode",
                    "generateModeName":"AI",
                    "childNodeList": [{
                        "id": 2164,
                        "parentId": 736,
                        "uuid":"768bc90456741789ee8dae41u5dsa3447",
                        "name": "成功导入接口数据",
                        "nodeType": "caseNode",
                        "priorityLevel":"0",
                        "functionTestCaseDTO":{
                            "testCaseName":"成功导入接口数据",
                            "testCaseType":"1",
                            "testCaseType_name":"接口用例",
                            "testCaseDesc":"成功导入接口数据",
                            "testCaseStep":"1. 点击导入按钮\n2. 选择接口文档\n3. 点击导入\n4. 查看用例列表",
                            "testCaseExpect":"1. 用例列表中显示导入的接口数据",
                            "testCasePriority":"0",
                            "testCasePriority_name":"P0",
                            "testCaseTagList":[],
                            "finalStatusName": "待执行",
                            "finalStatus": "pending_execution",
                            "executionStatus": "not_run",
                            "executionStatusName": "未运行"
                        },
                        "childNodeList": [{
                            "name":"用户已经登录系统，服务可用",
                            "nodeType":"preconditionNode",
                            "uuid":"768bc90456741789ee8qre41u5dsa3447"
                        },{
                            "name":"进入接口导入页面",
                            "nodeType":"stepNode",
                            "uuid":"768bc90123741789ee8qre41u5dsa3448",
                            "childNodeList":[
                                {
                                    "name":"页面正常加载，显示导入按钮",
                                    "nodeType":"resultNode",
                                    "uuid":"768bc9i872741789ee8qre41u5dsa3449"
                                }
                            ],
                            "sortNumber": 1
                        },
                        {
                            "name":"点击导入按钮，弹出导入弹窗",
                            "nodeType":"stepNode",
                            "uuid":"768bc90456741789ee8qre41u5dsa3448",
                            "childNodeList":[
                                {
                                    "name":"弹窗正常显示，包含文件上传区域和导入按钮",
                                    "nodeType":"resultNode",
                                    "uuid":"7iubc98653741789ee8qre41u5dsa3449"
                                }
                            ],
                            "sortNumber": 2
                        }]
                    }],
                },
                {
                    "id": 737,
                    "parentId": 510,
                    "uuid":"2ccbc90456741789ee8dae41u5dsa3448",
                    "name": "类目筛选功能",
                    "generateModeName":"AI",
                    "nodeType": "testPointNode",
                    "childNodeList": [
                        {
                        "id": 2165,
                        "parentId": 737,
                        "uuid":"702bc90456741789ee8dae41u5dsa3447",
                        "name": "按根节点筛选接口",
                        "generateModeName":"AI",
                        "nodeType": "caseNode",
                        "priorityLevel":"1",
                        "functionTestCaseDTO":{
                            "testCaseName":"按根节点筛选接口",
                            "testCaseType":"1",
                            "testCaseType_name":"接口用例",
                            "testCaseDesc":"按根节点筛选接口",
                            "testCaseStep":"1. 点击导入按钮\n2. 选择接口文档\n3. 点击导入\n4. 查看用例列表",
                            "testCaseExpect":"1. 用例列表中显示导入的接口数据",
                            "testCasePriority":"1",
                            "testCasePriority_name":"P1",
                            "testCaseTagList":[],
                            "finalStatusName": "通过",
                            "finalStatus": "passed",
                             "executionStatus": "not_run",
                            "executionStatusName": "未运行"
                        },
                        "apiTestCaseDTO":{
                            "testCaseName":"按根节点筛选接口",
                            "testCaseType":"1",
                            "testCaseType_name":"接口用例",
                            "testCaseDesc":"按根节点筛选接口",
                            "testCaseStep":"1. 点击导入按钮\n2. 选择接口文档\n3. 点击导入\n4. 查看用例列表",
                            "testCaseExpect":"1. 用例列表中显示导入的接口数据",
                            "testCasePriority":"1",
                            "testCasePriority_name":"P1",
                            "testCaseTagList":[],
                            "executionStatus": "running",
                            "executionStatusName": "执行中"
                        },
                        "uiTestCaseDTO":{
                            "testCaseName":"按根节点筛选接口",
                            "testCaseType":"1",
                            "testCaseType_name":"接口用例",
                            "testCaseDesc":"按根节点筛选接口",
                            "testCaseStep":"1. 点击导入按钮\n2. 选择接口文档\n3. 点击导入\n4. 查看用例列表",
                            "testCaseExpect":"1. 用例列表中显示导入的接口数据",
                            "testCasePriority":"1",
                            "testCasePriority_name":"P1",
                            "testCaseTagList":[],
                            "executionStatus": "run_failed",
                            "executionStatusName": "执行失败"
                        },
                        "childNodeList": [{
                            "name":"系统已经导入多个类目层级的接口数据",
                            "nodeType":"preconditionNode",
                            "uuid":"623bc90456741789ee8qre41u5dsa3447"
                        },{
                            "name":"用户点击根节点",
                            "nodeType":"stepNode",
                            "uuid":"234yc90123741789ee8qre41u5dsa3448",
                            "childNodeList":[
                                {
                                    "name":"根节点显示选中状态",
                                    "nodeType":"resultNode",
                                    "uuid":"oiw8c98653741789ee8qre41u5dsa3449"
                                }
                            ]
                        }]
                    }
                    ],
                },
                {
                    "id": 738,
                    "parentId": 510,
                    "uuid":"2ccbc90456741789ee8dae41u5dsa3449",
                    "name": "接口用例详情功能",
                    "nodeType": "testPointNode",
                    "childNodeList": [],
                },
                {
                    "id": 739,
                    "parentId": 510,
                    "uuid":"2ccbc90456741789ee8dae41u5dsa3450",
                    "name": "用例关联功能",
                    "nodeType": "testPointNode",
                    "childNodeList": [],
                }   
            ],
        },
        {
            "id": 511,
            "uuid":"2ccbc90456741789ee8dae41u5dsa3445",
            "name": "接口用例编辑管理模块",
            "generateModeName":"AI",
            "nodeType": "moduleNode",
            "childNodeList": [],
        },
        {
            "id": 512,
            "uuid":"2ccbc90456741789ee8dae41u5dsa3446",
            "name": "接口用例执行管理模块",
            "generateModeName":"AI",
            "nodeType": "moduleNode",
            "childNodeList": [],
        }
    ]
};
