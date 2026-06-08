import { type DrawEdgeType } from "../index"

export const drawElbowEdge: DrawEdgeType = (start, end, edge) => {
    // Max = .99 to prevent `end` object to be equal to `t2` object 
    const strength = Math.min(edge.options.curvatureStrength ?? 0.5, .99) 

    let endPointHor = false
    if (edge.endNode.shape?.width) {
        if (end.x < edge.endNode.x - edge.endNode.shape.width / 2 || end.x > edge.endNode.x + edge.endNode.shape.width / 2) {
            endPointHor = true
        }
    }
    
    const corner = { x: end.x, y: start.y }

    if (endPointHor) {
        corner.x = start.x
        corner.y = end.y
    }

    const t1 = {
        x: corner.x + (start.x - corner.x) * strength,
        y: corner.y + (start.y - corner.y) * strength
    }

    const t2 = {
        x: corner.x + (end.x - corner.x) * strength,
        y: corner.y + (end.y - corner.y) * strength
    }

    return `M${start.x} ${start.y} L${t1.x} ${t1.y} Q${corner.x} ${corner.y} ${t2.x} ${t2.y} L${end.x} ${end.y}`
}

export default drawElbowEdge