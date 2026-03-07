import { PanTool } from "./chart-tools/pan"
import { ZoomTool } from "./chart-tools/zoom"
import { SelectTool } from "./chart-tools/select"

import FlowchartNode from "./nodes/index"
import type { FlowchartTool } from "./types"

export class Flowchart {
    el = null as HTMLElement | null
    nodes = [] as Array<FlowchartNode>
    chart: HTMLDivElement

    _tools = [] as Array<{ name: string, object: FlowchartTool }>
    _zoom = 1
    
    pan = new Proxy({ x: 0, y: 0 }, {
        set: (target, prop, value) => {
            target[prop as "x" | "y"] = value
            this.chart.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`
            return true
        }
    })

    constructor(el?: HTMLElement | string, options?: {}) { 
        if (!el) {
            this.el = document.createElement("div")
            this.el.classList.add("flowchart")
        } else if (typeof el === "string") {
            this.el = document.querySelector(el)
            if (!this.el) {
                throw new Error(`Failed to initialize flowchart: No element found with selector "${el}"`)
            }
        } else if (el instanceof HTMLElement) {
            this.el = el
        }

        if (!this.el) {
            throw new Error("Failed to initialize flowchart: Invalid element")
        }

        if (!this.el.classList.contains("flowchart")) {
            this.el?.classList.add("flowchart")
        }

        const oldChart = this.el.querySelector(".flowchart-chart")
        if (oldChart) {
            this.el.removeChild(oldChart)
        }

        this.chart = document.createElement("div")
        this.chart.className = "flowchart-chart"
        this.el.appendChild(this.chart)

        // Default tools
        this.addTool({ name: "pan", object: new PanTool(this) })
        this.addTool({ name: "zoom", object: new ZoomTool(this) })
        this.addTool({ name: "select", object: new SelectTool(this) })
    }

    /** Dimensions **/

    get width() {
        return this.el?.clientWidth || 0
    }

    get height() {
        return this.el?.clientHeight || 0
    }

    /** Zoom **/

    set zoom(value: number) {
        this._zoom = value
        this.chart.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`
    }

    get zoom() {
        return this._zoom
    }

    // ▗▖  ▗▖ ▗▄▖ ▗▄▄▄ ▗▄▄▄▖ ▗▄▄▖
    // ▐▛▚▖▐▌▐▌ ▐▌▐▌  █▐▌   ▐▌   
    // ▐▌ ▝▜▌▐▌ ▐▌▐▌  █▐▛▀▀▘ ▝▀▚▖
    // ▐▌  ▐▌▝▚▄▞▘▐▙▄▄▀▐▙▄▄▖▗▄▄▞▘

    addNode(node: FlowchartNode, parent?: FlowchartNode | string) {
        if (!this.el) return
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
            node.input = parent
            parent.outputs.push(node)
        }

        if (node) {
            this.nodes.push(node)
            node.connectWithChart(this)
            console.log("Added node:", node)
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
        if (oldNode.input) {
            newNode.input = oldNode.input

            // Unsure if this is necessary, should make a flowchart of this to see 🙈
            const inputIndex = oldNode.input.outputs.findIndex(n => n.id === oldNode?.id)
            if (inputIndex !== -1) {
                oldNode.input.outputs[inputIndex] = newNode
            }
        }

        oldNode.outputs.forEach(output => {
            output.input = newNode
            newNode.outputs.push(output)
        })

        // Remove old node and add new node to flowchart
        this.removeNode(oldNode)
        this.addNode(newNode)
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
        
        if (this.el) {
            // if this.el.classList has a class that starts with "__tool", remove it
            const toolClasses = Array.from(this.el.classList).filter(c => c.startsWith("__tool"))
            toolClasses.forEach(c => this.el?.classList.remove(c))

            let tools = this._tools.map(t => t.name).join(",")
            this.el.setAttribute("data-tools", tools)
            // Add class for the current tool
            this._tools.forEach(t => {
                if (!this.el) return

                if (t.object) {
                    this.el.classList.add(`__tool${t.name.charAt(0).toUpperCase() + t.name.slice(1)}`)
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

        if (this.el) {

            // Remove class for the current tool
            this.el.classList.remove(`__tool${toolName.charAt(0).toUpperCase() + toolName.slice(1)}`)

            this.el.removeAttribute("data-tool")
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

        this.el = null
    }
}

export default Flowchart