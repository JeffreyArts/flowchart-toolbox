import { FlowchartNode, type FlowchartNodeOptions } from "."

export class StartNode extends FlowchartNode {
    type = "start"
    
    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
    }

    init() {
    }

    setIsHover = (e: MouseEvent) => {
        const rect = this.el.getBoundingClientRect()
        const mouseX = e.clientX
        const mouseY = e.clientY

        const radius = rect.height / 2
        const centerLeftX = rect.left + radius
        const centerRightX = rect.right - radius
        const centerY = rect.top + radius
        const distToLeftCenter = Math.sqrt((mouseX - centerLeftX) ** 2 + (mouseY - centerY) ** 2)
        const distToRightCenter = Math.sqrt((mouseX - centerRightX) ** 2 + (mouseY - centerY) ** 2)

        this.isHover = (distToLeftCenter <= radius || distToRightCenter <= radius) || (mouseX >= centerLeftX && mouseX <= centerRightX && mouseY >= rect.top && mouseY <= rect.bottom)
    }
}

export default StartNode