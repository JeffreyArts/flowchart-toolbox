import { type Flowchart } from "../index"
import FlowchartEdge from "../edges/index"

import TextHelper from "../shapes/text-helper"
import type FlowchartShape from "../shapes/index"

export type FlowchartNodeEventType = "positionChange" | "segmentsChange" | "beforeTextChange" | "afterTextChange" | "mouseOver" | "mouseEntered" | "mouseLeft" | "show" | "hide" | "dimensionChange"
export type FlowchartTypeMethod = (node: FlowchartNode) => FlowchartShape

export type FlowchartNodeOptions = {
    maxWidth: number | string  
    segments: number
    offsetPadding: number
    class: string[]
    shape?: {
        style: Partial<CSSStyleDeclaration>
        class: string | string[]
    },
    text?: {
        style: Partial<CSSStyleDeclaration>
        class: string | string[]
    }
}

export type FlowchartNodeEvent = { name: FlowchartNodeEventType, handler: (node: FlowchartNode) => void }

export type FlowchartNodeConstructOptions = {
    parent?: FlowchartNode
    flowchart?: Flowchart
    x?: number | string
    y?: number | string
    options?: Partial<FlowchartNodeOptions>
    event?: FlowchartNodeEvent
    events?: FlowchartNodeEvent[]
    class?: string | string[]
    shape?: {
        style?: Partial<CSSStyleDeclaration>
        class?: string | string[]
    }
    text?: {
        style?: Partial<CSSStyleDeclaration>
        class?: string | string[]
        value?: string
    } | string
}

export type FlowchartNodeStates = {
    mouseOver: boolean,
    selected: boolean,
    visible: boolean,
    [key: string]: any
}

export type FlowchartNodeTextBox = {
    width: number
    height: number
    lines: string[]
    lineHeight: number
    style?: Partial<CSSStyleDeclaration>
    class?: string
}

export class FlowchartNode {
    prevTextHelper = undefined as TextHelper | undefined
    id: string = crypto.randomUUID()
    type: string
    shape: FlowchartShape
    flowchart: Flowchart | null = null
    children: FlowchartNode[] = []
    parents: FlowchartNode[] = []
    textBox: FlowchartNodeTextBox = { width: 0, height: 0, lines: [], lineHeight: 0, class: "", style: {}}
    svgGroup: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "g")
    
    events: Array<{ name: string, callback: (node: FlowchartNode) => void }> = []

    options = new Proxy<FlowchartNodeOptions>({ 
        maxWidth: "auto",
        segments: 0,
        offsetPadding: 0,
        class: []
    }, {
        set: (target, prop, value) => {
            // Type forcing
            if (prop === "offsetPadding") {
                value = parseFloat(value) || 0
            }

            (target as Record<string, any>)[prop as string] = value
    
            if (prop === "maxWidth") {
                if (this.text) {
                    this.updateTextBox()
                }
                this.updatePosition()
            }

            if (prop === "class") { this.updateSVGGroupClass() }
            if (prop === "segments") { this.triggerEvent("segmentsChange") }
            if (prop === "offsetPadding") { this.updatePosition() }

            return true
        }
    })

    state = new Proxy<FlowchartNodeStates>({
        mouseOver: false,
        mouseLeft: false,
        mouseEntered: false,
        selected: false,
        visible: false,
    }, {
        set: (target, prop, value) => {
            (target as Record<string, any>)[prop as string] = value

            if (prop === "mouseOver") {
                if (value === true) {
                    this.triggerEvent("mouseOver")
                }
            }

            if (prop === "mouseEntered") {
                if (value === true) {
                    this.triggerEvent("mouseEntered")
                }
            }

            if (prop === "mouseLeft") {
                if (value === true) {
                    this.triggerEvent("mouseLeft")
                }
            }

            if (prop === "visible") {
                this.changeVisibility()
                if (value === true) {
                    this.triggerEvent("show")
                } 
                if (value === false) {
                    this.triggerEvent("hide")
                }
            }
            return true
        }
    })

    private _x = "0"
    private _y = "0"
    private _text = ""

    constructor(type: string, options: Partial<FlowchartNodeConstructOptions>) {
        this.svgGroup.id = this.id
        this.svgGroup.classList.add("flowchart-node")
        
        this.parseOptions(options)

        if (!this.flowchart) {
            throw new Error("FlowchartNode must be initialized with a flowchart reference in options or by adding a parent with a flowchart reference")
        }

        const matchedType = this.flowchart.registered.nodes.find(node => node.type === type)
        if (!matchedType) {
            throw new Error(`Invalid node type: ${type}`)
        }
            
        this.type = type
        this.shape = matchedType.shape(this)
        if (matchedType.options) {
            options = { ...options, ...matchedType.options }
        }
        
        this.parseOptions(options)
        this.parseShapeOptions(options)
        this.parseTextOptions(options)

        if (typeof options.text === "string") {
            this.text = options.text
        } else if (typeof options.text === "object" && typeof options.text.value === "string") {
            this.text = options.text.value
        }

        this.flowchart.addNode(this)
        this.updatePosition()
    }
    
    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 

    private parseTextOptions(options: Partial<FlowchartNodeConstructOptions>) {
        const flowchartTextOptions = this.flowchart?.options.nodes?.text
        if (flowchartTextOptions) {
            if (flowchartTextOptions.style) {
                this.textBox.style = { ...this.textBox.style, ...flowchartTextOptions.style }
                
                for (const key in flowchartTextOptions.style) {
                    const value = flowchartTextOptions.style[key] || ""
                    const cssKey = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() // camelCase to kebab-case
                    

                    if (this.shape.textEl) {
                        this.shape.textEl.style.setProperty(cssKey, value)
                    }
                }
            }

            if (flowchartTextOptions.class && this.shape.textEl) {
                if (Array.isArray(flowchartTextOptions.class)) {
                    flowchartTextOptions.class.forEach(c => {
                        if (!this.shape.textEl) return
                        this.shape.textEl.classList.add(c)
                        this.textBox.class += " " + c            
                    })
                } else {
                    this.textBox.class += " " + flowchartTextOptions.class            
                    this.shape.textEl.classList.add(flowchartTextOptions.class)
                }
            }
        }


        if (typeof options.text === "object") {
            if (options.text.style) {
                for (const key in options.text.style) {
                    const value = options.text.style[key] || ""
                    const cssKey = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() // camelCase to kebab-case
                    
                    if (this.shape.textEl) {
                        this.shape.textEl.style.setProperty(cssKey, value)
                    }
                }
            }
            
            if (options.text.class && this.shape.textEl) {
                if (Array.isArray(options.text.class)) {
                    options.text.class.forEach(c => {
                        if (!this.shape.textEl) return
                        this.shape.textEl.classList.add(c)
                    })
                } else {
                    this.shape.textEl.classList.add(options.text.class)
                }
            }
        }
    }

    private parseShapeOptions(options: Partial<FlowchartNodeConstructOptions>) {
        const flowchartShapeOptions = this.flowchart?.options.nodes?.shape
        if (flowchartShapeOptions) {
            if (flowchartShapeOptions.style) {
                for (const key in flowchartShapeOptions.style) {
                    const value = flowchartShapeOptions.style[key] || ""
                    const cssKey = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() // camelCase to kebab-case
                    
                    if (this.shape) {
                        this.shape.style.setProperty(cssKey, value)
                    }
                }
            }

            if (flowchartShapeOptions.class) {
                if (Array.isArray(flowchartShapeOptions.class)) {
                    flowchartShapeOptions.class.forEach(c => this.shape.svgEl.classList.add(c))
                } else {
                    this.shape.svgEl.classList.add(flowchartShapeOptions.class)
                }
            }
        }
        
        if (options.shape) {
            if (options.shape.style) {
                for (const key in options.shape.style) {
                    const value = options.shape.style[key] || ""
                    const cssKey = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() // camelCase to kebab-case
                    
                    if (this.shape) {
                        this.shape.style.setProperty(cssKey, value)
                    }
                }
            }
            
            if (options.shape.class) {
                if (Array.isArray(options.shape.class)) {
                    options.shape.class.forEach(c => this.shape.svgEl.classList.add(c))
                } else {
                    this.shape.svgEl.classList.add(options.shape.class)
                }
            }
        }
    }

    private parseOptions(options: Partial<FlowchartNodeConstructOptions>) {
        if (!options) return
        
        if (options.flowchart) { this.flowchart = options.flowchart}
        if (options.parent) { this.addParent(options.parent) }
        if (options.x) { this.setX(options.x) }
        if (options.y) { this.setY(options.y) }
        if (options.class) { this.updateOptionClass(options.class) }
        
        // First load options from FLOWCHART DEFAULTS
        const flowchartNodeOptions = this.flowchart?.options.nodes
        if (flowchartNodeOptions) {
            for (const key in flowchartNodeOptions) {
                const k = key as keyof FlowchartNodeOptions

                if (key === "events" || key === "event") {
                    if (Array.isArray(flowchartNodeOptions[k])) {
                        flowchartNodeOptions[k].forEach(event => {
                            if (!event.name || !event.handler) {
                                console.warn("Invalid event in flowchart.nodes.events, must have name and handler", event)
                                return
                            }
                            this.addEventListener(event.name, event.handler)
                        })
                    } else if (typeof flowchartNodeOptions[k] === "object" && flowchartNodeOptions[k] !== null) {
                        const event = flowchartNodeOptions[k] as unknown as FlowchartNodeEvent
                        if (event.name && event.handler) {
                            this.addEventListener(event.name, event.handler)
                        } else {
                            console.warn("Invalid event in options.event, must have name and handler", event)
                        }
                    }
                    break
                }

                if (key === "class") {
                    const newClass = flowchartNodeOptions[k] as string | string[]
                    if (newClass) {
                        this.updateOptionClass(newClass)
                    }
                    break
                }
                (this.options as Record<string, any>)[k] = flowchartNodeOptions[k]
            }
        }

        // Then load options from the CONSTRUCTOR options
        if (options.options) {
            const nodeOptions = options.options
            for (const key in nodeOptions) {
                const k = key as keyof FlowchartNodeOptions
                (this.options as Record<string, any>)[k] = nodeOptions[k]
            }
        }
        

        // Add event listeners via options
        if (options.events) {
            if (Array.isArray(options.events)) {
                options.events.forEach(e => {
                    if (e.name && e.handler) {
                        this.addEventListener(e.name, e.handler)
                    } else {
                        console.warn("Invalid event in options.events, must have name and handler", e)
                    }
                })
            }
        }

        // Add single event listener via options
        if (options.event) {
            const e = options.event
            if (e.name && e.handler) {
                this.addEventListener(e.name, e.handler)
            } else {
                console.warn("Invalid event in options.event, must have name and handler", e)
            }
        }
    }
    
    private updateOptionClass(newClass: string | string[]) {
        if (Array.isArray(newClass)) {
            newClass.forEach(c => this.options.class.push(c))
        } else if (typeof newClass === "string") {
            this.options.class.push(newClass)
        }

        if (!newClass) {
            return
        }
        this.updateSVGGroupClass()
    }

    private updateSVGGroupClass() {
        const classOption = this.options.class
        this.svgGroup.classList = ""

        classOption.forEach(c => {
            this.svgGroup.classList.add(c)
        })
    }
        
    private updateTextBox() {
        const textHelperStyle = {
            padding: "20px",
            ...this.textBox.style
        } as Partial<CSSStyleDeclaration> 
        
        if (typeof this.options.maxWidth != "undefined") {
            if (typeof this.options.maxWidth === "number") {
                textHelperStyle["maxWidth"] = this.options.maxWidth + "px"
            } else if (!isNaN(Number(this.options.maxWidth))) {
                textHelperStyle["maxWidth"] = this.options.maxWidth + "px"
            } else {
                textHelperStyle["maxWidth"] = this.options.maxWidth
            }
        }
        
        if (this.prevTextHelper) {
            this.prevTextHelper.destroy()
        }
        
        if (!this.shape) {
            console.warn("Shape is not defined for this node, cannot create text helper")
            return
        }

        const textHelper = new TextHelper(this._text, this.shape, textHelperStyle)
        this.textBox = { ...this.textBox, ...textHelper.measure() }
        textHelper.destroy()
        this.prevTextHelper = textHelper
        this.triggerEvent("dimensionChange")
    }

    private changeVisibility() {
        const showEvent = this.events.find(e => e.name === "show")
        const hideEvent = this.events.find(e => e.name === "hide")

        if (this.state.visible && !showEvent) {
            this.svgGroup.style.opacity = "1"
        } else if (!hideEvent) {
            this.svgGroup.style.opacity = "0"
        }
    }

    private triggerEvent(eventName: FlowchartNodeEventType) {
        this.events.forEach(e => {
            if (e.name === eventName) {
                e.callback(this)
            }
        })
    }

    private updatePosition(first = true) {
        if (!this.svgGroup) return

        if (first) {
            return setTimeout(() => {
                this.updatePosition(false)
                this.state.visible = true
            }, 0)
        } else {
            this.triggerEvent("positionChange")
        }
    }

    private setX(value: number | string) {
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

        if (this.flowchart.grid.options.fixToGrid) {
            const fixedCoordinate = this.flowchart.grid.fixCoordinate(parseInt(res, 10), this.y)
            res = fixedCoordinate.x + "px"
        }

        this._x = res
        this.updatePosition(false)
    }

    private setY(value: number | string) {
        if (!this.flowchart) return
        let res = ""

        if (typeof value === "number") {
            res = value + "px"
        } else if (value.includes("%")) {
            res = this.flowchart.height * parseFloat(value) / 100 + "px"
        } else {
            res = value
        }

        if (this.flowchart.grid.options.fixToGrid) {
            const fixedCoordinate = this.flowchart.grid.fixCoordinate(this.x, parseInt(res, 10))
            res = fixedCoordinate.y + "px"
        }

        this._y = res
        this.updatePosition(false)
    }

    // █████▄ ▄▄ ▄▄ ▄▄▄▄  ▄▄    ▄▄  ▄▄▄▄ 
    // ██▄▄█▀ ██ ██ ██▄██ ██    ██ ██▀▀▀ 
    // ██     ▀███▀ ██▄█▀ ██▄▄▄ ██ ▀████  

    /** Text **/
    get text(): string {
        return this._text
    }

    set text(value: string) {
        this.triggerEvent("beforeTextChange")
        this._text = value
        
        this.updateTextBox()

        // Update position after text change to adjust for new size
        this.updatePosition()

        setTimeout(() => {
            this.triggerEvent("afterTextChange")
        })
    }

    /** Event listeners */
    addEventListener(eventName: FlowchartNodeEventType, callback: (node: FlowchartNode) => void) {
        this.events.push({ name: eventName, callback })
    }

    removeEventListener(eventName: FlowchartNodeEventType, callback: () => void) {
        this.events = this.events.filter(e => e.name !== eventName || e.callback !== callback)
    }

    removeAllEventListeners(eventName: FlowchartNodeEventType) {
        this.events = this.events.filter(e => e.name !== eventName)
    }

    /** Position & dimensions **/
    get x(): number {
        return parseFloat(this._x)
    }

    set x (value: number | string) {
        this.setX(value)
    }
    
    get y(): number {
        return parseFloat(this._y)
    }

    set y (value: number | string) {
        this.setY(value)
    }

    get width(): number {
        if (!this.shape) {
            return 0
        }

        return this.shape.width
    }

    get height(): number {
        if (!this.shape) {
            return 0
        }

        return this.shape.height
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

        // Create edge if both nodes are in the same flowchart
        if (this.flowchart && node.flowchart && this.flowchart === node.flowchart) {
            const edge = new FlowchartEdge( node, this, { ... this.flowchart.options.edges } )
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

    /** General public methods **/
    calculateEdgeStart(point: { x: number, y: number }, offset = 0, segments?: number): { x: number, y: number } {
        if (!this.shape) {
            throw new Error("Cannot calculate edge start position without a shape defined for the node.")
        }
        const startNode = this

        if (!segments) {
            segments = startNode.options.segments
        }
        let targetPosition = {
            x: point.x,
            y: point.y
        }

        let degrees = Math.atan2(targetPosition.y - startNode.y, targetPosition.x - startNode.x) * (180 / Math.PI) + 90
        if (segments > 0) {
            const anglePerSegment = 360 / segments
            degrees = Math.round(degrees / anglePerSegment) * anglePerSegment            
            const rad = (degrees - 90) * (Math.PI / 180)
            targetPosition = {
                x: this.x + Math.cos(rad) * 1000,
                y: this.y + Math.sin(rad) * 1000,
            }
        }

        const rad = (degrees - 90) * (Math.PI / 180)
        const dist = this.shape.getBorderDistance(targetPosition, offset) + startNode.options.offsetPadding
        return {
            x: this.x + Math.cos(rad) * dist,
            y: this.y + Math.sin(rad) * dist,
        }
    }

    destroy() {
        // document.removeEventListener("mousemove", this.boundSetIsHover)
        // if (this.flowchart)
        // if (this.foreignObject) { this.foreignObject.remove()}
        if (this.svgGroup) { this.svgGroup.remove() }
        if (this.shape) { this.shape.destroy() }
    }
}

export default FlowchartNode