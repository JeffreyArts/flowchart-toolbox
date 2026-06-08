import type Flowchart  from "../index"

export abstract class FlowchartTool {
    abstract name: string
    flowchart: Flowchart
    state = {
        active: true,
    }
    
    options?: { [key: string]: any }

    constructor(flowchart: Flowchart) {
        this.flowchart = flowchart
    }

    activate() {
        this.state.active = true
    }

    deactivate() {
        this.state.active = false
    }
}

export default FlowchartTool