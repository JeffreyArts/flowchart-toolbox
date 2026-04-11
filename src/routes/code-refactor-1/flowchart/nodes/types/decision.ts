import { FlowchartNode } from "./../index"
import DiamondShape from "../../shapes/diamond"

export const DecisionNode = (node: FlowchartNode) => {
    return new DiamondShape(node, { 
        class: "decision-node",
        style: {
            maxWidth: "360px",
        }
    })
}

export default DecisionNode