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
    pathEl: SVGPathElement = this.#createPathEl()
    
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
        this.startNode.addEventListener("updatePosition", this.updatePosition.bind(this))
        this.endNode.addEventListener("updatePosition", this.updatePosition.bind(this))
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
        this.pathEl.classList.add("flowchart-edge")
        return this.pathEl
    }
    
    #createArrowHeadEl() {
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker")
        marker.setAttribute("id", `arrowhead-${this.id}`)
        marker.setAttribute("markerWidth", "10")
        marker.setAttribute("markerHeight", "7")
        marker.setAttribute("refX", "3.5")
        marker.setAttribute("refY", "3.5")
        marker.setAttribute("orient", "auto")


        const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
        path.setAttribute("d", "M0,0 L0,7 L5,3.5 z")
        path.setAttribute("fill", "#333")

        marker.appendChild(path)

        const flowchart = this.endNode.flowchart
        if (!flowchart || !flowchart.edgesGroup) {
            console.warn("End node is not attached to a flowchart, cannot create arrow head")
            return
        }
        flowchart.edgesGroup.appendChild(marker)
    }

    /** Visible **/

    set isVisible(value: boolean) {
        this._isVisible = value

        if (!this.pathEl) return

        if (value) {
            this.pathEl.style.opacity = "1"
        } else {
            this.pathEl.style.opacity = "0"
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
        if (!this.pathEl) return
        if (!this.startNode.el) {
            console.warn("Start node element not found for edge, cannot update position")
            return
        }
        if (!this.endNode.el) {
            console.warn("End node element not found for edge, cannot update position")
            return
        }
        if (!this.startNode.flowchart) {
            return
        }

        // calculate angle between start and end node centers
        const startDegrees = Math.atan2(this.endNode.y - this.startNode.y, this.endNode.x - this.startNode.x) * (180 / Math.PI) + 90
        const endDegrees = startDegrees + 180

        const start = this.startNode.calculateEdgeStart(this.startNode, this.endNode)
        const end = this.endNode.calculateEdgeStart(this.endNode, this.startNode)
        // const end = this.endNode.calculateEdgeStart(endDegrees, this.endNode.offsetPadding)
        
        // const pathData = "M0 0  L500 500"
        const pathData = `M${start.x} ${start.y} L${end.x} ${end.y}`
        this.pathEl.setAttribute("d", pathData)
    }


    destroy() {
        if (this.pathEl) { this.pathEl.remove() }
    }

}

export default FlowchartEdge