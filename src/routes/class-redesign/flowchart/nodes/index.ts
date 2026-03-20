import { type Flowchart } from "../index"

export type FlowchartNodeOptions = {
    type?: "end" | "process" | "decision" | "start"
    parent?: FlowchartNode
    text?: string
    flowchart?: Flowchart
    x?: number | string
    y?: number | string
}

const typeShapes = {
    "process": "rectangle",
    "decision": "diamond",
    "start": "rounded-rectangle",
    "end": "rounded-rectangle"
}

export class FlowchartNode {
    type: string = "unknown"
    width: number = 0
    height: number = 0
    
    shape = "rectangle" as "rectangle" | "diamond" | "rounded-rectangle" | string
    _x = "0"
    _y = "0"

    offsetPadding = 40

    id: string = crypto.randomUUID()
    el: HTMLElement
    flowchart: Flowchart | null = null

    children: FlowchartNode[] = []
    parents: FlowchartNode[] = []

    isSelected: boolean = false
    
    private _isHover: boolean = false
    private _isVisible: boolean = false
    private _text: string = ""

    init?(): void

    constructor(options: Partial<FlowchartNodeOptions>) {
        this.#init()
        
        this.el = document.createElement("div")
        this.el.classList.add("flowchart-node")
        

        if (options) {
            if (options.flowchart) {
                this.connectWithChart(options.flowchart)
                
            }

            if (options.parent) {
                this.addParent(options.parent)
            }
            
            if (options.text) {
                this.text = options.text
            }

            if (options.x) {
                this.x = options.x
            }

            if (options.y) {
                this.y = options.y
            }

            if (options.type) {
                this.type = options.type
                this.shape = typeShapes[options.type] || "rectangle"
            }
        }

        if (this.flowchart) {
            this.flowchart.addNode(this)
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

    connectWithChart(flowchart: Flowchart) {
        
        this.flowchart = flowchart
        this.flowchart.chart.appendChild(this.el)

        this.updatePosition()
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
        if (!this.flowchart?.el) return
        if (!this.el) return

        const rect = this.el.getBoundingClientRect()
        const mouseX = e.clientX
        const mouseY = e.clientY

        // if this.type === "process"
        this.isHover = mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom
    }

    /** Position **/

    updatePosition(first = true) {
        if (!this.el) return

        const rect = this.el.getBoundingClientRect()
        this.width = rect.width
        this.height = rect.height

        setTimeout(() => {
            if (first) {
                this.updatePosition(false)

                // setTimeout(() => {
                //     this.setPosX()
                //     this.setPosY()
                // }, 0)
                this.isVisible = true
            }
        }, 0)
    }

    set x (value: number | string) {
        if (!this.flowchart) return
        if (!this.el) return
        let res = ""

        if (typeof value === "number") {
            res = value + "px"
        } else if (value.includes("%")) {
            res = this.flowchart.width * parseFloat(value) / 100 - this.width / 2 + "px"
        } else {
            res = value
        }
        this._x = res
        this.el.style.translate = `${this.x}px ${this.y}px`
    }

    get x() {
        return parseFloat(this._x)
    }

    set y (value: number | string) {
        if (!this.flowchart) return
        if (!this.el) return
        let res = ""

        if (typeof value === "number") {
            res = value + "px"
        } else if (value.includes("%")) {
            res = this.flowchart.height * parseFloat(value) / 100 - this.height / 2 + "px"
        } else {
            res = value
        }

        this._y = res
        this.el.style.translate = `${this.x}px ${this.y}px`
    }

    get y() {
        return parseFloat(this._y)
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

    onMouseEnter() {}
    onMouseLeave() {}

    destroy() {
        document.removeEventListener("mousemove", this.setIsHover)  
        if (this.el) { this.el.remove() }
    }

}

export default FlowchartNode