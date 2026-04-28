import type Flowchart  from "../index"

export abstract class FlowchartTool {
    abstract name: string
    flowchart: Flowchart
    isActive = true
    options?: { [key: string]: any }

    constructor(flowchart: Flowchart, options?: { [key: string]: any }) {
        this.flowchart = flowchart
        this.options = { ...this.options, ...options }
    }

    activate() {
        this.isActive = true
    }

    deactivate() {
        this.isActive = false
    }
}

export default FlowchartTool