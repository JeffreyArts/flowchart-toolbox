import { FlowchartNode } from "../index"
import DiamondShape from "../../shapes/diamond"

export const DecisionNode = (node: FlowchartNode) => {
    let maxWidth = "360px"
    if (typeof node.options.maxWidth === "number") {
        maxWidth = node.options.maxWidth + "px"
    } else {
        maxWidth = node.options.maxWidth
    }
    
    return new DiamondShape(node, { 
        class: "decision-node",
        style: {
            maxWidth
        }
    })
}

export default DecisionNode