import { PanTool } from "./chart-tools/pan"
import { ZoomTool } from "./chart-tools/zoom"
import { SelectTool } from "./chart-tools/select"

import FlowchartNode from "./nodes/index"
import FlowchartEdge from "./edge"
import type { FlowchartTool } from "./types"
import { MoveNodeTool } from "./chart-tools/move-node"
import type { EdgeType } from "./edge"

interface FlowchartOptions {
    edgeType?: EdgeType
}

export class Flowchart {
    parentElement = null as HTMLElement | null
    nodes = [] as Array<FlowchartNode>
    edges = [] as Array<FlowchartEdge>

    // @ts-ignore This happens in the #addChart method that is being triggered in the constructor.
    chart: SVGElement 
    nodesGroup = null as SVGGElement | null
    edgesGroup = null as SVGGElement | null

    _tools = [] as Array<{ name: string, object: FlowchartTool }>
    _zoom = 1
    options = new Proxy<FlowchartOptions>({ edgeType: "smart-curve" }, {
        set: (target, prop, value) => {
            target[prop as keyof FlowchartOptions] = value
            if (prop === "edgeType") {
                this.edges.forEach(edge => {
                    edge.type = value
                })
            }
            return true
        }
    })
    
    pan = new Proxy({ x: 0, y: 0 }, {
        set: (target, prop, value) => {
            target[prop as "x" | "y"] = value
            this.#updateViewBox()
            return true
        }
    })

    constructor(el?: HTMLElement | string, options?: FlowchartOptions = {}) { 
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
        this.addTool({ name: "pan", object: new PanTool(this) })
        this.addTool({ name: "zoom", object: new ZoomTool(this) })
        this.addTool({ name: "select", object: new SelectTool(this) })
        this.addTool({ name: "move-node", object: new MoveNodeTool(this) })
    }

    #parseOptions(options?: FlowchartOptions) {
        if (!options) return
        for (const key in options) {
            this.options[key as keyof FlowchartOptions] = options[key as keyof FlowchartOptions] as any
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

    /** Zoom **/

    set zoom(value: number) {
        this._zoom = value
    }

    get zoom() {
        return this._zoom
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

    addTool(tool: { name: string, object: FlowchartTool }) {
        // Check if tool already exists in _tools
        const existingTool = this._tools.find(t => t.name === tool.name)
        if (existingTool) {
            return
        }
        this._tools.push(tool)
        
        if (this.parentElement) {
            // if this.parentElement.classList has a class that starts with "__tool", remove it
            const toolClasses = Array.from(this.parentElement.classList).filter(c => c.startsWith("__tool"))
            toolClasses.forEach(c => this.parentElement?.classList.remove(c))

            let tools = this._tools.map(t => t.name).join(",")
            this.parentElement.setAttribute("data-tools", tools)
            // Add class for the current tool
            this._tools.forEach(t => {
                if (!this.parentElement) return

                if (t.object) {
                    this.parentElement.classList.add(`__tool${t.name.charAt(0).toUpperCase() + t.name.slice(1)}`)
                }
            })
        }

        return tool.object
    }

    removeTool(toolName: string) {
        // Remove tool from _tools
        const tool = this._tools.find(t => t.name === toolName)
        if (tool) {
            if (tool.object) {
                tool.object.destroy()
            }
            this._tools = this._tools.filter(t => t.name !== toolName)
        }

        if (this.parentElement) {

            // Remove class for the current tool
            this.parentElement.classList.remove(`__tool${toolName.charAt(0).toUpperCase() + toolName.slice(1)}`)

            this.parentElement.removeAttribute("data-tool")
        }
    }

    activateTool(toolName: string) {
        const tool = this._tools.find(t => t.name === toolName)
        if (tool) {
            tool.object.activate()
        }
    }

    deactivateTool(toolName: string) {
        const tool = this._tools.find(t => t.name === toolName)
        if (tool) {
            tool.object.deactivate()
        }
    }

    getTool(toolName: string) {
        const tool = this._tools.find(t => t.name === toolName)
        if (!tool) {
            return undefined
        }

        return tool.object
    }

    /********************************************************/

    destroy() {
        this.nodes = []
        this.chart.remove()

        this._tools.forEach(t => t.object?.destroy())

        this.parentElement = null
    }
}

export default Flowchart