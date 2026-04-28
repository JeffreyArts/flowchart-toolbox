import type Flowchart  from "../index"

export abstract class FlowchartTool {
    abstract name: string
    flowchart: Flowchart
    isActive = true
    options?: { [key: string]: any }

    constructor(flowchart: Flowchart) {
        this.flowchart = flowchart
    }

    activate() {
        this.isActive = true
    }

    deactivate() {
        this.isActive = false
    }
}

export default FlowchartTool