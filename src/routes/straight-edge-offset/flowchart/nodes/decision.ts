import { FlowchartNode, type FlowchartNodeOptions } from "."

export class DecisionNode extends FlowchartNode {
    type = "decision"

    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
    }

    init() {
    }

    
    containsPoint(px: number, py: number) {
        return (
            Math.abs(px - this.x) / (this.width ) +
            Math.abs(py - this.y) / (this.height) <= 1
        )
    }
}

export default DecisionNode