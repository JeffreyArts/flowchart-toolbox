import { FlowchartNode, type FlowchartNodeOptions } from "."

export class StartNode extends FlowchartNode {
    type = "start"
    
    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
    }

    init() {
    }

    private get r()  { return this.height / 2 }
    private get lx() { return this.x - this.width / 2 + this.r }  // middelpunt linker cirkel
    private get rx() { return this.x + this.width / 2 - this.r }  // middelpunt rechter cirkel

    // containsPoint(mouseX: number, mouseY: number) {
    //     const { r, lx, rx, y } = this

    //     // Get distance between mouse and each circle center
    //     const distToRx = Math.hypot(mouseX - rx, mouseY - y)
    //     const distToLx = Math.hypot(mouseX - lx, mouseY - y)
    //     return ( distToRx <= r || distToLx <= r || (mouseX >= lx && mouseX <= rx && Math.abs(mouseY - y) <= r))
    // }
}

export default StartNode