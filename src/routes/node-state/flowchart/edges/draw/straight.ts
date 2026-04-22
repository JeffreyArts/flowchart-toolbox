import { type DrawEdgeType } from "../index"

export const drawStraightEdge: DrawEdgeType = (start, end, edge) => {
    const strength = edge.options.curvatureStrength ?? 0.5
    const midpoint = edge.options.midpoint ?? 0.5

    let endPointHor = false
    if (edge.endNode.shape?.width) {
        if (end.x < edge.endNode.x - edge.endNode.shape.width / 2 || end.x > edge.endNode.x + edge.endNode.shape.width / 2) {
            endPointHor = true
        }
    }

    const dx = end.x - start.x
    const dy = end.y - start.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const offset = dist * strength
    const direction = (midpoint - 0.5) * 2

    const straightCp1x = start.x + dx * 0.33
    const straightCp1y = start.y + dy * 0.33
    const straightCp2x = start.x + dx * 0.66
    const straightCp2y = start.y + dy * 0.66
    
    const curvedCpX = start.x + dx * 0.5 + offset * direction
    const curvedCpY = start.y + dy * 0.5 + offset * direction
    let cp1x = straightCp1x + (start.x - straightCp1x) * strength
    let cp1y = straightCp1y + (curvedCpY - straightCp1y) * strength
    let cp2x = straightCp2x + (end.x - straightCp2x) * strength
    let cp2y = straightCp2y + (curvedCpY - straightCp2y) * strength
    
    if (endPointHor) {
        cp1y = straightCp1y + (start.y - straightCp1y) * strength
        cp2x = straightCp2x + (curvedCpX - straightCp2x) * strength
        cp1x = straightCp1x + (curvedCpX - straightCp1x) * strength
        cp2y = straightCp2y + (end.y - straightCp2y) * strength
    }

    return `M${start.x} ${start.y} C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${end.x} ${end.y}`
}

export default drawStraightEdge