import { type DrawEdgeType } from "../index"

export const drawZigZagEdge: DrawEdgeType = (start, end, edge) => {

    const midpoint = edge.options.midpoint ?? 0.5
    const strength = edge.options.curvatureStrength ?? 0.5

    let horizontal = false
    if (edge.endNode.shape?.width) {
        if (end.x < edge.endNode.x - edge.endNode.shape.width / 2 || end.x > edge.endNode.x + edge.endNode.shape.width / 2) {
            horizontal = true
        }
    }


    let offset = 4
    if (edge.markerEl) {
        if (horizontal) {
            offset = parseInt(edge.markerEl.getAttribute("markerHeight") || "", 10) * 2
        } else {
            offset = parseInt(edge.markerEl.getAttribute("markerWidth") || "", 10) * 2
        }
    }


    let bridgeX = start.x + (end.x - start.x) * midpoint
    let bridgeY = start.y + (end.y - start.y) * midpoint

    if (horizontal) {
        if (start.x < end.x) {
            bridgeX = Math.min(bridgeX, end.x - offset)
            bridgeX = Math.max(bridgeX, start.x)
        } else {
            bridgeX = Math.max(bridgeX, end.x + offset)
            bridgeX = Math.min(bridgeX, start.x)
        }
    } else {
        if (start.y < end.y) {
            bridgeY = Math.min(bridgeY, end.y - offset)
            bridgeY = Math.max(bridgeY, start.y)
        } else {
            bridgeY = Math.max(bridgeY, end.y + offset)
            bridgeY = Math.min(bridgeY, start.y)
        }
    }

    let maxRadius = Math.min(Math.abs(bridgeY - start.y), Math.abs(bridgeY - end.y), Math.abs(end.x - start.x)) * 0.5
    if (horizontal) {
        maxRadius = Math.min(Math.abs(bridgeX - start.x), Math.abs(bridgeX - end.x), Math.abs(end.y - start.y)) * 0.5
    }
    
    const r = maxRadius * strength
    const sx = Math.sign(end.x - start.x) * r
    const sy = Math.sign(end.y - start.y) * r

    if (horizontal) {
        return `M${start.x} ${start.y}
            L${bridgeX - sx} ${start.y}
            Q${bridgeX} ${start.y} ${bridgeX} ${start.y + sy}
            L${bridgeX} ${end.y - sy}
            Q${bridgeX} ${end.y} ${bridgeX + sx} ${end.y}
            L${end.x} ${end.y}`
    } else {
        return `M${start.x} ${start.y}
            L${start.x} ${bridgeY - sy}
            Q${start.x} ${bridgeY} ${start.x + sx} ${bridgeY}
            L${end.x - sx} ${bridgeY}
            Q${end.x} ${bridgeY} ${end.x} ${bridgeY + sy}
            L${end.x} ${end.y}`
    }
   
}
    
export default drawZigZagEdge