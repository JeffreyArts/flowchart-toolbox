import type { Flowchart } from ".."
import FlowchartTool from "."
import type { FlowchartEventContext,  FlowchartNodeEvent } from "../events"
import { FlowchartNode } from "../nodes"

export type EditNodeTextToolOptions = {
    autoFocus: boolean
}

type TextSelection = {
    start: number
    end: number
    direction: "forward" | "backward" | "none"
}

export class EditNodeTextTool extends FlowchartTool {
    name = "edit-node-text"
    selectedNode = undefined as FlowchartNode | undefined
    blinkInterval = undefined as ReturnType<typeof setInterval> | undefined
    caretEl = undefined as SVGLineElement | undefined
    svgGroup = undefined as SVGGElement | undefined
    inputElement = undefined as HTMLInputElement | undefined

    state = {
        active: true,
    }

    private selection = new Proxy({ 
        start: 0,
        end: 0,
        direction: "none"
    } as TextSelection,
    { 
        set: (target, prop, value) => {
            target[prop] = value

            requestAnimationFrame(() => {
                if (this.inputElement) {
                    this.syncSelection()
                }
            })

            return true
        }
    })

    get focus() { return !!this.selectedNode }

    options = new Proxy<EditNodeTextToolOptions>({
        autoFocus: true,
    }, {
        set: (target, prop, value) => {
            (target as Record<string, any>)[prop as string] = value

            return true
        }
    })
    
    constructor(flowchart: Flowchart, options?: EditNodeTextToolOptions) {
        super(flowchart)
        
        this.updateOptions(options)

        this.flowchart.events.add("nodeAdded", this.onNodeAdded)
        this.flowchart.events.add("mouseDown", this.onMouseDown, -1)
        this.flowchart.events.add("mouseMove", this.onMouseMove, -1)
        this.flowchart.events.add("keyDown", this.onKeyDown)
        this.flowchart.events.add("keyUp", this.onKeyUp)
    }
    
    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 


    private updateOptions(options?: Partial<EditNodeTextToolOptions>) {
        if (options) {
            Object.assign(this.options, options)
        }
    }

    private syncSelection() {
        console.log("Syncing selection:", this.selection.start)
        if (!this.inputElement || !this.selectedNode) return
        if (this.selection.start === this.inputElement.selectionStart) return // Prevent infinite loop

        // Check if inputElement is focused
        if (document.activeElement !== this.inputElement) {
            this.inputElement.focus()
        }
        // if inputElement is focused, but selection is different, update it
        if (this.inputElement.selectionStart === this.selection.start || this.inputElement.selectionEnd === this.selection.end) {
            return
        }

        if (this.selection.end >= this.selection.start) {
            this.selection.direction = "forward"
        } else if (this.selection.end < this.selection.start) {
            this.selection.direction = "backward"
        }

        if (this.selection.direction == "backward") {
            this.inputElement.setSelectionRange(this.selection.end, this.selection.start)
        } else {
            console.log(this.selection.start, this.selection.end)
            this.inputElement.setSelectionRange(this.selection.start, this.selection.end)
        }
        // }

        this.updateSVGCaretPosition()
        // this.selectedNode.svgGroup.querySelector("#text-caret")?.remove()
        // this.createCaretEl(this.selectedNode, this.converIndexToPos( this.selection.start))
    }

    private selectNode(node: FlowchartNode) {
        this.selectedNode = node

        if (!this.svgGroup) {
            this.svgGroup = document.createElementNS("http://www.w3.org/2000/svg", "g")
            this.svgGroup.setAttribute("tool", "edit-node-text-tool")
    
            node.svgGroup.appendChild(this.svgGroup)
        }

        if (!this.caretEl) {
            this.caretEl = this.createCaretEl()
        }

        if (!this.inputElement) {
            this.createInputElement()
        }

        return node
    }

    private deselectNode() {
        // Remove svgGroup from node
        if (this.svgGroup) {
            this.svgGroup.remove()
            this.svgGroup = undefined
        }

        if (this.caretEl) {
            this.caretEl.remove()
            this.caretEl = undefined
        }

        if (this.inputElement) {
            // this.inputElement.removeEventListener("blur", onBlur)
            // this.inputElement.removeEventListener("input", onInput)
            this.inputElement.remove()
            this.inputElement = undefined
        }
            
        this.selectedNode = undefined
    }

    private createInputElement(node?: FlowchartNode, startPos = this.selection.start, endPos = this.selection.end) {
        if (!node) {
            node = this.selectedNode
            if (!node) {
                throw new Error("No node selected")
            }
        }
        if (!node.flowchart?.parentElement) {
            throw new Error("Node is not attached to a flowchart")
        }

        const textEl = this.flowchart.chart.querySelector(`[id="${node.id}"] text`) as SVGTextElement | null
        const fontSize = parseFloat(getComputedStyle(textEl ?? node.svgGroup).fontSize) || 16
        const fontFamily = getComputedStyle(textEl ?? node.svgGroup).fontFamily || "inherit"
        
        const inputElement = document.createElement("textarea")
        inputElement.value = node.text
        inputElement.style.position = "fixed"
        inputElement.style.left = "0"
        inputElement.style.top = "0"
        inputElement.style.width = `${node.width}px`
        inputElement.style.height = `${node.height}px`
        inputElement.style.fontSize = fontSize + "px"
        inputElement.style.fontFamily = fontFamily
        // inputElement.style.zIndex = "990000000"

        document.body.appendChild(inputElement)

        console.log("Created input element:", inputElement, startPos)
        
        const onInput = (event: InputEvent) => {
            // if (event.key === "Enter") {
            //     inputElement.blur()
            // }// else {
            // }
            // console.log("Input event:", event)
            // node.svgGroup.querySelector("#text-caret")?.remove()
            node.text = inputElement.value
        }

        inputElement.addEventListener("input", onInput)
        this.inputElement = inputElement

        if (!this.blinkInterval) {
            this.blinkInterval = setInterval(() => {
                if (!this.focus) { 
                    return clearInterval(this.blinkInterval)
                }
                const caret = node.svgGroup.querySelector("#text-caret")
                if (!caret) return
                
                const opacity = caret.getAttribute("opacity") === "0" ? "1" : "0"
                caret.setAttribute("opacity", opacity)
                
            }, 500)
        }
        inputElement.focus()
        inputElement.setSelectionRange(startPos, endPos)
        // setTimeout(() => {

        //     console.log("FOCUS",startPos, endPos)
        //     // inputElement.setSelectionRange(this.selection.start, this.selection.end)
        // }, 0)
    }
    
    
    private caretGetPositionFromSVGCoordinate(node: FlowchartNode, coordinate: { x: number, y: number }): number {
        const textEl = this.flowchart.chart.querySelector(`[id="${node.id}"] text`) as SVGTextElement | null
        if (!textEl) return 0

        const tspanArray = Array.from(textEl.querySelectorAll("tspan"))
        let globalIndex = 0

        for (const tspan of tspanArray) {
            const tspanLength = tspan.textContent?.length ?? 0

            for (let i = 0; i < tspanLength; i++) {
                const extent = textEl.getExtentOfChar(globalIndex)
                const inRow = coordinate.y >= extent.y && coordinate.y <= extent.y + extent.height

                if (inRow && coordinate.x < extent.x + extent.width / 2) {
                    return globalIndex//this.convertIndexToPos(globalIndex)
                }

                if (inRow) {
                // past midpoint of this char, keep scanning
                    globalIndex++
                    continue
                }

                globalIndex++
            }
        }

        // Click was past all characters — return end of text
        return textEl.getNumberOfChars()
        // return this.convertIndexToPos()
    }

    private convertIndexToPos(index = this.selection.end): { x: number, y: number } {
        const node = this.selectedNode
        if (!node) {
            throw new Error("No node selected")   
        }
        const textEl = this.flowchart.chart.querySelector(`[id="${node.id}"] text`) as SVGTextElement | null
        if (!textEl || node.text.length === 0) return { x: node.x, y: node.y }

        const clampedIndex = Math.min(index, textEl.getNumberOfChars() - 1)
    
        if (index >= textEl.getNumberOfChars()) {
        // End of text: use end of last character
            const last = textEl.getExtentOfChar(clampedIndex)
            return { x: last.x + last.width, y: last.y }
        }
        // console.log("Index to position:", { index, clampedIndex })

        // this.selection.start = index  // not clampedIndex
        const extent = textEl.getExtentOfChar(clampedIndex)
        return { x: extent.x, y: extent.y }
    }
    
    private createCaretEl(): SVGLineElement {
        if (!this.svgGroup) {
            throw new Error("SVG group not initialized")
        }

        const caretEl = document.createElementNS("http://www.w3.org/2000/svg", "line")
        caretEl.setAttribute("stroke", "black")
        caretEl.setAttribute("stroke-width", ".5")
        caretEl.setAttribute("id", "text-caret")
        this.svgGroup.appendChild(caretEl)

        return caretEl
    }

    private updateSVGCaretPosition() {
        if (!this.selectedNode) return
        // console.log("Updating caret position for node:", this.caretEl)
        if (!this.caretEl) return
        const node = this.selectedNode

        const caret = this.convertIndexToPos()
        // console.log("Updating caret position:", caret)
        const textEl = this.flowchart.chart.querySelector(`[id="${node.id}"] text`) as SVGTextElement | null
        const fontSize = parseFloat(getComputedStyle(textEl ?? node.svgGroup).fontSize) || 16

        this.caretEl.setAttribute("x1", `${caret.x}`)
        this.caretEl.setAttribute("x2", `${caret.x}`)
        this.caretEl.setAttribute("y1", `${caret.y}`)
        this.caretEl.setAttribute("y2", `${caret.y + fontSize}`)
    }

    // ██████ ▄▄ ▄▄ ▄▄▄▄▄ ▄▄  ▄▄ ▄▄▄▄▄▄ ▄▄▄▄ 
    // ██▄▄   ██▄██ ██▄▄  ███▄██   ██  ███▄▄ 
    // ██▄▄▄▄  ▀█▀  ██▄▄▄ ██ ▀██   ██  ▄▄██▀ 

    private onKeyDown = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        const event = fec.originalEvent as KeyboardEvent
        
        if ((event.key === "Enter" && !event.shiftKey) || event.key === "Escape") {
            this.deselectNode()
            return
        }

        
    }
    
    private onKeyUp = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        if (!this.inputElement) return
        if (!this.selectedNode) return

        const event = fec.originalEvent as KeyboardEvent
        
        if (typeof this.inputElement.selectionStart === "number") {
            this.selection.start = this.inputElement.selectionStart
        }


        console.log(this.inputElement.selectionStart)

        // if (event.key === "ArrowLeft") {
        //     this.selection.start = Math.max(0, this.selection.start - 1)
        // } else if (event.key === "ArrowRight") {
        //     this.selection.start = Math.min(this.selectedNode.text.length, this.selection.start + 1)
        // }
    }

    private onMouseDown = (fec: FlowchartEventContext) => {  
        if (!this.state.active) return
        const mousePos = this.flowchart.events.mousePos
        const selectedNode = this.flowchart.nodes.find(node => node.shape.containsPoint(mousePos))
        const e = fec.originalEvent as MouseEvent
        // e.preventDefault()
        console.log(this.flowchart.events.mouseDown)
        // let selectedNode = this.selectedNode
        // if (!selectedNode)
        // Clicked outside a node
        if (!selectedNode) {
            this.blinkInterval = undefined
            this.deselectNode()
            return
        }
        
        // Clicked inside a node
        fec.stopPropagation()
        this.selection.start = this.caretGetPositionFromSVGCoordinate(selectedNode, mousePos)
        this.selectedNode = this.selectNode(selectedNode)
        this.selection.end = this.selection.start

        if (this.inputElement) {
            this.inputElement.setSelectionRange(this.selection.start, this.selection.end)
        }
    }

    private onMouseMove = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        const e = fec.originalEvent as MouseEvent
        const mousePos = this.flowchart.events.mousePos
        const selectedNode = this.flowchart.nodes.find(node => node.shape.containsPoint(mousePos))

        if (this.flowchart.events.mouseDown) {
            e.preventDefault()

            if (this.selectedNode) {
                this.selection.end = this.caretGetPositionFromSVGCoordinate(this.selectedNode, mousePos)
            }
         
            console.log("Mouse move:", mousePos, this.selection)

            // if (this.inputElement) {
            //     this.inputElement.focus()
            //     this.inputElement.setSelectionRange(this.selection.start, this.selection.end)
            // }
        }

        if (!selectedNode) {
            return
        }

        if (this.focus) {
            fec.stopPropagation()
        }


    }
    
    private onNodeAdded = (fec: FlowchartEventContext) => {
        if (!fec.originalEvent) return
        const nodeEvent = fec.originalEvent as FlowchartNodeEvent
        const node = nodeEvent.node
        if (!node) return
    
        node.addEventListener("selected", this.onNodeSelected)
        node.addEventListener("deselected", this.onNodeDeselected)
    }
    
    private onNodeSelected = (_node: FlowchartNode) => {
        if (!this.state.active) return
        
        // console.log("EditNodeTextTool: Node selected")
    }
    
        
    private onNodeDeselected = (_node: FlowchartNode) => {
        if (!this.state.active) return

        // console.log("EditNodeTextTool: Node deselected")
    }
}

export default EditNodeTextTool