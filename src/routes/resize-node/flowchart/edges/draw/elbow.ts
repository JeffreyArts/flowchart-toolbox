import { type DrawEdgeType } from "../index"

export const drawElbowEdge: DrawEdgeType = (start, end, edge) => {
    const strength = edge.options.curvatureStrength ?? 0.5

    let endPointHor = false
    if (edge.endNode.shape?.width) {
        if (end.x < edge.endNode.x - edge.endNode.shape.width / 2 || end.x > edge.endNode.x + edge.endNode.shape.width / 2) {
            endPointHor = true
        }
    }

    if (endPointHor) {
        const corner = { x: start.x, y: end.y }

        const t1x = corner.x + (start.x - corner.x) * strength
        const t1y = corner.y + (start.y - corner.y) * strength

        const t2x = corner.x + (end.x - corner.x) * strength
        const t2y = corner.y + (end.y - corner.y) * strength

        return `M${start.x} ${start.y} L${t1x} ${t1y} Q${corner.x} ${corner.y} ${t2x} ${t2y} L${end.x} ${end.y}`
    } else {
        const corner = { x: end.x, y: start.y }

        const t1x = corner.x + (start.x - corner.x) * strength
        const t1y = corner.y + (start.y - corner.y) * strength

        const t2x = corner.x + (end.x - corner.x) * strength
        const t2y = corner.y + (end.y - corner.y) * strength

        return `M${start.x} ${start.y} L${t1x} ${t1y} Q${corner.x} ${corner.y} ${t2x} ${t2y} L${end.x} ${end.y}`
    }
}

export default drawElbowEdge