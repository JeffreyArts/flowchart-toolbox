import type { st } from "vue-router/dist/index-DFCq6eJK.js"
import type Flowchart  from "../index"

export abstract class FlowchartTool {
    abstract name: string
    flowchart: Flowchart
    isActive = true
    options?: { [key: string]: string | number | boolean }

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