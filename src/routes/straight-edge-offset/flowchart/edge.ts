import { type FlowchartNode } from "./nodes/index"

export type FlowchartEdgeOptions = {
    startNode: FlowchartNode
    endNode: FlowchartNode
    showArrow?: boolean
}

export class FlowchartEdge {
    startNode: FlowchartNode
    endNode: FlowchartNode
    showArrow: boolean = true
    pathEl: SVGPathElement = this.#createPathEl()
    
    private _isVisible: boolean = false

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

        const startX = this.startNode.x + this.startNode.width / 2
        const startY =this.startNode.y + this.startNode.height / 2
        const endX = this.endNode.x + this.endNode.width / 2 
        const endY = this.endNode.y + this.endNode.height / 2 

        // const pathData = "M0 0  L500 500"
        const pathData = `M${startX} ${startY} L${endX} ${endY}`
        this.pathEl.setAttribute("d", pathData)
    }


    destroy() {
        if (this.pathEl) { this.pathEl.remove() }
    }

}

export default FlowchartEdge