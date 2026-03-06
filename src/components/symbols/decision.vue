<template>
    <div class="symbol-decision-wrapper" :style="{ translate: `${pos.x} ${pos.y}`, opacity: visible ? '1' : '0' }">
        <div class="symbol-decision" :style="diamondStyle">
            <div class="diamond-content" ref="content">
                <div v-for="(line, i) in lines" :key="i">{{ line }}</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
    name: "DecisionSymbol",
    components: {},
    props: {
        x: {
            type: [Number, String],
            required: true,
        },
        y: {
            type: [Number, String],
            required: true,
        },
    },
    data() {
        return {
            id: crypto.randomUUID(),
            width: 0,
            height: 0,
            visible: false,
            diamondSize: 160,
            canvas: {
                width: 0,
                height: 0,
            },
            pos: {
                x: "",
                y: "",
            },
        }
    },
    computed: {
        slotText(): string {
            const slot = this.$slots.default?.()
            let res = slot?.map(vnode => vnode.children).join("") ?? ""
            res = res.replace(/<br\s*\/?>/gi, "\n")
            return res
        },
        lines(): string[] {
            return this.slotText.split("\n")
        },
        diamondStyle(): { width: string; height: string }{
            return {
                width: `${this.diamondSize}px`,
                height: `${this.diamondSize}px`,
            }
        },
    },
    watch: {
        slotText() {
            this.updatePosition()
        },
    },
    mounted() {
        this.updatePosition()
    },
    methods: {
        updateDiamondSize() {
            return new Promise<void>(resolve => {
                if (!this.$el) return
                const content = this.$refs.content as HTMLElement
                if (!content) return
                const padding = 8
                const w = content.scrollWidth + padding
                const h = content.scrollHeight + padding
                this.diamondSize = Math.ceil(Math.sqrt(w * w + h * h))
                resolve()
            })
        },
        async updatePosition(first = true) {
            if (!this.$el) return

            await this.updateDiamondSize()

            const rect = this.$el.getBoundingClientRect()
            this.width = rect.width
            this.height = rect.height

            let parent = this.$el.parentElement
            while (parent) {
                if (parent.classList.contains("canvas")) {
                    this.canvas.width = parent.clientWidth
                    this.canvas.height = parent.clientHeight
                    break
                }
                parent = parent.parentElement
            }
            setTimeout(() => {
                if (first) {
                    this.updatePosition(false)
                    setTimeout(() => {
                        this.setPosX()
                        this.setPosY()
                    }, 0)
                    this.visible = true
                }

            }, 0)
        },
        setPosX() {
            if (typeof this.x === "number") {
                this.pos.x = this.x + "px"
            } else if (this.x.includes("%")) {
                this.pos.x = this.canvas.width * parseFloat(this.x) / 100 - this.width / 2 + "px"
            } else {
                this.pos.x = this.x
            }
        },
        setPosY() {
            if (typeof this.y === "number") {
                this.pos.y = this.y + "px"
            } else if (this.y.includes("%")) {
                this.pos.y = this.canvas.height * parseFloat(this.y) / 100 - this.height / 2 + "px"
            } else {
                this.pos.y = this.y
            }
        },
    },
})
</script>

<style lang="scss" scoped>

.symbol-decision-wrapper {
    position: absolute;
}

.symbol-decision {
    transform: rotate(45deg);
    border: 4px solid #fffa88;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
}

.diamond-content {
    transform: rotate(-45deg);
    text-align: center;
    padding:0px;
    white-space: nowrap;
    min-width: 5em;
}

</style>