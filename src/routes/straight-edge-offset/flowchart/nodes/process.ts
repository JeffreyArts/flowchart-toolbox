import { FlowchartNode, type FlowchartNodeOptions } from "."

export class ProcessNode extends FlowchartNode {
    type = "process"

    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
    }

    init() {
    }
}

export default ProcessNode