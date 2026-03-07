import type Flowchart from "./index"
import type StartNode  from "./nodes/start"
import type ProcessNode from "./nodes/process"
import type EndNode from "./nodes/end"
import type DecisionNode from "./nodes/decision"

import type Tool from "./chart-tools/index"
import type Node from "./nodes/index"


export type FlowchartTool = Tool
export type FlowchartNode = Node

export type FlowchartType = Flowchart
export type StartNodeType = StartNode
export type ProcessNodeType = ProcessNode
export type EndNodeType = EndNode
export type DecisionNodeType = DecisionNode

export type FlowchartPos = { x: number, y: number }