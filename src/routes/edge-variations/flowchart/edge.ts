import { type FlowchartNode } from "./nodes/index"

export type EdgeType = "straight" | "elbow" | "zigzag" | "diagonal-elbow" | "diagonal" | "zigzag-diagonal" | "double-diagonal" | "curve" | "inner-curve" | "inner-curved" | "curved" | "elbow-curve" | "elbow-curved" | "zigzag-curve" | "zigzag-curved" | "diagonal-curve" | "diagonal-curved" | "double-diagonal-curve" | "double-diagonal-curved" | "smart-diagonal" | "smart-elbow" | "smart-elbow-curve" | "smart-elbow-curved" | "smart-diagonal-curve" | "smart-diagonal-curved" | "smart-curve" | "smart-curved"

export type FlowchartEdgeOptions = {
    startNode: FlowchartNode
    endNode: FlowchartNode
    showArrow?: boolean
    type?: EdgeType
}

export class FlowchartEdge {
    startNode: FlowchartNode
    endNode: FlowchartNode
    id: string = crypto.randomUUID()
    svgGroup: SVGGElement = document.createElementNS("http://www.w3.org/2000/svg", "g")
    pathEl: SVGPathElement = this.#createPathEl()
    markerEl: SVGMarkerElement | null = null
    
    private updatePositionDelay = undefined as ReturnType<typeof setTimeout> | undefined
    private _isVisible: boolean = false
    private _showArrow: boolean = true
    private _type = "straight" as EdgeType

    init?(): void

    constructor(startNode: FlowchartNode, endNode: FlowchartNode, options?: Partial<FlowchartEdgeOptions>) {
        this.#init()

        this.startNode = startNode
        this.endNode = endNode

        if (options) {
            if (options.showArrow !== undefined) { this.showArrow = options.showArrow }
            if (options.type !== undefined) { this.type = options.type }
        }
        
        this.updatePosition()
        // Create watcher for startNode.x, startNode.y, endNode.x, endNode.y
        this.startNode.addEventListener("positionChange", this.boundUpdatePosition)
        this.endNode.addEventListener("positionChange", this.boundUpdatePosition)
        
        // Create watcher for startNode.segments & endNode.segments
        this.startNode.addEventListener("segmentsChange", this.boundUpdatePosition)
        this.endNode.addEventListener("segmentsChange", this.boundUpdatePosition)
    }
    
    #init() {
        setTimeout(() => {
            if (this.init) {
                this.init()
            }
        }, 0)
    }

    #createPathEl() {
        this.pathEl = document.createElementNS("http://www.w3.org/2000/svg","path")
        this.svgGroup.appendChild(this.pathEl)
        this.pathEl.setAttribute("fill", "none")
        this.svgGroup.classList.add("flowchart-edge")
        this.svgGroup.id = this.id
        return this.pathEl
    }
    
    #createArrowHeadEl() {
        const arrowWidth = 8
        const arrowHeight = 7
        this.markerEl = document.createElementNS("http://www.w3.org/2000/svg", "marker")
        this.markerEl.setAttribute("id", `arrowhead-${this.id}`)
        this.markerEl.setAttribute("markerWidth", `${arrowWidth}`)
        this.markerEl.setAttribute("markerHeight", `${arrowHeight}`)
        this.markerEl.setAttribute("refX", `${arrowWidth/2}`)
        this.markerEl.setAttribute("refY", `${arrowHeight/2}`)
        this.markerEl.setAttribute("orient", "auto")


        const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
        path.setAttribute("d", `M0,0 L0,${arrowHeight} L${arrowWidth/2 + .5},${arrowHeight/2} z`)
        path.setAttribute("fill", "#333")
        path.setAttribute("stroke", "none")

        this.markerEl.appendChild(path)

        const flowchart = this.endNode.flowchart
        if (!flowchart || !flowchart.edgesGroup) {
            console.warn("End node is not attached to a flowchart, cannot create arrow head")
            return
        }

        this.svgGroup.appendChild(this.markerEl)
    }

    /** Visible **/

    set isVisible(value: boolean) {
        this._isVisible = value

        if (!this.svgGroup) return

        if (value) {
            this.svgGroup.style.opacity = "1"
        } else {
            this.svgGroup.style.opacity = "0"
        }
    }

    get isVisible() {
        return this._isVisible
    }

    /** Type **/
    set type(value: EdgeType) {
        this._type = value

        this.updatePosition()
    }

    get type() {
        return this._type
    }

    /** Show Arrow **/

    set showArrow(value: boolean) {
        this._showArrow = value

        // Add/remove arrow head marker from SVG
        if (value) {
            this.#createArrowHeadEl()
            this.pathEl.setAttribute("marker-end", `url(#arrowhead-${this.id})`)
        } else {
            const flowchart = this.endNode.flowchart
            if (!flowchart || !flowchart.edgesGroup) {
                console.warn("End node is not attached to a flowchart, cannot remove arrow head")
                return
            }

            // Remove marker  element
            const marker = flowchart.edgesGroup.querySelector(`#arrowhead-${this.id}`)
            if (marker) {
                marker.remove()
            }
            this.pathEl.removeAttribute("marker-end")
        }
    }

    get showArrow() {
        return this._showArrow
    }

    /** Position **/

    updatePosition() {
        if (!this.svgGroup) return
        if (!this.startNode.svgGroup) {
            console.warn("Start node element not found for edge, cannot update position")
            return
        }
        if (!this.endNode.svgGroup) {
            console.warn("End node element not found for edge, cannot update position")
            return
        }
        if (!this.startNode.flowchart) {
            return
        }

        // Debounce position updates to avoid excessive calculations when multiple properties change at once
        if (this.updatePositionDelay) {
            clearTimeout(this.updatePositionDelay)
        }

        this.updatePositionDelay = setTimeout(() => {
            this.drawEdge()
        }, 0)
    }
    
    drawEdge() {
        if (!this.startNode || !this.endNode) return
        if (!this.pathEl) return

        const start = this.startNode.calculateEdgeStart(this.endNode)
        const end = this.endNode.calculateEdgeStart(this.startNode)

        let type = this.type
        let pathData = ""
        let midpoint = 0.25
        

        // Helper variables for SMART edge types
        const dx = end.x - start.x
        const dy = end.y - start.y
        let angle = Math.atan2(dx, -dy) * (180 / Math.PI)
        if (angle < 0) {
            angle += 360
        }
        const normalizedAngle = angle % 90



        switch (this.type) {
            case "smart-curve": {
                if (normalizedAngle < 1 || normalizedAngle > 89) { type = "curve" } 
                else if (normalizedAngle < 30 || normalizedAngle > 60) { type = "straight" } 
                else { type = "zigzag-curved" }
                break
            }
            case "smart-elbow": {
                if (normalizedAngle < 1 || normalizedAngle > 89) { type = "straight" } 
                else if (normalizedAngle < 30 || normalizedAngle > 60) { type = "elbow" } 
                else { type = "zigzag" }
                break
            }
            case "smart-elbow-curve": 
            case "smart-elbow-curved": {
                if (normalizedAngle < 2.5 || normalizedAngle > 87.5) { type = "curved" } 
                else if (normalizedAngle < 30 || normalizedAngle > 60) { type = "elbow-curved" } 
                else { type = "curved"; midpoint = 0.5 }
                break
            }
            case "smart-diagonal": {
                if (normalizedAngle < .5 || normalizedAngle > 89.5) { type = "straight" } 
                else if (normalizedAngle < 30 || normalizedAngle > 60) { type = "diagonal" } 
                else { type = "double-diagonal" }
                break
            }
            case "smart-diagonal-curve": 
            case "smart-diagonal-curved": {
                if (normalizedAngle < .5 || normalizedAngle > 89.5) { type = "curved" } 
                else if (normalizedAngle < 30 || normalizedAngle > 60) { type = "diagonal-curved" } 
                else { type = "double-diagonal-curved"}
                break
            }
        }

        const cpOffset = (end.y - start.y) * midpoint

        switch (type) {
            case "straight":
                pathData = `M${start.x} ${start.y} L${end.x} ${end.y}`
                break

            // Één knik
            case "elbow": {
                pathData = `M${start.x} ${start.y} L${end.x} ${start.y} L${end.x} ${end.y}`
                if (Math.abs(end.y - start.y) < this.startNode.height/3) {
                    pathData = `M${start.x} ${start.y} L${start.x} ${end.y} L${end.x} ${end.y}`
                }

                break
            }

            // Twee knikken
            case "zigzag": {
                const bridgeY = start.y + (end.y - start.y) * midpoint
                pathData = `M${start.x} ${start.y} L${start.x} ${bridgeY} L${end.x} ${bridgeY} L${end.x} ${end.y}`
                if (Math.abs(end.y - start.y) < this.startNode.height / 3) {
                    const bridgeX = start.x + (end.x - start.x) * midpoint
                    pathData = `M${start.x} ${start.y} L${bridgeX} ${start.y} L${bridgeX} ${end.y} L${end.x} ${end.y}`
                }
                break
            }

            // Één knik onder een hoek van 45 graden
            case "diagonal-elbow":
            case "diagonal": {
                const dx = Math.abs(end.x - start.x)
                const dy = Math.abs(end.y - start.y)
                const diagOffset = Math.min(dx, dy)

                const signX = end.x > start.x ? 1 : -1
                const signY = end.y > start.y ? 1 : -1

                const midPoint = { 
                    x: start.x + signX * diagOffset, 
                    y: start.y + signY * diagOffset 
                }
                pathData = `M${start.x} ${start.y} L${midPoint.x} ${midPoint.y} L${end.x} ${end.y}`
                break
            }

            // Twee knikken onder een hoek van 45 graden
            case "zigzag-diagonal":
            case "double-diagonal": {
                const dx = Math.abs(end.x - start.x)
                const dy = Math.abs(end.y - start.y)
                const diagOffset = Math.min(dx, dy) / 2

                const signX = end.x > start.x ? 1 : -1
                const signY = end.y > start.y ? 1 : -1

                const mid1 = { 
                    x: start.x + signX * diagOffset, 
                    y: start.y + signY * diagOffset 
                }
                const mid2 = { 
                    x: end.x - signX * diagOffset, 
                    y: end.y - signY * diagOffset 
                }
                pathData = `M${start.x} ${start.y} L${mid1.x} ${mid1.y} L${mid2.x} ${mid2.y} L${end.x} ${end.y}`

                break
            }

            case "curve":
            case "inner-curve":
            case "inner-curved":
            case "curved":
                pathData = `M${start.x} ${start.y} C${start.x} ${start.y + cpOffset} ${end.x} ${end.y - cpOffset} ${end.x} ${end.y}`
                if (Math.abs(end.y - start.y) < this.startNode.height / 3) {
                    const cpOffsetX = (end.x - start.x) * 0.1
                    pathData = `M${start.x} ${start.y} C${start.x + cpOffsetX} ${start.y} ${end.x - cpOffsetX} ${end.y} ${end.x} ${end.y}`
                }
                break

            // Één knik met een curve
            case "elbow-curve":
            case "elbow-curved":
                pathData = `M${start.x} ${start.y} C${end.x} ${start.y} ${end.x} ${start.y} ${end.x} ${end.y}`

                if (Math.abs(end.y - start.y) < this.startNode.height / 3) {
                    pathData = `M${start.x} ${start.y} C${start.x} ${end.y} ${start.x} ${end.y} ${end.x} ${end.y}`
                }

                if (Math.abs(start.x - end.x) < 1) {
                    pathData = `M${start.x} ${start.y} L${end.x} ${end.y}`
                }
                break


            // Twee knikken met een curve
            case "zigzag-curve":
            case "zigzag-curved": {
                const bridgeY = start.y + (end.y - start.y) * midpoint
                pathData = `M${start.x} ${start.y} C${start.x} ${bridgeY} ${end.x} ${bridgeY} ${end.x} ${end.y}`
                if (Math.abs(end.y - start.y) < this.startNode.height / 3) {
                    const bridgeX = start.x + (end.x - start.x) * midpoint
                    pathData = `M${start.x} ${start.y} C${bridgeX} ${start.y} ${bridgeX} ${end.y} ${end.x} ${end.y}`
                }
                break
            }
            case "diagonal-curve":
            case "diagonal-curved": {
                const dx = Math.abs(end.x - start.x)
                const dy = Math.abs(end.y - start.y)
                const diagOffset = Math.min(dx, dy)

                const signX = end.x > start.x ? 1 : -1
                const signY = end.y > start.y ? 1 : -1

                const midPoint = { 
                    x: start.x + signX * diagOffset, 
                    y: start.y + signY * diagOffset 
                }
                pathData = `M${start.x} ${start.y} C${midPoint.x} ${midPoint.y} ${midPoint.x} ${midPoint.y} ${end.x} ${end.y}`
                break
            }
            
            case "double-diagonal-curve":
            case "double-diagonal-curved": {
                const dx = Math.abs(end.x - start.x)
                const dy = Math.abs(end.y - start.y)
                const diagOffset = Math.min(dx, dy) / 2

                const signX = end.x > start.x ? 1 : -1
                const signY = end.y > start.y ? 1 : -1

                const mid1 = { 
                    x: start.x + signX * diagOffset, 
                    y: start.y + signY * diagOffset 
                }
                const mid2 = { 
                    x: end.x - signX * diagOffset, 
                    y: end.y - signY * diagOffset 
                }
                pathData = `M${start.x} ${start.y} C${mid1.x} ${mid1.y} ${mid2.x} ${mid2.y} ${end.x} ${end.y}`
                break
            }
        }

        // If vertical offset is very small, fallback to straight line to avoid weird curves
        
        if (Math.abs(start.x - end.x) < 1 || Math.abs(start.y - end.y) < 1) {
            pathData = `M${start.x} ${start.y} L${end.x} ${end.y}`
        }


        this.pathEl.setAttribute("d", pathData)
    }

    boundUpdatePosition = this.updatePosition.bind(this)


    destroy() {
        if (this.svgGroup) { this.svgGroup.remove() }

        this.startNode.removeEventListener("positionChange", this.boundUpdatePosition)
        this.endNode.removeEventListener("positionChange", this.boundUpdatePosition)
        this.startNode.removeEventListener("segmentsChange", this.boundUpdatePosition)
        this.endNode.removeEventListener("segmentsChange", this.boundUpdatePosition)
    }

}

export default FlowchartEdge