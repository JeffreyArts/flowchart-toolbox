import type Flowchart  from "../index"

export class FlowchartTool {
    name = "unknown-tool"
    mouseDown = false
    flowchart: Flowchart
    isWithinChart = false
    isActive = true
    mousePos = { x: 0, y: 0 }
    globalMousePos = { x: 0, y: 0 }
    touchStartDistance = 0
    touchStartPoints: { x: number; y: number }[] = []

    constructor(flowchart: Flowchart) {
        this.flowchart = flowchart

        if (this.flowchart.parentElement) {
            this.flowchart.parentElement.addEventListener("wheel", this.#onWheel, { passive: false })
        }
        document.addEventListener("mousedown", this.#onMouseDown)
        document.addEventListener("mousemove", this.#onMouseMove)
        document.addEventListener("mouseup", this.#onMouseUp)
        document.addEventListener("keydown", this.#onKeyDown)
        document.addEventListener("keyup", this.#onKeyUp)
        document.addEventListener("touchstart", this.#onTouchStart, { passive: false })
        document.addEventListener("touchmove", this.#onTouchMove, { passive: false })
        document.addEventListener("touchend", this.#onTouchEnd)
    }

    #setWithinChart = (e: MouseEvent) => {
        if (!this.flowchart?.parentElement) return false

        const rect = this.flowchart.parentElement.getBoundingClientRect()
        this.isWithinChart =  (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
        )
        return this.isWithinChart
    }

    #setMousePos = (e: MouseEvent) => {
        if (!this.flowchart?.chart) return

        const rect = this.flowchart.chart.getBoundingClientRect()

        const globalX = e.clientX - rect.left
        const globalY = e.clientY - rect.top
        this.globalMousePos = { x: globalX, y: globalY }


        const x = (e.clientX - rect.left - this.flowchart.pan.x) / this.flowchart.zoom
        const y = (e.clientY - rect.top  - this.flowchart.pan.y) / this.flowchart.zoom
        this.mousePos = { x, y }
    }

    #onMouseDown = (e: MouseEvent) => {
        if (!this.isActive) return
        this.#setMousePos(e)
        
        this.mouseDown = true

        if (this.onMouseDown) {
            this.onMouseDown(e)
        }
    }

    #onMouseMove = (e: MouseEvent) => {
        if (!this.isActive) return

        this.#setMousePos(e)
        this.#setWithinChart(e)
        
        if (this.onMouseMove) {
            this.onMouseMove(e)
        }
    }

    #onMouseUp = (e: MouseEvent) => {
        if (!this.isActive) return
        this.#setMousePos(e)

        // Get x / y relative to this.flowchart.chart element
        this.mouseDown = false
        
        if (this.onMouseUp) {
            this.onMouseUp(e)
        }
    }
    
    #onKeyDown = (e: KeyboardEvent) => {
        if (!this.isActive) return
        if (this.onKeyDown) {
            this.onKeyDown(e)
        }
    }

    #onKeyUp = (e: KeyboardEvent) => {
        if (!this.isActive) return
        if (this.onKeyUp) {
            this.onKeyUp(e)
        }
    }

    #onWheel = (e: WheelEvent) => {
        if (!this.isActive) return

        // Check if within chart bounds
        this.#setWithinChart(e)

        if (this.onWheel) {
            this.onWheel(e)
        }
    }
    #onTouchStart = (e: TouchEvent) => {
        if (!this.isActive) return
        if (e.touches.length < 2) return

        const t0 = e.touches.item(0)
        const t1 = e.touches.item(1)
        if (!t0 || !t1) return

        this.touchStartPoints = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }))

        if (e.touches.length === 2) {
            const dx = t0.clientX - t1.clientX
            const dy = t0.clientY - t1.clientY
            this.touchStartDistance = Math.hypot(dx, dy)
        }

        if (this.onTouchStart) {
            this.onTouchStart(e)
        }
    }

    #onTouchMove = (e: TouchEvent) => {
        if (!this.isActive) return
        if (e.touches.length < 2) return

        const t0 = e.touches.item(0)
        const t1 = e.touches.item(1)
        if (!t0 || !t1) return

        if (e.touches.length === 2) {
            const dx = t0.clientX - t1.clientX
            const dy = t0.clientY - t1.clientY
            const currentDistance = Math.hypot(dx, dy)

            if (this.onPinch) {
                this.onPinch(e, currentDistance / this.touchStartDistance)
            }
            const touchStartPoint1 = this.touchStartPoints[0]
            const touchStartPoint2 = this.touchStartPoints[1]
            if (!touchStartPoint1 || !touchStartPoint2) return

            const avgX = (t0.clientX + t1.clientX) / 2
            const avgY = (t0.clientY + t1.clientY) / 2
            const prevAvgX = (touchStartPoint1.x + touchStartPoint2.x) / 2
            const prevAvgY = (touchStartPoint1.y + touchStartPoint2.y) / 2

            if (this.onSwipe) {
                this.onSwipe(e, avgX - prevAvgX, avgY - prevAvgY)
            }

            this.touchStartDistance = currentDistance
            this.touchStartPoints = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }))
        }

        if (this.onTouchMove) {
            this.onTouchMove(e)
        }
    }

    #onTouchEnd = (e: TouchEvent) => {
        if (!this.isActive) return

        this.touchStartPoints = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }))

        if (this.onTouchEnd) {
            this.onTouchEnd(e)
        }
    }

    activate() {
        this.isActive = true
    }

    deactivate() {
        this.isActive = false
    }
    
    onMouseDown = (_e: MouseEvent) => {}
    onMouseUp = (_e: MouseEvent) => {}
    onMouseMove = (_e: MouseEvent) => {}
    onKeyDown = (_e: KeyboardEvent) => {}
    onKeyUp = (_e: KeyboardEvent) => {}
    onTouchStart = (_e: TouchEvent) => {}
    onTouchMove = (_e: TouchEvent) => {}
    onTouchEnd = (_e: TouchEvent) => {}
    onPinch = (_e: TouchEvent, _scale: number) => {}
    onSwipe = (_e: TouchEvent, _deltaX: number, _deltaY: number) => {}
    onWheel = (_e: WheelEvent) => {}

    destroy() {
        document.removeEventListener("mousedown", this.#onMouseDown)
        document.removeEventListener("mousemove", this.#onMouseMove)
        document.removeEventListener("mouseup", this.#onMouseUp)
        document.removeEventListener("wheel", this.#onWheel)
        document.removeEventListener("keydown", this.#onKeyDown)
        document.removeEventListener("keyup", this.#onKeyUp)
        document.removeEventListener("touchstart", this.#onTouchStart)
        document.removeEventListener("touchmove", this.#onTouchMove)
        document.removeEventListener("touchend", this.#onTouchEnd)
    }
}

export default FlowchartTool