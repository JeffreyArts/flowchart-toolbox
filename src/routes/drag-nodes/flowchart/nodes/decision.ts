import { FlowchartNode, type FlowchartNodeOptions } from "."

export class DecisionNode extends FlowchartNode {
    type = "decision"

    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
    }

    init() {
    }

    
    setIsHover = (e: MouseEvent) => {
        const rect = this.el.getBoundingClientRect()
        const mouseX = e.clientX
        const mouseY = e.clientY

        const after = window.getComputedStyle(this.el, "::before")
        const afterWidth = parseFloat(after.width)
        const paddingLeft = parseFloat(after.paddingLeft)
        const paddingRight = parseFloat(after.paddingRight)
        const borderWidth = parseFloat(after.borderWidth) * 2 || 0
        const width = afterWidth + paddingLeft + paddingRight + borderWidth

        // Calculate radius of the circumscribed circle around the diamond
        const radius = Math.sqrt(width ** 2 + width ** 2) / 2
        const centerX = rect.x + rect.width / 2
        const centerY = rect.y + rect.height / 2

        const dx = Math.abs(mouseX - centerX)
        const dy = Math.abs(mouseY - centerY)

        this.isHover = (dx + dy) <= radius
    }
}

export default DecisionNode