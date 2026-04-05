<template>
    <div class="edge-variations">
        <header class="title">
            <h1>Edge variations</h1>
        </header>

        <hr>
        <section class="viewport">
            <div class="viewport-content" ratio="1x1" >
                <div id="edge-variations-canvas"> 

                </div>
            </div>
        </section>

        <aside class="sidebar">
            <div class="options">
                <div class="option-group" name="Options" >
                    <div class="option" v-if="selectedNode">
                        <label for="option-tool">Selected node</label>
                        <span>
                            <strong>ID:</strong>
                            {{ selectedNode.id }}<br>

                            <strong>Type:</strong>
                            {{ selectedNode.type }}<br>
                        </span>
                    </div>
                    <div class="option" v-if="selectedNode">
                        <label for="changeNode">Verander type node</label>
                        <select name="changeNode" id="" v-model="selectedNode.type" @change="changeSelectedNode">
                            <option value="start">Start</option>
                            <option value="end">End</option>
                            <option value="process">Process</option>
                            <option value="decision">Decision</option>
                        </select>
                    </div>
                    <div class="option" v-if="selectedNode">
                        <label for="node-text">Text</label>
                        <input type="text" id="node-text" v-model="selectedNode.text">
                    </div>
                
                    <span v-if="!selectedNode" style="font-style: italic; color: #666; font-size: .8em;">
                        No node selected <br><br>
                    </span>
                    <div class="option">
                        <label for="edgeType">Edge type</label>
                        <select name="edgeType" id="" v-model="options.edgeType" @change="changeEdgeType">
                            <option value="straight">Straight</option>
                            <option value="elbow">Elbow</option>
                            <option value="elbow-curve">Elbow Curve</option>
                            <option value="zigzag">Zigzag</option>
                            <option value="zigzag-curved">Zigzag Curved</option>
                            <option value="diagonal">Diagonal</option>
                            <option value="diagonal-curve">Diagonal Curve</option>
                            <option value="double-diagonal">Double Diagonal</option>
                            <option value="double-diagonal-curve">Double Diagonal Curve</option>
                            <option value="curved">Curved</option>
                            <option value="smart-elbow">Smart Elbow</option>
                            <option value="smart-elbow-curve">Smart Elbow Curve</option>
                            <option value="smart-diagonal">Smart Diagonal</option>
                            <option value="smart-diagonal-curve">Smart Diagonal Curve</option>
                        </select>
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
                <div class="option-group" name="Known bugs" >
                    <div class="option">
                       <h3>Required feature</h3>
                        <p>Max-width wijzigen on-the-fly (zeker voor de decision node)</p>
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
import type { EdgeType } from "./flowchart/edge"

interface Options {
    edgeType: EdgeType
}

export default defineComponent ({ 
    components: {},
    props: [],
    data() {
        return {
            options: {
                edgeType: "straight"
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
                this.flowchart = markRaw(new Flowchart("#edge-variations-canvas", { edgeType: this.options.edgeType }))
                const mainNode = new DecisionNode({ text: "Main node", flowchart: this.flowchart, x: "50%", y: "50%", segments: 0, class: "main-node" , maxWidth: 320 })
                const nodes = 3
                for (let i = 0; i < nodes; i++) {
                    const processNode = new ProcessNode({ text: `Node ${i+1}`, parent: mainNode, x: `${i * 100/nodes + 100/nodes/2}%`, y: "10%", maxWidth: 200 })
                }
                
                const selectTool = this.flowchart.getTool("select")
                if (selectTool && selectTool instanceof SelectTool) {
                    selectTool.onClick = (_e: MouseEvent) => {
                        this.selectedNode = undefined

                        this.flowchart?.nodes.forEach(node => {

                            if (node.mouseOver) {
                                if (node.svgGroup.classList.contains("__isSelected")) {
                                    node.svgGroup.classList.remove("__isSelected")    
                                    return
                                }
                                
                                this.selectedNode = markRaw(node)
                                node.svgGroup.classList.add("__isSelected")    
                            } else {
                                node.svgGroup.classList.remove("__isSelected")    
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
                    this.selectedNode.mouseOver = true
                    selectTool.onClick(new MouseEvent("click"))
                }
                // this.setMouseEvents(this.selectedNode)
            }
        },
        changeEdgeType() {
            if (!this.flowchart) return

            this.flowchart.options.edgeType = this.options.edgeType || "straight"
        },

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
.edge-variations { 
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
        transition-duration: .8s;
        transition-property: scale;
        transition-timing-function: linear(0, 0.002 0.5%, 0.008 1.1%, 0.019 1.7%, 0.034 2.3%, 0.052 2.9%, 0.073 3.5%, 0.102 4.2%, 0.134 4.9%, 0.191 6%, 0.264 7.3%, 0.556 12.1%, 0.683 14.3%, 0.742 15.4%, 0.797 16.5%, 0.848 17.6%, 0.89 18.6%, 0.932 19.7%, 0.967 20.7%, 0.997 21.7%, 1.027 22.8%, 1.052 23.9%, 1.073 25%, 1.09 26.1%, 1.104 27.3%, 1.117 28.9%, 1.123 30.6%, 1.124 32.4%, 1.119 34.3%, 1.112 35.9%, 1.101 37.7%, 1.043 45.5%, 1.018 49.5%, 1.007 51.7%, 0.998 54%, 0.992 56.3%, 0.988 58.6%, 0.985 61.7%, 0.985 65.2%, 1 84.5%, 1.002 91.4%, 1);
        // Make text unselectable
        -webkit-user-select: none; /* Safari */
        -ms-user-select: none; /* IE 10 and IE 11 */
        user-select: none; /* Standard syntax */

        &.__isSelected {
            scale: 1.2;
        }
        
        &.__isHover {
            outline: 4px solid #88ff88;
        }
    }

    .flowchart-shape {

        &.start-node {
            stroke: #ffccff;
            stroke-width: 4px;
            fill: #fff;
        }
        
        &.end-node {
            stroke: #444;
            stroke-width: 4px;
            fill: #fff;
        }

        &.process-node {
            stroke: #b2e0f9;
            stroke-width: 4px;
            fill: #fff;
        }

        &.decision-node {
            stroke: #fffa88;
            stroke-width: 4px;
            fill: #fff;
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