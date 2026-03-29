import { type FlowchartNode } from "./nodes/index"

export type FlowchartEdgeOptions = {
    startNode: FlowchartNode
    endNode: FlowchartNode
    showArrow?: boolean
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

    init?(): void

    constructor(startNode: FlowchartNode, endNode: FlowchartNode, options?: Partial<FlowchartEdgeOptions>) {
        this.#init()

        this.startNode = startNode
        this.endNode = endNode

        if (options) {
            if (options.showArrow !== undefined) {
                this.showArrow = options.showArrow
            }
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
        this.svgGroup.classList.add("flowchart-edge")
        this.svgGroup.id = this.id
        return this.pathEl
    }
    
    #createArrowHeadEl() {
        this.markerEl = document.createElementNS("http://www.w3.org/2000/svg", "marker")
        this.markerEl.setAttribute("id", `arrowhead-${this.id}`)
        this.markerEl.setAttribute("markerWidth", "10")
        this.markerEl.setAttribute("markerHeight", "7")
        this.markerEl.setAttribute("refX", "3.5")
        this.markerEl.setAttribute("refY", "3.5")
        this.markerEl.setAttribute("orient", "auto")


        const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
        path.setAttribute("d", "M0,0 L0,7 L5,3.5 z")
        path.setAttribute("fill", "#333")

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
            const start = this.startNode.calculateEdgeStart(this.startNode, this.endNode)
            const end = this.endNode.calculateEdgeStart(this.endNode, this.startNode)
            
            const pathData = `M${start.x} ${start.y} L${end.x} ${end.y}`
            this.pathEl.setAttribute("d", pathData)
        }, 0)
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