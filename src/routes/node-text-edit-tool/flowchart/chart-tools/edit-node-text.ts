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
    startMouseCaretPos = undefined as number | undefined
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

        this.inputElement.setSelectionRange(this.selection.start, this.selection.end, this.selection.direction)
            
        // if (this.selection.direction == "backward") {
        //     this.inputElement.setSelectionRange(this.selection.end, this.selection.start)
        // } else if (this.selection.direction == "forward") {
        //     this.inputElement.setSelectionRange(this.selection.start, this.selection.end)
        // } else {
        //     this.inputElement.setSelectionRange(this.selection.start, this.selection.end)
        // }

        // this.inputElement.selectionDirection = this.selection.direction
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
            const firstIndexInRow = globalIndex

            for (let i = 0; i < tspanLength; i++) {
                extent = textEl.getExtentOfChar(globalIndex)
                const inRow = coordinate.y >= extent.y && coordinate.y <= extent.y + extent.height

                if (inRow) {
                    // X is voor het eerste karakter van de regel
                    if (i === 0 && coordinate.x < extent.x) {
                        return firstIndexInRow
                    }

                    // X is voorbij het laatste karakter van de regel
                    if (i === tspanLength - 1 && coordinate.x >= extent.x + extent.width / 2) {
                        return globalIndex 
                    }

                    if (coordinate.x < extent.x + extent.width / 2) {
                        return globalIndex
                    }
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


    private convertIndexToPos(index = undefined as number | undefined, yOffset = 0): { x: number, y: number } {
        const node = this.selectedNode
        if (!node) {
            throw new Error("No node selected")   
        }
        const textEl = this.flowchart.chart.querySelector(`[id="${node.id}"] text`) as SVGTextElement | null
        if (!textEl || node.text.length === 0) {
            return {
                x: node.x,
                y: node.y
            }
        }

        if (typeof index === "undefined") {
            if (this.selection.direction === "forward") {
                index = this.selection.end
            } else {
                index = this.selection.start
            }
        }

        const clampedIndex = Math.min(index, textEl.getNumberOfChars() - 1)
    
        if (index >= textEl.getNumberOfChars()) {
            // End of text: use end of last character
            const last = textEl.getExtentOfChar(clampedIndex)
            return { 
                x: last.x + last.width,
                y: last.y 
            }
        }

        // this.selection.start = index  // not clampedIndex
        const extent = textEl.getExtentOfChar(clampedIndex)

        return {
            x: extent.x,
            y: extent.y + yOffset * extent.height 
        }
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

        const toolContainer = this.flowchart.chart.querySelector("[tool=\"edit-node-text-tool\"][background]") as SVGGElement | null
        const textEl = this.flowchart.chart.querySelector(`[id="${this.selectedNode.id}"] text`) as SVGTextElement | null
        if (!textEl || !toolContainer) return

        toolContainer.querySelectorAll("rect").forEach(rect => rect.remove())

        if (this.selection.start === this.selection.end) return
        if (this.selection.direction === "none") return

        // Altijd visueel: links = min, rechts = max — ongeacht direction
        const visualStart = Math.min(this.selection.start, this.selection.end)
        const visualEnd   = Math.max(this.selection.start, this.selection.end)

        const startPos = this.convertIndexToPos(visualStart)
        const endPos   = this.convertIndexToPos(visualEnd)

        const tspanArray = Array.from(textEl.querySelectorAll("tspan")) as SVGTSpanElement[]

        for (const tspan of tspanArray) {
            const bbox   = tspan.getBBox()
            const lineY  = bbox.y
            const lineH  = bbox.height
            const lineX1 = bbox.x
            const lineX2 = bbox.x + bbox.width

            const lineStartY = lineY
            const lineEndY   = lineY + lineH

            // Valt deze regel volledig buiten de selectie?
            if (lineEndY <= startPos.y || lineStartY >= endPos.y + lineH) continue

            const onStartLine = lineY >= startPos.y && lineY < startPos.y + lineH
            const onEndLine   = lineY >= endPos.y   && lineY < endPos.y   + lineH

            let x: number
            let width: number

            if (onStartLine && onEndLine) {
            // Selectie begint én eindigt op deze regel
                x     = startPos.x
                width = endPos.x - startPos.x
            } else if (onStartLine) {
            // Eerste regel van de selectie
                x     = startPos.x
                width = lineX2 - startPos.x
            } else if (onEndLine) {
            // Laatste regel van de selectie
                x     = lineX1
                width = endPos.x - lineX1
            } else {
            // Middelste regel — volledige breedte
                x     = lineX1
                width = bbox.width
            }

            if (width <= 0) continue

            this.createSelectionEl(
                { start: x,     end: x + width },
                { start: lineY, end: lineY + lineH }
            )
        }
    }

    private updateSVGCaretPosition() {
        if (!this.selectedNode) return
        if (!this.caretEl) return

        const node = this.selectedNode
        const caret = this.convertIndexToPos()

        console.log("updateSVGCaretPosition",this.selection.direction, this.selection.start, this.selection.end, caret)
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

        const event = fec.originalEvent as KeyboardEvent
        const selectionDirection = this.inputElement.selectionDirection || "none"
        
        if (event.key === "Tab") {
            event.preventDefault()
            return
        }

        this.selection.direction = selectionDirection

        
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

        //
        // 1. Set focus to input element
        // 
        this.inputElement.focus() 

        //
        // 2. Update selection state
        // 

        if ((event.key === "ArrowUp") || (event.key === "ArrowDown")) {
            event.preventDefault()
            if (!this.selectedNode) return

            let focusPos = 0
            let anchor = 0

            //
            // UP KEY
            //
            if (event.key === "ArrowUp") {

                if (this.selection.direction === "forward") {
                    focusPos = this.selection.start
                    anchor = this.selection.end
                } else {
                    focusPos = this.selection.end  
                    anchor = this.selection.start    
                }

                const caretPos = this.caretGetPositionFromSVGCoordinate(this.selectedNode, this.convertIndexToPos(focusPos, -1))

                if (caretPos) {
                    if (!event.shiftKey) {
                        this.inputElement.selectionStart = caretPos
                        this.inputElement.selectionEnd = caretPos  // caret bij start (omhoog)
                        this.selection.direction = "none"
                    } else {
                        this.inputElement.selectionStart = Math.min(caretPos, anchor)
                        this.inputElement.selectionEnd = Math.max(caretPos, anchor)
                        this.selection.direction = caretPos < anchor ? "backward" : "forward"
                    }
                    console.log(caretPos < anchor, this.selection.direction)
                }

            } else {
                //
                // DOWN KEY
                //

                if (this.selection.direction === "backward") {
                    focusPos = this.selection.start  
                    anchor = this.selection.end      
                } else {
                    anchor = this.selection.start    
                    focusPos = this.selection.end
                }
                const pos = this.convertIndexToPos(focusPos, 2)
                let caretPos = this.caretGetPositionFromSVGCoordinate(this.selectedNode, pos)

                if (caretPos) {
                    // caretPos += 1
                    if (!event.shiftKey) {
                        this.inputElement.selectionEnd = caretPos
                        this.inputElement.selectionStart = caretPos  // caret bij end (omlaag)
                        this.selection.direction = "none"
                    } else {
                        this.inputElement.selectionStart = Math.min(caretPos, focusPos)
                        this.inputElement.selectionEnd = Math.max(caretPos, focusPos)
                        this.selection.direction = caretPos > focusPos ? "forward" : "backward"
                    }
                }
            }
        }

        
        window.requestAnimationFrame(() => {
            if (!this.inputElement) return
            this.selection.start = this.inputElement.selectionStart as number
            this.selection.end = this.inputElement.selectionEnd as number
            this.selection.direction = this.inputElement.selectionDirection || "none"
        
            //
            // 3. Update SVG selection
            //
            this.updateSVGSelection()
            this.updateSVGCaretPosition()
        })
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

        ///////////////////////////////////////////////////////////////////////
        //                                                                   //
        //   NO SELECTION UPDATE SINCE THAT IS ALREADY HANDLED IN KEYDOWN    //
        //                                                                   //
        ///////////////////////////////////////////////////////////////////////
    }
    
    private onDoubleClick = (fec: FlowchartEventContext) => {  
        if (!this.state.active) return
        if (!this.selectedNode) return
        if (!this.inputElement) return
        
        // Disable default double-click behavior (text selection)
        const mouseEvent = fec.originalEvent as MouseEvent
        mouseEvent.preventDefault()  // prevent browser native word selection
        
        // Escape method if there's no text at the clicked position
        const v = this.getWordAtIndex(this.inputElement.value, this.selection.start)
        if (!v) return
        
        //
        // 1. Set focus to input element
        //
        this.inputElement.focus()
        

        //
        // 2. Update selection state
        //
        window.requestAnimationFrame(() => {
            if (!this.inputElement) return

            this.selection.start = v.start
            this.selection.end = v.end
            this.selection.direction = "forward"
            
            // Update the actual selection input
            this.inputElement.setSelectionRange(this.selection.start, this.selection.end, this.selection.direction)
            
            //
            // 3. Update SVG selection
            //
            this.updateSVGSelection()
            this.updateSVGCaretPosition()
        })
    }

    private onMouseDown = (fec: FlowchartEventContext) => {  
        if (!this.state.active) return
        const mousePos = this.flowchart.events.mousePos
        
        const e = fec.originalEvent as MouseEvent
        e.preventDefault()
        
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

        
        //
        // 1. Set focus to input element
        //
        if (this.inputElement) {
            this.inputElement.focus()
        }
        

        //
        // 2. Update selection state
        //
        const caretPos = this.caretGetPositionFromSVGCoordinate(this.selectedNode, mousePos)
        if (typeof caretPos === "number") {
            if (e.shiftKey) {
                const anchor = this.selection.start  // start = anchor, unchanged
                if (caretPos < anchor) {
                    this.selection.start     = caretPos
                    this.selection.end       = anchor
                    this.selection.direction = "backward"
                } else if (caretPos > anchor) {
                    this.selection.start     = anchor
                    this.selection.end       = caretPos
                    this.selection.direction = "forward"
                } else {
                    this.selection.direction = "none"
                }
            } else {
                this.selection.start     = caretPos
                this.selection.end       = caretPos
                this.selection.direction = "none"
                this.startMouseCaretPos  = caretPos  // ← only reset anchor on plain click
            }
        }



        window.requestAnimationFrame(() => {
            // 
            // 3. Update the actual selection input
            //
            if (!this.inputElement) return
            this.inputElement.setSelectionRange(this.selection.start, this.selection.end, this.selection.direction)
            
            //
            // 4. Update SVG
            //
            window.requestAnimationFrame(() => {
                this.updateSVGSelection()
                this.updateSVGCaretPosition()
            })
        })
    }

    private onMouseMove = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        const e = fec.originalEvent as MouseEvent
        const mousePos = this.flowchart.events.mousePos
        const selectedNode = this.flowchart.nodes.find(node => node.shape.containsPoint(mousePos))
        this.state.mouseY = mousePos.y


        if (selectedNode) {
            fec.stopPropagation()
        }

        if (!this.flowchart.events.mouseDown)  return
        if (!this.selectedNode)  return

        e.preventDefault()

        
        //
        // 1. Set focus to input element
        //
        if (this.inputElement) {
            this.inputElement.focus()
        }
        

        //
        // 2. Update selection state
        //
        const caretPos = this.caretGetPositionFromSVGCoordinate(this.selectedNode, mousePos)
        if (typeof caretPos === "number" && typeof this.startMouseCaretPos === "number") {
            if (caretPos > this.startMouseCaretPos) {
                this.selection.start = this.startMouseCaretPos
                this.selection.end = caretPos
                this.selection.direction = "forward"
            } else if (caretPos < this.startMouseCaretPos) {
                // Omgewisseld: start = huidig (focus), end = anchor
                this.selection.start = caretPos
                this.selection.end = this.startMouseCaretPos
                this.selection.direction = "backward"
            } else {
                this.selection.start = caretPos
                this.selection.end = caretPos
                this.selection.direction = "none"
            }
        }

        window.requestAnimationFrame(() => {
            // 
            // 3. Update the actual selection input
            //
            if (!this.inputElement) return
            this.inputElement.setSelectionRange(this.selection.start, this.selection.end, this.selection.direction)
            
            //
            // 4. Update SVG
            //
            this.updateSVGSelection()
            this.updateSVGCaretPosition()
        })
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