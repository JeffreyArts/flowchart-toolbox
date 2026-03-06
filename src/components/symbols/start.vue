<template>
    <div class="symbol-start" :style="{ translate: `${pos.x} ${pos.y}`, opacity: visible ? '1' : '0' }">
        <div v-for="(line,i) in lines" :key="i">{{ line }}</div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
    name: "StartSymbol",
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
            width: 0,
            height: 0,
            visible: false,
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
            let res =  slot?.map(vnode => vnode.children).join("") ?? ""
            // replace all line break HTML snippets with actual line breaks
            res = res.replace(/<br\s*\/?>/gi, "\n")
            return res
        },
        lines(): string[] {
            return this.slotText.split("\n")
        },
    },
    watch: {
        slotText() {
            // Observe slot content changes via a computed
            
            this.updatePosition()
        },
    },
    mounted() {
        this.updatePosition()
    },
    methods: {
        updatePosition(first=true) {
            
            if (!this.$el) return
            
            const rect = this.$el.getBoundingClientRect()
            this.width = rect.width
            this.height = rect.height
            
            // Traverse back up to find .canvas element and set this.canvas.width and this.canvas.height
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
            } else if(this.x.includes("%")) {
                this.pos.x = this.canvas.width * parseFloat(this.x) / 100 - this.width / 2 + "px"
            } else {
                this.pos.x = this.x
            }
        },
        setPosY() {
            if (typeof this.y === "number") {
                this.pos.y = this.y + "px"
            } else if(this.y.includes("%")) {
                console.log("Canvas height:", this.canvas.height)
                this.pos.y = this.canvas.height * parseFloat(this.y) / 100 - this.height / 2 + "px"
            } else {
                this.pos.y = this.y
            }
        }
    },
})
</script>

<style lang="scss" scoped>

.symbol-start {
    position: absolute;
    border: 4px solid #ffccff;
    padding: 20px;
    box-sizing: border-box;
    text-align: center;
    border-radius: 50px;
    min-width: 5em;
}

</style>