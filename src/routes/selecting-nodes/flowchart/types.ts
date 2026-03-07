import Flowchart from "./index"
import startNode  from "./nodes/start"
import processNode from "./nodes/process"

export type FlowchartType = Flowchart
export type StartNodeType = startNode
export type ProcessNodeType = processNode
export type FlowchartPos = { x: number, y: number }