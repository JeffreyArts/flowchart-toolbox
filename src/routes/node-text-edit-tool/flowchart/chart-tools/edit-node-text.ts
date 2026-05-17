import type { Flowchart } from ".."
import FlowchartTool from "."
import type { FlowchartEventContext,  FlowchartNodeEvent } from "../events"
import { FlowchartNode } from "../nodes"

export type EditNodeTextToolOptions = {
    autoFocus: boolean,
    selectionColor: string
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
    svgGroupBg = undefined as SVGGElement | undefined
    inputElement = undefined as HTMLInputElement | undefined

    state = {
        active: true,
        mouseY: 0
    }

    private selection = { 
        start: 0,
        end: 0,
        direction: "none"
    } as TextSelection

    options = new Proxy<EditNodeTextToolOptions>({
        autoFocus: true,
        selectionColor: "rgba(0, 120, 215, 0.4)"
    }, {
        set: (target, prop, value) => {
            (target as Record<string, any>)[prop as string] = value

            if (prop === "selectionColor" && this.selectedNode) {
                this.updateSVGSelection()
            }

            return true
        }
    })
    
    constructor(flowchart: Flowchart, options?: EditNodeTextToolOptions) {
        super(flowchart)
        
        this.updateOptions(options)

        this.flowchart.events.add("nodeAdded", this.onNodeAdded)
        this.flowchart.events.add("doubleClick", this.onDoubleClick)
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

    private updateInputSelection() {
        if (!this.inputElement) return

        console.log("syncing selection", { selection: this.selection }, this.inputElement.selectionStart, this.inputElement.selectionEnd)

        // if (this.selection.end > this.selection.start) {
        //     this.selection.direction = "forward"
        // } else if (this.selection.end < this.selection.start) {
        //     this.selection.direction = "backward"
        // } else {
        // }
            
        if (this.selection.direction == "backward") {
            this.inputElement.setSelectionRange(this.selection.end, this.selection.start)
        } else if (this.selection.direction == "forward") {
            this.inputElement.setSelectionRange(this.selection.start, this.selection.end)
        } else {
            this.inputElement.setSelectionRange(this.selection.start, this.selection.end)
        }
    }

    private updateSelection() {
            
        if (this.selection.start > this.selection.end) {
            this.selection.direction = "backward"
        } else if (this.selection.end > this.selection.start) {
            this.selection.direction = "forward"
        } else {
            this.selection.direction = "none"
        }
        
        window.requestAnimationFrame(() => {
            this.updateSVGSelection()
            this.updateSVGCaretPosition()
        })
        // })
            
        // this.selectedNode.svgGroup.querySelector("#text-caret")?.remove()
        // this.createCaretEl(this.selectedNode, this.converIndexToPos( this.selection.start))
    }

    private selectNode(node: FlowchartNode) {
        this.selectedNode = node
        this.selectedNode.state.selected = true

        if (!this.svgGroupBg) {
            this.svgGroupBg = document.createElementNS("http://www.w3.org/2000/svg", "g")
            this.svgGroupBg.setAttribute("tool", "edit-node-text-tool")
            this.svgGroupBg.setAttribute("background", "")
    
            // Add background after node.shape.svgEl
            node.shape.svgEl.parentNode?.insertBefore(this.svgGroupBg, node.shape.svgEl.nextSibling)
        }

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

        // Remove svgGroupBg from node
        if (this.svgGroupBg) {
            this.svgGroupBg.remove()
            this.svgGroupBg = undefined
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

    private createInputElement(node?: FlowchartNode) {
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
        
        const inputElement = document.createElement("input")
        inputElement.value = node.text
        inputElement.style.position = "fixed"
        inputElement.style.left = "0"
        inputElement.style.top = "0"
        inputElement.style.width = `${node.width}px`
        inputElement.style.height = `${node.height}px`
        inputElement.style.fontSize = fontSize + "px"
        inputElement.style.fontFamily = fontFamily

        document.body.appendChild(inputElement)

        
        const onInput = (event: InputEvent) => {
            if (!this.selectedNode) return
            this.selectedNode.text = inputElement.value
        }

        inputElement.addEventListener("input", onInput)
        this.inputElement = inputElement

        if (!this.blinkInterval) {
            this.blinkInterval = setInterval(() => {
                if (!this.selectedNode) { 
                    return clearInterval(this.blinkInterval)
                }
                    
                const caret = this.selectedNode.svgGroup.querySelector("#text-caret")
                if (!caret) return
                
                const opacity = caret.getAttribute("opacity") === "0" ? "1" : "0"
                caret.setAttribute("opacity", opacity)
                
            }, 500)
        }
        inputElement.focus()
    }
    
    
    private caretGetPositionFromSVGCoordinate(node: FlowchartNode, coordinate: { x: number, y: number }): number | undefined {
        const textEl = this.flowchart.chart.querySelector(`[id="${node.id}"] text`) as SVGTextElement | null
        if (!textEl) return undefined

        const tspanArray = Array.from(textEl.querySelectorAll("tspan"))
        let globalIndex = 0
        let extent = undefined as DOMRect | undefined

        if (coordinate.y < textEl.getBBox().y) {
            return 0
        }

        for (const tspan of tspanArray) {
            const tspanLength = tspan.textContent?.length ?? 0

            for (let i = 0; i < tspanLength; i++) {
                extent = textEl.getExtentOfChar(globalIndex)
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
        if (!extent) return undefined
        if ((coordinate.y > extent.y && coordinate.x > extent.x + extent.width) ||
            (coordinate.y > extent.y + extent.height)
        ) {
            return textEl.getNumberOfChars()
        }

        return undefined
    }

    private getWordAtIndex(string: string, index: number): { start: number, end: number } | undefined {
    // Splits op spatie of -
        const regex = /[^ -\.]+/g

        let match

        while ((match = regex.exec(string)) !== null) {
            const start = match.index
            const end = start + match[0].length 

            if (index >= start && index <= end) {
                return { start, end }
            }
        }

        return undefined
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

    private createSelectionEl(x: { start: number, end: number }, y: { start: number, end: number }) {
        if (!this.svgGroupBg) {
            throw new Error("SVG group not initialized")
        }
        const width = Math.abs(x.end - x.start) +""
        const height = Math.abs(y.end - y.start) + ""
        const selectionEl = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        selectionEl.setAttribute("fill", this.options.selectionColor)
        selectionEl.setAttribute("x", `${x.start}`)
        selectionEl.setAttribute("y", `${y.start}`)
        selectionEl.setAttribute("width", width)
        selectionEl.setAttribute("height", height)

        this.svgGroupBg.appendChild(selectionEl)
    }

    private updateSVGSelection() {
        if (!this.selectedNode) return
        
        const toolContainer = this.flowchart.chart.querySelector("[tool=\"edit-node-text-tool\"][background]") as SVGTextElement | null
        const textEl = this.flowchart.chart.querySelector(`[id="${this.selectedNode.id}"] text`) as SVGTextElement | null
        if (!textEl) return
        if (!toolContainer) return

        toolContainer.querySelectorAll("rect").forEach(rect => rect.remove()) // Clear previous selection rectangles

        const startPos = this.convertIndexToPos(this.selection.start)
        const endPos = this.convertIndexToPos(this.selection.end)

        if (this.selection.start === this.selection.end) return // No selection
        const tspanArray = textEl.querySelectorAll("tspan") as NodeListOf<SVGTSpanElement>
        tspanArray.forEach((tspan, i) => {
            if (!tspan) return
            const bbox = tspan.getBBox()
            let x = bbox.x
            const y = bbox.y
            let width = bbox.width
            const height = bbox.height
            if (
                y > startPos.y && this.selection.direction === "backward" ||
                y < endPos.y && this.selection.direction === "backward"
            ) {
                return // Not in selection range vertically
            }

            function startPosOnSameLine() {
                return y >= startPos.y && y <= startPos.y + height
            }

            function endPosOnSameLine() {
                return y >= endPos.y && y <= endPos.y + height
            }

            if (this.selection.direction === "forward") {
                if (y < startPos.y || y > endPos.y) {
                    return // Not in selection range vertically
                }

                if (startPosOnSameLine() && endPosOnSameLine()) {
                    // Selection starts and ends on this line
                    x = startPos.x
                    width = endPos.x - startPos.x
                } else if (startPosOnSameLine()) {
                    // This is the first line of the selection (start anchor)
                    x = startPos.x
                    width = bbox.x + bbox.width - startPos.x
                } else if (endPosOnSameLine()) {
                    // This is the last line of the selection (end anchor)
                    x = bbox.x
                    width = endPos.x - bbox.x
                } else {
                    // Middle line — full width
                    x = bbox.x
                    width = bbox.width
                }

            } else if (this.selection.direction === "backward") {
                if (endPosOnSameLine() && startPosOnSameLine()) {
                    // Selection starts and ends on this line
                    x = endPos.x
                    width = startPos.x - endPos.x
                } else if (endPosOnSameLine()) {
                    // This is the first line of the selection (end anchor)
                    x = endPos.x
                    width = bbox.x + bbox.width - endPos.x
                } else if (startPosOnSameLine()) {
                    // This is the last line of the selection (start anchor)
                    x = bbox.x
                    width = startPos.x - bbox.x
                } else {
                    // Middle line — full width
                    x = bbox.x
                    width = bbox.width
                }
            }
            
            this.createSelectionEl(
                { start: x, end: x + width },
                { start: y, end: y + bbox.height }
            )
        })
    }

    private updateSVGCaretPosition() {
        if (!this.selectedNode) return
        if (!this.caretEl) return

        const node = this.selectedNode
        const caret = this.convertIndexToPos()
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
        if (!this.inputElement) return
        this.inputElement.focus() 
        const event = fec.originalEvent as KeyboardEvent
        
        if (event.key === "Tab") {
            event.preventDefault()
            return
        }
        
        if ((event.key === "Enter" && !event.shiftKey) || event.key === "Escape") {
            this.deselectNode()
            return
        }

        if ((event.key === "ArrowLeft" && ( event.metaKey || event.ctrlKey)) || 
            (event.key === "ArrowRight" && ( event.metaKey || event.ctrlKey))){
            if (this.inputElement) {
                event.preventDefault()
            }
        }

        this.selection.start = this.inputElement.selectionStart as number
        this.selection.end = this.inputElement.selectionEnd as number

        this.updateSelection()
    }
    
    private onKeyUp = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        if (!this.inputElement) return
        if (!this.selectedNode) return
        this.inputElement.focus() 
        
        const event = fec.originalEvent as KeyboardEvent
        
        if (event.key === "Tab") {
            if (this.inputElement) {
                event.preventDefault()
                return
            }
        }

        if ((event.key === "ArrowLeft" && (event.shiftKey || event.metaKey)) || 
            (event.key === "ArrowRight" && (event.shiftKey || event.metaKey))){
            if (this.inputElement) {
                event.preventDefault()
            }
        }

        // if (typeof this.inputElement.selectionStart === "number") {
        //     this.selection.start = this.inputElement.selectionStart
        // }
        
        // if (typeof this.inputElement.selectionEnd === "number") {
        //     this.selection.end = this.inputElement.selectionEnd
        // }

        // First check if element is focused, if not, focus it (can happen when user clicks outside the window and back in)
        

        this.selection.start = this.inputElement.selectionStart as number
        this.selection.end = this.inputElement.selectionEnd as number

        this.updateSelection()
    }
    
    private onDoubleClick = (fec: FlowchartEventContext) => {  
        if (!this.state.active) return
        if (!this.selectedNode) return
        if (!this.inputElement) return
        const mouseEvent = fec.originalEvent as MouseEvent
        mouseEvent.preventDefault()  // prevent browser native word selection

        const v = this.getWordAtIndex(this.inputElement.value, this.selection.start)
        if (!v) return
        
        this.selection.start = v.start
        this.selection.end = v.end
        this.selection.direction = "forward"

        this.updateSelection()
    }

    private onMouseDown = (fec: FlowchartEventContext) => {  
        if (!this.state.active) return
        const mousePos = this.flowchart.events.mousePos
        const selectedNode = this.flowchart.nodes.find(node => node.shape.containsPoint(mousePos))
        
        if (this.selectedNode !== selectedNode && typeof selectedNode !== "undefined") {
            selectedNode.state.selected = false
            this.deselectNode()
        }
        
        if (!selectedNode) {
            this.blinkInterval = undefined
            this.deselectNode()
            return
        }
        
        // Clicked inside a node
        fec.stopPropagation()
        
        this.selectedNode = this.selectNode(selectedNode)

        if (this.inputElement) {
            this.inputElement.focus()
        }
        
        const caretPos = this.caretGetPositionFromSVGCoordinate(this.selectedNode, mousePos)
        if (typeof caretPos === "number") {
            this.selection.start = caretPos
            this.selection.end = caretPos
        }

        this.selection.direction = "none"

        this.updateInputSelection()
        window.requestAnimationFrame(() => {
            this.updateSelection()
        })
    }

    private onMouseMove = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        const e = fec.originalEvent as MouseEvent
        const mousePos = this.flowchart.events.mousePos
        const selectedNode = this.flowchart.nodes.find(node => node.shape.containsPoint(mousePos))
        this.state.mouseY = mousePos.y

        if (this.flowchart.events.mouseDown) {
            e.preventDefault()

            if (this.selectedNode) {
                const caretPos = this.caretGetPositionFromSVGCoordinate(this.selectedNode, mousePos)
                if (typeof caretPos === "number") {
                    this.selection.end = caretPos
                }
            }


            this.updateInputSelection()
            this.updateSelection()
        }

        if (selectedNode) {
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
    }
    
        
    private onNodeDeselected = (_node: FlowchartNode) => {
        if (!this.state.active) return
    }
}

export default EditNodeTextTool