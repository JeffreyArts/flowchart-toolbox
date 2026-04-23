import Flowchart, { type FlowchartOptions } from "."

// Tools
import { PanTool } from "./chart-tools/pan"
import { ZoomTool } from "./chart-tools/zoom"
import { MoveNodeTool } from "./chart-tools/move-node"

// Nodes
import StartNode from "./nodes/types/start"
import EndNode from "./nodes/types/end"
import DecisionNode from "./nodes/types/decision"
import ProcessNode from "./nodes/types/process"


// Edges
import drawStraightEdge from "./edges/draw/straight"
import drawElbowEdge from "./edges/draw/elbow"
import drawZigZagEdge from "./edges/draw/zigzag"
import drawDiagonalEdge from "./edges/draw/diagonal"
import drawDoubleDiagonalEdge from "./edges/draw/double-diagonal"

export default class Joffa extends Flowchart {
    constructor(container: HTMLElement, options?: FlowchartOptions) {
        super(container, options)
        
        // Default tools
        this.register("tool","zoom", ZoomTool)
        this.register("tool","move-node", MoveNodeTool)
        this.register("tool","pan", PanTool)
        
        // Default Nodes
        this.register("node", "process", ProcessNode)
        this.register("node", "start", StartNode)
        this.register("node", "end", EndNode)
        this.register("node", "decision", DecisionNode)
        
        // Default edges
        this.register("edge", "straight", drawStraightEdge)
        this.register("edge", "elbow", drawElbowEdge)
        this.register("edge", "zigzag", drawZigZagEdge)
        this.register("edge", "diagonal", drawDiagonalEdge)
        this.register("edge", "double-diagonal", drawDoubleDiagonalEdge)
    }
}