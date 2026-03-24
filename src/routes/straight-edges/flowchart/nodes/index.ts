import { type Flowchart } from "../index"
import FlowchartEdge from "../../../straight-edges/flowchart/edge"

export type FlowchartNodeOptions = {
    type?: "end" | "process" | "decision" | "start"
    parent?: FlowchartNode
    text?: string
    flowchart?: Flowchart
    x?: number | string
    y?: number | string
}

export class FlowchartNode {
    type: string = "unknown"
    
    foreignObject: SVGForeignObjectElement | null = null
    private _x = "0"
    private _y = "0"

    offsetPadding = 40

    id: string = crypto.randomUUID()
    el: HTMLElement
    flowchart: Flowchart | null = null

    children: FlowchartNode[] = []
    parents: FlowchartNode[] = []

    isSelected: boolean = false
    
    eventListeners: Array<{ name: string, callback: () => void }> = []
    private _isHover: boolean = false
    private _isVisible: boolean = false
    private _text: string = ""

    init?(): void

    constructor(options: Partial<FlowchartNodeOptions>) {
        this.#init()
        

        this.foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject")
    
        // Geef het een initiële grootte (vereist door browsers)
        this.foreignObject.setAttribute("width", "1000")
        this.foreignObject.setAttribute("height", "1000")
        this.foreignObject.setAttribute("id", this.id)
        this.foreignObject.setAttribute("x", "0")
        this.foreignObject.setAttribute("y", "0")
        this.el = this.#createEl()
        this.foreignObject.appendChild(this.el)
        

        if (options) {

            if (options.flowchart) {
                this.flowchart = options.flowchart
            }

            if (options.parent) {
                this.addParent(options.parent)
            }
            
            if (options.text) {
                this.text = options.text
            }

            if (options.type) {
                this.type = options.type
            }
            setTimeout(() => {
                if (options.x) {
                    this.setX(options.x)
                }

                if (options.y) {
                    this.setY(options.y)
                }
            })
        }

        if (this.flowchart) {
            this.flowchart.addNode(this)
            this.updatePosition()
        }
        
    }
    
    #init() {
        setTimeout(() => {
            // Need to add event Listener in setTimeout to ensure child classes have the proper binding in setIsHover
            document.addEventListener("mousemove", this.setIsHover)

            this.el.classList.add(`${this.type}-node`)
            if (this.init) {
                this.init()
            }
        }, 0)
    }

    #createEl() {
        this.el = document.createElement("div")
        this.el.classList.add("flowchart-node")
        return this.el
    }

    get width(): number {
        return this.el.clientWidth
    }

    get height(): number {
        return this.el.clientHeight
    }

    /** Text **/

    get text(): string {
        return this._text
    }

    set text(value: string) {
        this._text = value
        if (!this.el) return

        // Convert text to multiple lines
        this.el.innerHTML = ""
        for (const line of this.lines) {
            const div = document.createElement("div")
            div.textContent = line
            this.el.appendChild(div)
        }

        // Update position after text change to adjust for new size
        this.updatePosition()
    }

    get lines(): string[] {
        return this.text.split("\n")
    }


    /** Visible **/

    set isVisible(value: boolean) {
        this._isVisible = value

        if (!this.el) return

        if (value) {
            this.el.style.opacity = "1"
        } else {
            this.el.style.opacity = "0"
        }
    }

    get isVisible() {
        return this._isVisible
    }

    /** Hover **/
    
    set isHover(value: boolean) {
        if (value) {
            this.onMouseEnter()
        } else {
            this.onMouseLeave()
        }
        this._isHover = value
    }
    
    get isHover() {
        return this._isHover
    }

    setIsHover = (e: MouseEvent) => {
        if (!this.flowchart?.parentElement) return
        if (!this.el) return

        const rect = this.el.getBoundingClientRect()
        const mouseX = e.clientX
        const mouseY = e.clientY

        // if this.type === "process"
        this.isHover = mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom
    }

    /** Event listeners */
    addEventListener(eventName: string, callback: () => void) {
        this.eventListeners.push({ name: eventName, callback })
    }

    removeEventListener(eventName: string, callback: () => void) {
        this.eventListeners = this.eventListeners.filter(e => e.name !== eventName || e.callback !== callback)
    }

    removeAllEventListeners(eventName: string) {
        this.eventListeners = this.eventListeners.filter(e => e.name !== eventName)
    }

    #triggerEvent(eventName: string) {
        this.eventListeners.forEach(e => {
            if (e.name === eventName) {
                e.callback()
            }
        })
    }

    /** Position **/

    updatePosition(first = true) {
        if (!this.el) return

        if (first) {
            return setTimeout(() => {
                this.updatePosition(false)
                this.isVisible = true
            }, 0)
        }


        if (!this.foreignObject)  return

        this.foreignObject.setAttribute("x", this.x.toString())
        this.foreignObject.setAttribute("y", this.y.toString())

        // notify listeners
        this.#triggerEvent("updatePosition")
    }

    get x(): number {
        return parseFloat(this._x)
    }

    set x (value: number | string) {
        this.setX(value)
    }
    
    setX(value: number | string) {
        if (!this.flowchart) return
        if (!this.foreignObject) return
        let res = ""
        
        if (typeof value === "number") {
            res = value + "px"
        } else if (value.includes("%")) {
            console.log(this.width)
            res = this.flowchart.width * parseFloat(value) / 100 - this.width / 2 + "px"
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
        if (!this.foreignObject) return
        let res = ""

        if (typeof value === "number") {
            res = value + "px"
        } else if (value.includes("%")) {
            res = this.flowchart.height * parseFloat(value) / 100 - this.height / 2 + "px"
        } else {
            res = value
        }

        this._y = res
        this.updatePosition(false)
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
            const edge = new FlowchartEdge( node, this )
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

            const edge = new FlowchartEdge( node, this )
            console.log("Adding edge", edge)
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
        this.el.classList.add("__isHover")
    }
    onMouseLeave() {
        this.el.classList.remove("__isHover")
    }

    destroy() {
        document.removeEventListener("mousemove", this.setIsHover)  
        if (this.foreignObject) { this.foreignObject.remove()}
        if (this.el) { this.el.remove() }
    }

}

export default FlowchartNode