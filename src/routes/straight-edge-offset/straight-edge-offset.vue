<template>
    <div class="straight-edge-offset">
        <header class="title">
            <h1>Straight Edge Offset</h1>
        </header>

        <hr>
        <section class="viewport">
            <div class="viewport-content" ratio="1x1" >
                <div id="straight-edge-offset-canvas"> 

                </div>
            </div>
        </section>

        <aside class="sidebar">
            <div class="options">
                <div class="option-group" name="Options" >
                    <div class="option">
                        <label for="option-tool">Selected node</label>
                        <span v-if="selectedNode">
                            <strong>ID:</strong>
                            {{ selectedNode.id }} <br><br>
                            <strong>Type:</strong>
                            {{ selectedNode.type }}<br>
                            <select name="changeNode" id="" v-model="selectedNode.type" @change="changeSelectedNode">
                                <option value="start">Start</option>
                                <option value="end">End</option>
                                <option value="process">Process</option>
                                <option value="decision">Decision</option>
                            </select>
                        </span>
                        <span v-if="!selectedNode" style="font-style: italic; color: #666; font-size: .8em;">
                            No node selected
                        </span>
                    </div>

                </div>


                <div class="option-group" name="Actions" >
                    <div class="option">
                        <label for="options-resetPan">Reset zoom/pan</label>
                        <div class="row">
                            <button class="button" id="options-resetBoth" @click="resetZoom($event); resetPan($event)">Reset</button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    </div>
</template>


<script lang="ts">
//@ts-nocheck
import { defineComponent, markRaw } from "vue"
import _ from "lodash"
import gsap from "gsap"
import { Flowchart } from "./flowchart"
import { StartNode } from "./flowchart/nodes/start"
import { EndNode } from "./flowchart/nodes/end"
import { DecisionNode } from "./flowchart/nodes/decision"
import { ProcessNode } from "./flowchart/nodes/process"
import type { FlowchartNodeOptions } from "./flowchart/nodes"
import SelectTool from "./flowchart/chart-tools/select"
import type { FlowchartNode } from "./flowchart/types"

interface Options {
    none: undefined
}

export default defineComponent ({ 
    components: {},
    props: [],
    data() {
        return {
            options: {
                none: undefined
            } as Partial<Options>,
            nodes: [] as Array<FlowchartNode>,
            flowchart: undefined as Flowchart | undefined,
            selectedNode: undefined as FlowchartNode | undefined,
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
        if (this.$el && !this.flowchart) {
            setTimeout(() => {
                this.flowchart = markRaw(new Flowchart("#straight-edge-offset-canvas"))
                const mainNode = new StartNode({ text: "Node 1", flowchart: this.flowchart, x: "50%", y: "50%" })
                for (let i = 0; i < 5; i++) {
                    const processNode = new ProcessNode({ text: `Node ${i+1}`, parent: mainNode, x: `${i * 20 + 10}%`, y: "10%" })
                }
                
                const selectTool = this.flowchart.getTool("select")
                if (selectTool && selectTool instanceof SelectTool) {
                    selectTool.onClick = (_e: MouseEvent) => {
                        this.selectedNode = undefined

                        this.flowchart?.nodes.forEach(node => {
                            if (!node.el) return
                            if (node.isHover) {
                                if (node.el.classList.contains("__isSelected")) {
                                    node.el.classList.remove("__isSelected")    
                                    return
                                }
                                
                                this.selectedNode = node    
                                node.el.classList.add("__isSelected")    
                            } else {
                                node.el.classList.remove("__isSelected")    
                            }
                        })
                    }
                }
            })
        }

        this.loadOptions()
    },
    unmounted() {
        this.flowchart?.destroy()
    },
    methods: {
        changeSelectedNode() {
            if (!this.selectedNode) return
            if (!this.flowchart) return


            let target = {
                text: this.selectedNode.text,
                x: this.selectedNode.x,
                y: this.selectedNode.y,
                flowchart: this.flowchart 
            } as Partial<FlowchartNodeOptions>
            
            
            let newNode: FlowchartNode | undefined

            if (this.selectedNode.type == "start") {
                newNode = new StartNode(target)
            } else if (this.selectedNode.type == "process") {
                newNode = new ProcessNode(target)
            } else if (this.selectedNode.type == "end") {
                newNode = new EndNode(target)
            } else if (this.selectedNode.type == "decision") {
                newNode = new DecisionNode(target)
            }

            if (this.selectedNode) {
                // this.selectedNode.x = target.x
                this.flowchart.replaceNode(this.selectedNode, newNode)
                const selectTool = this.flowchart.getTool("select")

                if (selectTool instanceof SelectTool && selectTool.onClick) {
                    this.selectedNode.isHover = true
                    selectTool.onClick(new MouseEvent("click"))
                }
                // this.setMouseEvents(this.selectedNode)
            }

        },
        // setMouseEvents(node: StartNode | ProcessNode | EndNode | DecisionNode) {
        //     node.onMouseEnter = () => {
        //         const el = node.el
        //         if (el) {
        //             // el.style.outline = "4px solid red"  
        //         }
        //     }    
        //     node.onMouseLeave = () => {
        //         const el = node.el
        //         if (el) {
        //             // el.style.outline = ""  
        //         }
        //     }    
        // },
        resetPan(e:Event) {
            e.preventDefault()
            if (this.flowchart) {
                gsap.to(this.flowchart.pan, { x: 0, y: 0, duration: 0.5 })
            }
        },
        resetZoom(e:Event) {
            e.preventDefault()
            if (this.flowchart) {
                gsap.to(this.flowchart, { zoom: 1, duration: 0.5 })
            }
        },
        loadOptions() {
            this.ignoreOptionsUpdate = true
            const optionsString = localStorage.getItem("options")
            if (optionsString) {
                const localOptions = JSON.parse(optionsString)
                _.forOwn(this.options, (_value,key) => {
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
            }
        },
    }
})
</script>


<style lang="scss">
.straight-edge-offset { 
    .flowchart {
        color: #333;
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .flowchart-chart {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        outline: 10px solid orange;
        foreignObject {
            pointer-events: none;
            overflow: visible;
        }
    }

    .flowchart-node {
        border: 4px solid transparent;
        box-sizing: border-box;
        text-align: center;
        display: inline-block;
        min-width: 5em;
        background-color: #fff;
        transition-duration: .8s;
        transition-property: scale, box-shadow;
        transition-timing-function: linear(0, 0.002 0.5%, 0.008 1.1%, 0.019 1.7%, 0.034 2.3%, 0.052 2.9%, 0.073 3.5%, 0.102 4.2%, 0.134 4.9%, 0.191 6%, 0.264 7.3%, 0.556 12.1%, 0.683 14.3%, 0.742 15.4%, 0.797 16.5%, 0.848 17.6%, 0.89 18.6%, 0.932 19.7%, 0.967 20.7%, 0.997 21.7%, 1.027 22.8%, 1.052 23.9%, 1.073 25%, 1.09 26.1%, 1.104 27.3%, 1.117 28.9%, 1.123 30.6%, 1.124 32.4%, 1.119 34.3%, 1.112 35.9%, 1.101 37.7%, 1.043 45.5%, 1.018 49.5%, 1.007 51.7%, 0.998 54%, 0.992 56.3%, 0.988 58.6%, 0.985 61.7%, 0.985 65.2%, 1 84.5%, 1.002 91.4%, 1);

        // Make text unselectable
        -webkit-user-select: none; /* Safari */
        -ms-user-select: none; /* IE 10 and IE 11 */
        user-select: none; /* Standard syntax */

        &.start-node {
            border: 4px solid #ffccff;
            padding: 20px;
            border-radius: 50px;
            &.__isSelected {
                scale: 1.2;
                box-shadow: 0 3px 8px rgba(0, 0, 0, .1);
            }
        }
        
        &.end-node {
            border: 4px solid #444;
            padding: 20px;
            border-radius: 50px;
            &.__isSelected {
                scale: 1.2;
                box-shadow: 0 3px 8px rgba(0, 0, 0, .1);
            }
        }

        &.process-node {
            border: 4px solid #b2e0f9;
            padding: 20px;
            &.__isSelected {
                scale: 1.2;
                box-shadow: 0 3px 8px rgba(0, 0, 0, .1);
            }
        }
        &.decision-node {
            padding: 20px;
            
            &:before {
                content: "";
                transform: translate(-50%, -50%) rotate(45deg);
                border: 4px solid #fffa88;
                display: flex;
                align-items: center;
                justify-content: center;
                position: absolute;
                width: calc(100% - 20px);
                aspect-ratio: 1;
                top: 50%;
                left: 50%;
            }

            &.__isSelected {
                scale: 1.2;
                &:before {
                    box-shadow: 0 3px 8px rgba(0, 0, 0, .1);
                }
            }
        }
    }

    .flowchart-edge {
        stroke: #333;
        stroke-width: 2px;
        position: relative;
        z-index: -1;
    }
}
</style>