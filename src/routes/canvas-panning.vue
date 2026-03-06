<template>
    <div class="canvas-panning">
        <header class="title">
            <h1>Canvas panning</h1>
        </header>

        <hr>
        <section class="viewport">
            <div class="viewport-content" ratio="1x1" >
                <div id="canvas-panning"> 

                </div>
            </div>
        </section>

        <aside class="sidebar">
            <div class="options">
                <div class="option-group" name="Options" >
                    <div class="option">
                        <label for="options-text">Text</label>
                        <textarea id="options-text" v-model="options.text" @input="updateText()"></textarea>
                    </div>
                    <form class="option" @submit="resetPan">
                        <label for="options-resetPan">Reset pan</label>
                        <button class="button" id="options-resetPan">Reset</button>
                    </form>

                    <form class="option" @submit="resetOptions">
                        <label for="options-reset">Reset options</label>
                        <button class="button" id="options-reset">Reset</button>
                    </form>
                </div>
            </div>
        </aside>
    </div>
</template>


<script lang="ts">
import { defineComponent, markRaw } from "vue"
import _ from "lodash"
import gsap from "gsap"
import { Flowchart } from "../flowchart"
import { StartNode } from "../flowchart/start"

interface Options {
    text: string
}

export default defineComponent ({ 
    components: {},
    props: [],
    data() {
        return {
            options: {
                text: "asdf",
            } as Partial<Options>,
            startNode: undefined as StartNode | undefined,
            flowchart: undefined as Flowchart | undefined,
            ignoreOptionsUpdate: true,
        }
    },
    watch: {
        "options": {
            handler(){
                if (this.ignoreOptionsUpdate) {
                    return
                }
                
                let newOptions = {} as any
                const localStorageOptions = localStorage.getItem("options")
                if (localStorageOptions) {
                    newOptions = _.cloneDeep(JSON.parse(localStorageOptions))
                }
                _.forOwn(this.options, (value, key) => {
                    if (_.isArray(value)) {
                        // If the value is an array, copy it directly
                        newOptions[key] = [...value]
                    } else if (_.isObject(value)) {
                        if (!_.isObject(newOptions[key])) {
                            newOptions[key] = {}
                        }
                        // Recursively copy the object properties
                        _.forOwn(value, (v, k) => {
                            newOptions[key][k] = v
                        })
                    } else {
                        newOptions[key] = value
                    }
                })
                localStorage.setItem("options", JSON.stringify(newOptions))
            },
            deep: true
        },
    },
    mounted() {

        if (this.$el) {
            setTimeout(() => {
                this.flowchart = markRaw(new Flowchart("#canvas-panning"))
                this.startNode = this.flowchart.add("start", this.options.text)
            })
        }
        this.loadOptions()
    },
    unmounted() {
        //
    },
    methods: {
        updateText() {
            if (this.startNode) {
                this.startNode.text = this.options.text || ""
            }
        },
        resetPan(e:Event) {
            e.preventDefault()
            if (this.flowchart) {
                gsap.to(this.flowchart.pan, { x: 0, y: 0, duration: 0.5 })
            }
        },
        loadOptions() {
            this.ignoreOptionsUpdate = true
            const optionsString = localStorage.getItem("options")
            if (optionsString) {
                const localOptions = JSON.parse(optionsString)
                _.forOwn(this.options, (value,key) => {
                    const typedKey = key as keyof Options
                    if (localOptions[typedKey]) {
                        this.options[typedKey] = localOptions[key]
                    }
                })
            }
            setTimeout(() => {
                this.ignoreOptionsUpdate = false
            })
        },
        resetOptions(e:Event) {
            e.preventDefault()
            this.options = {
                text: "",
            }
        },
    }
})
</script>


<style lang="scss">

.flowchart {
    color: #333;
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.flowchart-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.flowchart-node {
    position: absolute;
    border: 4px solid transparent;
    box-sizing: border-box;
    text-align: center;
    min-width: 5em;

    &.start-node {
        border: 4px solid #ffccff;
        padding: 20px;
        border-radius: 50px;
    }
}
</style>