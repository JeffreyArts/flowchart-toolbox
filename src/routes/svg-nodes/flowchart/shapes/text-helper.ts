class TextHelper {
    private parentEl: HTMLDivElement
    private el: HTMLDivElement
    private leftEl = undefined as  HTMLDivElement | undefined
    private rightEl = undefined as  HTMLDivElement | undefined
    private text: string = ""

    constructor(text: string = "", shape: string, styles?: Partial<CSSStyleDeclaration>) {
        
        this.text = text
        this.parentEl = document.createElement("div")
        this.el = document.createElement("div")
        
        if (shape === "diamond") {
            this.parentEl.style.aspectRatio = "1"
            const leftEl = document.createElement("div")
            const rightEl = document.createElement("div")

            
            leftEl.style.width = "50%"
            leftEl.style.float = "left"
            leftEl.style.height = "100%"
            rightEl.style.display = "none"
            leftEl.style.shapeOutside = "polygon(0 0, 100% 0, 0 50%, 100% 100%, 0 100%)"
            
            rightEl.classList.add("right")
            rightEl.style.width = "50%"
            rightEl.style.height = "100%"
            rightEl.style.float = "right"
            rightEl.style.display = "none"
            rightEl.style.shapeOutside = "polygon(100% 0, 100% 100%, 0 100%, 100% 50%, 0 0)"

            this.parentEl.appendChild(leftEl)
            this.parentEl.appendChild(rightEl)

            this.leftEl = leftEl
            this.rightEl = rightEl

        }

        // Plaats de helper off-screen en onzichtbaar zodat het geen invloed heeft op de layout
        Object.assign(this.parentEl.style, {
            position: "fixed",
            // pointerEvents: "none",
            // visibility: "hidden",
            // right: "-100vw",
            // bottom: "-100vh",
            right: "0vw",
            bottom: "0vh",
            // whiteSpace: "pre-wrap",
            // wordWrap: "break-word"
        })

        // Voeg overige styling toe
        Object.assign(this.parentEl.style, styles)
        this.parentEl.appendChild(this.el)

        document.body.appendChild(this.parentEl)
    }

    get lines() {
        const lines = []
        const range = document.createRange()
        range.selectNodeContents(this.el)
        

        
        const rects = range.getClientRects()
        // console.log("range", range)
        // return rects.length
        let startOffset = 0
        let prevY = 0
        for (let i = 0; i < rects.length; i++) {
            
            // DOMRange API om substring te vinden
            // Hier gebruiken we een kleine heuristiek: selecteer steeds 1 karakter vooruit tot rect verandert
            let line = ""
            for (let j = startOffset; j < this.text.length; j++) {
                range.setStart(this.el.firstChild!, startOffset)
                range.setEnd(this.el.firstChild!, j + 1)
                const r = range.getClientRects()
                // console.log(r)
                if (r[0]) {

                    // console.log("Check line", r[0], this.text[j])
                }
                
                if (r.length > 1) break // nieuwe visual line
                line += this.text[j]
            }

            startOffset += line.length
            lines.push(line)
        }
    
        return lines
    }

    measure(): { width: number, height: number, lines: string[],  lineHeight: number } {
        
        if (!this.text.length) return { width: 0, height: 0, lines: [], lineHeight: 0 }
        this.el.textContent = this.text

        
        const rectParent = this.parentEl.getBoundingClientRect()
        const rectText = this.el.getBoundingClientRect()
        
        
        const rectParentHeight = rectParent.height //- parseFloat(this.parentEl.style.paddingTop) - parseFloat(this.parentEl.style.paddingBottom)
        if (this.leftEl) {
            this.leftEl.style.height = rectParentHeight + "px"
        }
        if (this.rightEl) {
            this.rightEl.style.height = rectParentHeight + "px"
        }
        
        this.el.style.paddingTop = (rectParent.height - rectText.height) / 2  + "px"

        const computedStyle = getComputedStyle(this.parentEl)
        const paddingTop = parseFloat(computedStyle.paddingTop || "0")
        const paddingBottom = parseFloat(computedStyle.paddingBottom || "0")
        
        const cleanHeight = this.parentEl.getBoundingClientRect().height - paddingTop - paddingBottom
        console.log(rectParentHeight , ">", cleanHeight , paddingTop , paddingBottom)
        if (Math.floor(rectParentHeight) < Math.floor(cleanHeight) && rectParentHeight < 300) {
            return this.measure() 
        }
        
        const lineHeight = parseFloat(getComputedStyle(this.parentEl).lineHeight || "16px")
        
        return {
            width: rectParent.width,
            height: rectParent.height,
            lines: this.lines, 
            lineHeight
        }
    }

    destroy() {
        this.el.remove()
        this.parentEl.remove()
    }
}

export { TextHelper }
export default TextHelper