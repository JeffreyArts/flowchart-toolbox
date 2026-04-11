import { type FlowchartNode } from "./../nodes/index"
import drawStraightEdge from "./draw/straight"
import drawElbowEdge from "./draw/elbow"
import drawZigZagEdge from "./draw/zigzag"
import drawDiagonalEdge from "./draw/diagonal"
import drawDoubleDiagonalEdge from "./draw/double-diagonal"

// export type EdgeType = "straight" | "curved" | "elbow" | "elbow-curved" | "zigzag" | "double-diagonal"

export type FlowchartEdgeOptions = {
    showArrow: boolean
    type: string
    isVisible: boolean
    midpoint: number // For curved edges, value between 0 and 1 indicating where the midpoint of the curve should be (default: 0.5) 
    curvatureStrength: number // For curved edges, value between 0 and 1 indicating how strong the curvature should be (default: 0.5)
}

export type DrawEdgeType = (start: { x: number, y: number }, end: { x: number, y: number }, edge: FlowchartEdge) => string

export class FlowchartEdge {
    startNode: FlowchartNode
    endNode: FlowchartNode
    id: string = crypto.randomUUID()
    svgGroup: SVGGElement = document.createElementNS("http://www.w3.org/2000/svg", "g")
    pathEl: SVGPathElement = this.#createPathEl()
    markerEl: SVGMarkerElement | null = null
    edgeTypes = {
        straight: drawStraightEdge,
        elbow: drawElbowEdge, 
        zigzag: drawZigZagEdge,
        diagonal: drawDiagonalEdge,
        "double-diagonal": drawDoubleDiagonalEdge
    } as Record<string, DrawEdgeType>

    private updatePositionDelay = undefined as ReturnType<typeof setTimeout> | undefined

    init?(): void

    options = new Proxy<FlowchartEdgeOptions>({ type: "curve", showArrow: true, isVisible: true, midpoint: 0.5, curvatureStrength: .5 }, {
        set: (target, prop, value) => {
            (target as Record<string, any>)[prop as string] = value

            if (prop === "type") {
                this.updatePosition()
            }

            if (prop === "showArrow") {
                value ? this.setArrow() : this.removeArrow()
            }
            if (prop === "isVisible") {
                value ? this.setVisible() : this.setInvisible()
            }

            if (prop === "midpoint") {
                this.updatePosition()
            }

            if (prop === "curvatureStrength") {
                this.updatePosition()
            }

            return true
        }
    })

    constructor(startNode: FlowchartNode, endNode: FlowchartNode, options?: Partial<FlowchartEdgeOptions>) {
        this.#init()

        this.startNode = startNode
        this.endNode = endNode

        this.processOptions(options)
        this.updatePosition()

        // Create watcher for startNode.x, startNode.y, endNode.x, endNode.y
        this.startNode.addEventListener("positionChange", this.boundUpdatePosition)
        this.endNode.addEventListener("positionChange", this.boundUpdatePosition)
        
        // Create watcher for startNode.segments & endNode.segments
        this.startNode.addEventListener("segmentsChange", this.boundUpdatePosition)
        this.endNode.addEventListener("segmentsChange", this.boundUpdatePosition)
    }
    
    private processOptions(options?: Partial<FlowchartEdgeOptions>) {
        if (!options) return

        if (options.showArrow !== undefined) {
            this.options.showArrow = options.showArrow
        }
        if (options.type !== undefined) {
            this.options.type = options.type
        }
        if (options.isVisible !== undefined) {
            this.options.isVisible = options.isVisible
        }
        if (typeof options.midpoint !== "undefined") {
            this.options.midpoint = parseFloat(options.midpoint.toString())
        }
        if (typeof options.curvatureStrength !== "undefined") {
            this.options.curvatureStrength = parseFloat(options.curvatureStrength.toString())
        }
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

    /** Show Arrow **/
    private setArrow() {
        this.#createArrowHeadEl()
        this.pathEl.setAttribute("marker-end", `url(#arrowhead-${this.id})`)
    }

    private removeArrow() {
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
    

    private setVisible() {
        if (!this.svgGroup) return
        this.svgGroup.style.opacity = "1"
    }

    setInvisible() {
        if (!this.svgGroup) return
        this.svgGroup.style.opacity = "0"
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

        if (!this.options.type) {
            throw new Error("Edge type is not defined")
        }

        const draw = this.edgeTypes[this.options.type]
        if (!draw) { return }
        
        const pathData = draw(start, end, this)
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