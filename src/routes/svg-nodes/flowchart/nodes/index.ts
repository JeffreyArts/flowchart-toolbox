import { type Flowchart } from "../index"
import FlowchartEdge from "./../edge"
import type FlowchartShapeRectangle from "../shapes/rectangle"
import TextHelper from "../shapes/text-helper"
import type PillShape from "../shapes/pill"

export type FlowchartNodeEvent = "positionChange" | "segmentsChange" | "beforeTextChange" | "afterTextChange"

export type FlowchartNodeOptions = {
    type?: "end" | "process" | "decision" | "start"
    parent?: FlowchartNode
    text?: string
    flowchart?: Flowchart
    x?: number | string
    y?: number | string
    segments?: number
    maxWidth?: number | string  
    class?: string | string[]
}

export abstract class FlowchartNode {

    abstract type: string
    abstract shape: FlowchartShapeRectangle | PillShape | undefined
    
    offsetPadding = 8
    maxWidth = "auto" as number | string
    
    id: string = crypto.randomUUID()
    flowchart: Flowchart | null = null
    children: FlowchartNode[] = []
    parents: FlowchartNode[] = []
    textBox: { width: number, height: number, lines: string[], lineHeight: number } = { width: 0, height: 0, lines: [], lineHeight: 0 }
    isSelected: boolean = false
    svgGroup: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "g")
    
    eventListeners: Array<{ name: string, callback: () => void }> = []

    private _x = "0"
    private _y = "0"
    private _segments = 0
    private _mouseOver: boolean = false
    private _isVisible: boolean = false
    private _text: string = ""

    init?(): void

    constructor(options: Partial<FlowchartNodeOptions>) {
        this.#init()
        this.svgGroup.id = this.id
        this.svgGroup.classList.add("flowchart-node")
        
        this.parseOptions(options)
    

        if (this.flowchart) {
            this.flowchart.addNode(this)
            this.updatePosition()
        }
    }
    parseOptions(options: Partial<FlowchartNodeOptions>) {
        if (!options) return

        if (options.flowchart) {
            this.flowchart = options.flowchart
        }

        if (options.parent) {
            this.addParent(options.parent)
        }

        if (options.class) {
            if (Array.isArray(options.class)) {
                this.svgGroup.classList.add(...options.class)
            } else {
                this.svgGroup.classList.add(options.class)
            }
        }

        options.type        ? this.type = options.type          : this.type = "unknown"
        options.maxWidth    ? this.maxWidth = options.maxWidth  : this.maxWidth = "auto"
        options.segments    ? this._segments = options.segments : this._segments = 0
        options.text        ? this.text = options.text          : this.text = ""
        
        setTimeout(() => {
            if (options.x) {
                this.setX(options.x)
            }

            if (options.y) {
                this.setY(options.y)
            }
        })
    }
    
    #init() {
        setTimeout(() => {
            // Need to add event Listener in setTimeout to ensure child classes have the proper binding in setIsHover
            if (this.init) {
                this.init()
            }
        }, 0)
    }

    get width(): number {
        if (!this.shape) {
            return 0
        }

        let w = this.shape.width
        if (this.flowchart) {
            w = w / this.flowchart.zoom
        }
        return w
    }

    get height(): number {
        if (!this.shape) {
            return 0
        }

        let h = this.shape.height
        if (this.flowchart) {
            h = h / this.flowchart.zoom
        }
        return  h
    }

    /** Text **/

    get text(): string {
        return this._text
    }

    set text(value: string) {
        this.#triggerEvent("beforeTextChange")
        this._text = value
        const textHelperOptions = {
            padding: "20px"
        } as Partial<CSSStyleDeclaration> 

        if (typeof this.maxWidth != "undefined") {
            if (typeof this.maxWidth === "number") {
                textHelperOptions["maxWidth"] = this.maxWidth + "px"
            } else {
                textHelperOptions["maxWidth"] = this.maxWidth
            }
        }

        const textHelper = new TextHelper(value, textHelperOptions)
        this.textBox = textHelper.measure()
        textHelper.destroy()
        
        // Update position after text change to adjust for new size
        this.updatePosition()

        setTimeout(() => {
            this.#triggerEvent("afterTextChange")
        })
    }

    get lines(): string[] {
        return this.text.split("\n")
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

    /** Mouse over **/
    set mouseOver(value: boolean) {
        if (value) {
            this.onMouseEnter()
        } else {
            this.onMouseLeave()
        }
        this._mouseOver = value
    }

    get mouseOver() {
        return this._mouseOver
    }
    
    /** Event listeners */
    addEventListener(eventName: FlowchartNodeEvent, callback: () => void) {
        this.eventListeners.push({ name: eventName, callback })
    }

    removeEventListener(eventName: FlowchartNodeEvent, callback: () => void) {
        this.eventListeners = this.eventListeners.filter(e => e.name !== eventName || e.callback !== callback)
    }

    removeAllEventListeners(eventName: FlowchartNodeEvent) {
        this.eventListeners = this.eventListeners.filter(e => e.name !== eventName)
    }

    #triggerEvent(eventName: FlowchartNodeEvent) {
        this.eventListeners.forEach(e => {
            if (e.name === eventName) {
                e.callback()
            }
        })
    }

    /** Segments **/
    get segments() {
        return this._segments
    }
    
    set segments(value: number) {   
        this._segments = value
        this.#triggerEvent("segmentsChange")
    }

    /** Position **/
    updatePosition(first = true) {
        if (!this.svgGroup) return

        if (first) {
            return setTimeout(() => {
                this.updatePosition(false)
                this.isVisible = true
            }, 0)
        } else {
            this.#triggerEvent("positionChange")
        }
    }

    get x(): number {
        return parseFloat(this._x)
    }

    set x (value: number | string) {
        this.setX(value)
    }
    
    setX(value: number | string) {
        if (!this.flowchart) return
        // if (!this.foreignObject) return
        let res = ""
        
        if (typeof value === "number") {
            res = value + "px"
        } else if (value.includes("%")) {
            res = this.flowchart.width * parseFloat(value) / 100 + "px"
        } else {
            res = value
        }

        this._x = res
        this.updatePosition(false)
    }

    get y(): number {
        return parseFloat(this._y)
    }

    set y (value: number | string) {
        this.setY(value)
    }

    setY(value: number | string) {
        if (!this.flowchart) return
        let res = ""

        if (typeof value === "number") {
            res = value + "px"
        } else if (value.includes("%")) {
            res = this.flowchart.height * parseFloat(value) / 100 + "px"
        } else {
            res = value
        }

        this._y = res
        this.updatePosition(false)
    }


    calculateEdgeStart(targetNode: FlowchartNode) {

        if (!this.shape) {
            throw new Error("Cannot calculate edge start position without a shape defined for the node.")
        }
        const startNode = this
        const endNode = targetNode
        // console.log("degrees before snapping:", degrees)

        let degrees = Math.atan2(endNode.y - startNode.y, endNode.x - startNode.x) * (180 / Math.PI) + 90
        if (startNode.segments > 0) {
            const anglePerSegment = 360 / startNode.segments
            degrees = Math.round(degrees / anglePerSegment) * anglePerSegment            
        }

        const rad = (degrees - 90) * (Math.PI / 180)
        const dist = this.shape.getBorderDistance(endNode) + startNode.offsetPadding
        return {
            x: this.x + Math.cos(rad) * dist,
            y: this.y + Math.sin(rad) * dist,
        }
    }

    /** Parents */
    addParent(node: FlowchartNode | FlowchartNode[]) {
        if (Array.isArray(node)) {
            node.forEach(n => this.addParent(n))
            return
        }

        if (this.parents.find(n => n.id === node.id)) {
            console.warn(`Node with id "${node.id}" is already a parent of node with id "${this.id}", skipping connection`)
            return
        }
        
        if (!this.flowchart && node.flowchart) {
            this.flowchart = node.flowchart
            this.flowchart.addNode(this)
        }

        this.parents.push(node)
        // Create edge if both nodes are in the same flowchart
        if (this.flowchart && node.flowchart && this.flowchart === node.flowchart) {
            const edge = new FlowchartEdge( node, this, { showArrow: true } )
            this.flowchart.addEdge(edge)   
        }
    }

    removeParent(node: FlowchartNode | string) {
        if (typeof node === "string") {
            this.parents = this.parents.filter(n => n.id !== node)
        } else {
            this.parents = this.parents.filter(n => n.id !== node.id)
        }
    }

    hasParent(node: FlowchartNode | string) {
        if (typeof node === "string") {
            return !!this.parents.find(n => n.id === node)
        }
        return !!this.parents.find(n => n.id === node.id)
    }

    /** Children */
    addChild(node: FlowchartNode | FlowchartNode[]) {
        if (Array.isArray(node)) {
            node.forEach(n => this.addChild(n))
            return
        }

        if (this.children.find(n => n.id === node.id)) {
            console.warn(`Node with id "${node.id}" is already a child of node with id "${this.id}", skipping connection`)
            return
        }
        
        if (!this.flowchart && node.flowchart) {
            this.flowchart = node.flowchart
            this.flowchart.addNode(this, node)

            const edge = new FlowchartEdge( node, this, { showArrow: true } )
            this.flowchart.addEdge(edge)
        }

        this.children.push(node)
    }

    removeChild(node: FlowchartNode | string) {
        if (typeof node === "string") {
            this.children = this.children.filter(n => n.id !== node)
        } else {
            this.children = this.children.filter(n => n.id !== node.id)
        }
    }

    hasChild(node: FlowchartNode | string) {
        if (typeof node === "string") {
            return !!this.children.find(n => n.id === node)
        }
        return !!this.children.find(n => n.id === node.id)
    }

    /** Lifecycle Hooks **/

    onMouseEnter() {
        this.svgGroup.classList.add("__isHover")
    }

    onMouseLeave() {
        this.svgGroup.classList.remove("__isHover")
    }

    destroy() {
        // document.removeEventListener("mousemove", this.boundSetIsHover)
        // if (this.flowchart)
        // if (this.foreignObject) { this.foreignObject.remove()}
        if (this.svgGroup) { this.svgGroup.remove() }
    }

}

export default FlowchartNode