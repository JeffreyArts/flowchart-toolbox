import { PanTool } from "./chart-tools/pan"
import { ZoomTool } from "./chart-tools/zoom"
import { SelectTool } from "./chart-tools/select"

import FlowchartNode, { type FlowchartNodeOptions, type FlowchartTypeMethod } from "./nodes/index"
import FlowchartEdge, { type FlowchartEdgeOptions } from "./edges/index"
import { type DrawEdgeType } from "./edges/index"
import { type FlowchartTool } from "./chart-tools/index"
import { MoveNodeTool } from "./chart-tools/move-node"


// Default nodes
import StartNode from "./nodes/types/start"
import EndNode from "./nodes/types/end"
import DecisionNode from "./nodes/types/decision"
import ProcessNode from "./nodes/types/process"


// Default edges
import drawStraightEdge from "./edges/draw/straight"
import drawElbowEdge from "./edges/draw/elbow"
import drawZigZagEdge from "./edges/draw/zigzag"
import drawDiagonalEdge from "./edges/draw/diagonal"
import drawDoubleDiagonalEdge from "./edges/draw/double-diagonal"

interface FlowchartOptions {
    edges: Partial<FlowchartEdgeOptions>
    nodes: Partial<FlowchartNodeOptions>
}

type FlowchartToolConstructor = new (...args: any[]) => FlowchartTool


export class Flowchart {
    parentElement = null as HTMLElement | null
    nodes = [] as Array<FlowchartNode>
    edges = [] as Array<FlowchartEdge>

    // @ts-ignore This happens in the #addChart method that is being triggered in the constructor.
    chart: SVGElement 
    nodesGroup = null as SVGGElement | null
    edgesGroup = null as SVGGElement | null

    options = {
        edges: new Proxy<Partial<FlowchartEdgeOptions>>({ showArrow: true }, {
            set: (target, prop, value) => {
                const key = prop as keyof FlowchartEdgeOptions
                target[key] = value
                this.edges.forEach(edge => {
                    (edge.options as Record<string, any>)[key] = value
                })
                return true
            }
        }),
        nodes: new Proxy<Partial<FlowchartNodeOptions>>({ }, {
            set: (target, prop, value) => {
                target[prop as keyof FlowchartNodeOptions] = value
                if (prop === "segments") {
                    this.nodes.forEach(node => {
                        node.segments = value
                    })
                }
                return true
            }
        }),
    }

    registered = {
        nodes: [] as Array<{ type: string, shape: FlowchartTypeMethod }>,
        edges: [] as Array<{ type: string, draw: DrawEdgeType }>,
        tools: [] as Array<{ type: string, object: FlowchartTool }>
    }

    // Pan
    pan = new Proxy({ x: 0, y: 0 }, {
        set: (target, prop, value) => {
            target[prop as "x" | "y"] = value
            this.#updateViewBox()
            return true
        }
    })

    // Zoom 
    _zoom = 1
    get zoom() { return this._zoom }
    set zoom(value: number) {
        this._zoom = value
        this.edges.forEach(edge => edge.updatePosition())
    }

    constructor(el?: HTMLElement | string, options?: FlowchartOptions) { 
        if (!el) {
            this.parentElement = document.createElement("div")
            this.parentElement.classList.add("flowchart")
        } else if (typeof el === "string") {
            this.parentElement = document.querySelector(el)
            if (!this.parentElement) {
                throw new Error(`Failed to initialize flowchart: No element found with selector "${el}"`)
            }
        } else if (el instanceof HTMLElement) {
            this.parentElement = el
        }

        if (!this.parentElement) {
            throw new Error("Failed to initialize flowchart: Invalid element")
        }

        if (!this.parentElement.classList.contains("flowchart")) {
            this.parentElement?.classList.add("flowchart")
        }

        const oldChart = this.parentElement.querySelector(".flowchart-chart")
        if (oldChart) {
            this.parentElement.removeChild(oldChart)
        }

        this.#parseOptions(options)
        this.#addChart()
        
        // Default tools
        this.register("tool","zoom", ZoomTool)
        this.register("tool","select", SelectTool)
        this.register("tool","move-node", MoveNodeTool)
        this.register("tool","pan", PanTool)

        // Default Nodes
        this.register("node", "process", ProcessNode)
        this.register("node", "start", StartNode)
        this.register("node", "end", EndNode)
        this.register("node", "decision", DecisionNode)

        // Default edges
        this.register("edge", "straight", drawStraightEdge)
        this.register("edge", "elbow", drawElbowEdge)
        this.register("edge", "zigzag", drawZigZagEdge)
        this.register("edge", "diagonal", drawDiagonalEdge)
        this.register("edge", "double-diagonal", drawDoubleDiagonalEdge)
    }

    #parseOptions(options?: FlowchartOptions) {
        if (!options) return
        if (options.edges) {
            for (const key in options.edges) {
                this.options.edges[key as keyof FlowchartEdgeOptions] = options.edges[key as keyof FlowchartEdgeOptions] as any
            }
        }
        if (options.nodes) {
            for (const key in options.nodes) {
                this.options.nodes[key as keyof FlowchartNodeOptions] = options.nodes[key as keyof FlowchartNodeOptions] as any
            }
        }
    }

    register(registrationType: "node" | "edge" | "tool", type: string, value: FlowchartTypeMethod | DrawEdgeType | FlowchartToolConstructor) {
        if (registrationType === "node") {
            this.registered.nodes.push({ type: type, shape: value as FlowchartTypeMethod })
        } else if (registrationType === "edge") {
            this.registered.edges.push({ type: type, draw: value as DrawEdgeType })
        } else if (registrationType === "tool") {
            const o = value as FlowchartToolConstructor
            this.registered.tools.push({ type: type, object: new o(this) })
        }
    }

    #addChart() {
        if (!this.parentElement) return
        this.chart = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        this.chart.setAttribute("width", "100%")
        this.chart.setAttribute("height", "100%")   
        this.chart.classList.add("flowchart-chart")

        this.nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
        this.nodesGroup.classList.add("flowchart-nodes")
        
        this.edgesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
        this.edgesGroup.classList.add("flowchart-edges")
        

        this.chart.appendChild(this.edgesGroup)
        this.chart.appendChild(this.nodesGroup)
        this.parentElement.appendChild(this.chart)
        
        setTimeout(() => {
            this.updateChartSize()
        })
        return this.chart
    }

    #updateViewBox() {
        const width = this.chart.clientWidth
        const height = this.chart.clientHeight

        const x = -this.pan.x / this.zoom
        const y = -this.pan.y / this.zoom
        const w = width / this.zoom
        const h = height / this.zoom

        this.chart.setAttribute("viewBox", `${x} ${y} ${w} ${h}`)
    }

    updateChartSize() {
        if (!this.chart) return
        this.chart.setAttribute( "viewBox", `0 0 ${this.chart.clientWidth} ${this.chart.clientHeight}`)
    }

    /** Dimensions **/

    get width() {
        return this.parentElement?.clientWidth || 0
    }

    get height() {
        return this.parentElement?.clientHeight || 0
    }

    // ▗▖  ▗▖ ▗▄▖ ▗▄▄▄ ▗▄▄▄▖ ▗▄▄▖
    // ▐▛▚▖▐▌▐▌ ▐▌▐▌  █▐▌   ▐▌   
    // ▐▌ ▝▜▌▐▌ ▐▌▐▌  █▐▛▀▀▘ ▝▀▚▖
    // ▐▌  ▐▌▝▚▄▞▘▐▙▄▄▀▐▙▄▄▖▗▄▄▞▘

    addNode(node: FlowchartNode, parent?: FlowchartNode | string) {
        if (!this.parentElement) return
        if (parent) {
            if (typeof parent === "string") {
                parent = this.nodes.find(n => n.id === parent) as FlowchartNode
                if (!parent) {
                    throw new Error(`Parent node with id "${parent}" not found`)
                }
            } else if (parent instanceof FlowchartNode) {
                const alreadyExists = this.nodes.find(n => { 
                    if (parent instanceof FlowchartNode) {
                        return n.id === parent.id
                    }
                }) as FlowchartNode
                if (alreadyExists) {
                    console.warn(`Node with id "${parent.id}" is already in the flowchart, skipping connection`)
                    return
                }
            }
        }

        if (parent instanceof FlowchartNode) {
            node.addParent(parent)
            parent.addChild(node)
        }

        if (node && this.nodesGroup) {
            const existingNode = this.nodes.find(n => n.id === node.id) as FlowchartNode
            if (!existingNode) {
                this.nodes.push(node)
            }
            this.nodesGroup.appendChild(node.svgGroup)
            return node
        }
    }

    removeNode(node: FlowchartNode | string) {
        if (typeof node === "string") {
            node = this.nodes.find(n => n.id === node) as FlowchartNode
            if (!node) {
                throw new Error(`Node with id "${node}" not found`)
            }
        }

        // Remove connected edges
        const connectedEdges = this.edges.filter(e => e.startNode.id === node.id || e.endNode.id === node.id)
        connectedEdges.forEach(e => this.removeEdge(e))

        // Remove node from flowchart
        this.nodes = this.nodes.filter(n => n.id !== node.id)
        node.destroy()
    }
 
    replaceNode(oldNode: FlowchartNode | string, newNode: FlowchartNode) {
        if (typeof oldNode === "string") {
            oldNode = this.nodes.find(n => n.id === oldNode) as FlowchartNode
            if (!oldNode) {
                throw new Error(`Old node with id "${oldNode}" not found`)
            }
        }

        // Connect new node with old node's input and outputs
        if (oldNode.parents.length > 0) {
            oldNode.parents.forEach(parentNode => {
                newNode.addParent(parentNode)
                oldNode.removeParent(parentNode)
                parentNode.removeChild(oldNode)
                parentNode.addChild(newNode)
            })
        }

        if (oldNode.children.length > 0) {
            oldNode.children.forEach(childNode => {
                newNode.addChild(childNode)
                oldNode.removeChild(childNode)
                childNode.removeParent(oldNode)
                childNode.addParent(newNode)
            })
        }

        newNode.segments = oldNode.segments
        newNode.maxWidth = oldNode.maxWidth
        newNode.x = oldNode.x
        newNode.y = oldNode.y
        newNode.text = oldNode.text

        //  This is already handles by the addParent and addChild methods, which will update the flowchart connections accordingly
        // // Remove old node and add new node to flowchart
        this.removeNode(oldNode)
        this.addNode(newNode)
    }

    // ▗▄▄▄▖▗▄▄▄  ▗▄▄▖▗▄▄▄▖ ▗▄▄▖
    // ▐▌   ▐▌  █▐▌   ▐▌   ▐▌   
    // ▐▛▀▀▘▐▌  █▐▌▝▜▌▐▛▀▀▘ ▝▀▚▖
    // ▐▙▄▄▖▐▙▄▄▀▝▚▄▞▘▐▙▄▄▖▗▄▄▞▘
                            
    addEdge(edge: FlowchartEdge) {
        if (!this.parentElement) return
        if (!edge) return

        const startNode = edge.startNode
        const endNode = edge.endNode

        const existingEdge = this.edges.find(edge => {
            return edge.startNode.id === startNode.id && edge.endNode.id === endNode.id
        })

        if (existingEdge) return
        if (!this.edgesGroup) return
        
        this.edges.push(edge)
        
        edge.updatePosition()
        this.edgesGroup.appendChild(edge.svgGroup)

        startNode.children.push(endNode)
        endNode.parents.push(startNode)
    }

    removeEdge(edge: FlowchartEdge) {
        if (!edge) return
        this.edges = this.edges.filter(e => e !== edge)
        edge.destroy()
    }

    // ▗▄▄▄▖▗▄▖  ▗▄▖ ▗▖    ▗▄▄▖
    //   █ ▐▌ ▐▌▐▌ ▐▌▐▌   ▐▌   
    //   █ ▐▌ ▐▌▐▌ ▐▌▐▌    ▝▀▚▖
    //   █ ▝▚▄▞▘▝▚▄▞▘▐▙▄▄▖▗▄▄▞

    activateTool(toolName: string) {
        const tool = this.registered.tools.find(t => t.type === toolName)
        if (tool) {
            tool.object.activate()
        }
    } 

    deactivateTool(toolName: string) {
        const tool = this.registered.tools.find(t => t.type === toolName)
        if (tool) {
            tool.object.deactivate()
        }
    }

    getTool(toolName: string) {
        const tool = this.registered.tools.find(t => t.type === toolName)
        if (!tool) {
            return undefined
        }

        return tool.object
    }

    /********************************************************/

    destroy() {
        this.nodes = []
        this.edges = []
        this.chart.remove()

        this.registered.tools.forEach(t => t.object?.destroy())

        this.registered.edges = []
        this.registered.nodes = []
        this.registered.tools = []

        this.parentElement = null
    }
}

export default Flowchart