import { FlowchartNode, type FlowchartNodeOptions } from "."

export class ProcessNode extends FlowchartNode {
    type = "process"

    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
    }

    init() {
    }
    
    containsPoint(px: number, py: number) {
        return (
            px >= this.x - this.width  / 2 &&
            px <= this.x + this.width  / 2 &&
            py >= this.y - this.height / 2 &&
            py <= this.y + this.height / 2
        )
    }
}

export default ProcessNode