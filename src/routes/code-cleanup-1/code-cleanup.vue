<template>
    <div class="code-cleanup" @click="updateSelectedNodes" @mousemove="updateSelectedNodes">
        <header class="title">
            <h1>Code cleanup</h1>
        </header>

        <hr>
        <section class="viewport">
            <div class="viewport-content" ratio="1x1" >
                <div id="segments-canvas"> 

                </div>
            </div>
        </section>

        <aside class="sidebar">
            <div class="options">
                <div class="option-group" name="Selected node(s)" >
                    <div v-for="selectedNode in selectedNodes" :key="selectedNode.id">
                        <div class="option">
                            <span>
                                <strong>ID:</strong>
                                {{ selectedNode.id }}<br>

                                <strong>Type:</strong>
                                {{ selectedNode.type }}<br>
                            </span>
                        </div>
                        
                        <div class="option" v-if="selectedNode">
                            <div class="two">
                                <div>
                                    <label for="options-node-visible">Node Visible</label>
                                    <span>
                                        <input type="radio" :id="`${selectedNode.id}-node-visible-v0`" :value="false" v-model="selectedNode.state.visible" @change="updateSelectedNodes">
                                        <label :for="`${selectedNode.id}-node-visible-v0`"> false </label>
                                    </span>

                                    <span>
                                        <input type="radio" :id="`${selectedNode.id}-node-visible-v1`" :value="true" v-model="selectedNode.state.visible" @change="updateSelectedNodes">
                                        <label :for="`${selectedNode.id}-node-visible-v1`"> true </label>
                                    </span>
                                </div>
                                <div>
                                    <label for="options-node-selected">Node Selected</label>
                                    <span>
                                        <input type="radio" :id="`${selectedNode.id}-node-selected-v0`" :value="false" v-model="selectedNode.state.selected" @change="updateSelectedNodes">
                                        <label :for="`${selectedNode.id}-node-selected-v0`"> false </label>
                                    </span>

                                    <span>
                                        <input type="radio" :id="`${selectedNode.id}-node-selected-v1`" :value="true" v-model="selectedNode.state.selected" @change="updateSelectedNodes">
                                        <label :for="`${selectedNode.id}-node-selected-v1`"> true </label>
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="option" v-if="selectedNode">
                            <label for="node-text">Text</label>
                            <input type="text" id="node-text" v-model="selectedNode.text">
                        </div>
                    </div>
                
                    <span v-if="selectedNodes.length <= 0" style="font-style: italic; color: #666; font-size: .8em;">
                        No node selected <br><br>
                    </span>
                </div>


                <div class="option-group" name="Node options" >
                    <div class="option" v-if="flowchart">
                        <label for="options-segments">Segments <i class="info"><span class="info-icon">?</span><span class="info-details">0 = none</span></i></label>
                        <input min="0" max="360" type="number" id="options-segments" v-model="options.segments" @change="updateNodeSegments">
                    </div>

                    <div class="option" v-if="flowchart">
                        <label for="options-nodeMaxWidth">Max Width</label>
                        <input min="100" max="1000" step="1" type="range" id="options-nodeMaxWidth" v-model="options.nodeMaxWidth" @input="updateNodeMaxWidth">
                        <input type="number"  min="100" max="1000" v-model="options.nodeMaxWidth" @change="updateNodeMaxWidth">
                    </div>

                    <div class="option" v-if="flowchart">
                        <label for="options-nodeOffsetPadding">Offset Padding</label>
                        <input min="0" max="48" step="1" type="range" id="options-nodeOffsetPadding" v-model="options.nodeOffsetPadding" @input="updateOffsetPadding">
                        <input type="number"  min="0" max="48" v-model="options.nodeOffsetPadding" @change="updateOffsetPadding">
                    </div>
                </div>


                <div class="option-group" name="Edge options" >
                    
                    <div class="option">
                        <label for="edgeType">Edge type</label>
                        <select name="edgeType" id="" v-model="options.edgeType" @change="changeEdgeType">
                            <option value="straight">Straight</option>
                            <option value="elbow">Elbow</option>
                            <option value="zigzag">Zigzag</option>
                            <option value="diagonal">Diagonal</option>
                            <option value="double-diagonal">Double Diagonal</option>
                        </select>
                    </div>

                    <div class="option" v-if="flowchart">
                        <label for="options-curvatureStrength">Curvature Strength <i class="info"><span class="info-icon">?</span><span class="info-details">0 = none, 1 = maximum</span></i></label>
                        <input min="0" max="1" step="0.01" type="range" id="options-curvatureStrength" v-model="options.curvatureStrength" @input="updateEdgeCurvature">
                        <input type="number"  min="0" max="1" v-model="options.curvatureStrength" @change="updateEdgeCurvature">
                    </div>
                    
                    <div class="option" v-if="flowchart && ['zigzag', 'straight'].includes(options.edgeType)" >
                        <label for="options-midpoint">Midpoint <i class="info"><span class="info-icon">?</span><span class="info-details">0 = none, 1 = maximum</span></i></label>
                        <input min="0" max="1" step="0.01" type="range" id="options-midpoint" v-model="options.midpoint" @input="updateEdgeMidpoint">
                        <input type="number"  min="0" max="1" v-model="options.midpoint" @change="updateEdgeMidpoint">
                    </div>

                    <div class="option" v-if="flowchart">
                        <label for="options-edge-visible">Edge visible</label>
                        <span>
                            <input type="radio" id="options-edge-visible-v0" :value="false" v-model="options.edgeVisible" @change="changeEdgeVisibility">
                            <label for="options-edge-visible-v0"> false </label>
                        </span>

                        <span>
                            <input type="radio" id="options-edge-visible-v1" :value="true" v-model="options.edgeVisible" @change="changeEdgeVisibility">
                            <label for="options-edge-visible-v1"> true </label>
                        </span>
                    </div>

                    <div class="option" v-if="flowchart">
                        <label for="options-edge-show-arrow">Show arrow</label>
                        <span>
                            <input type="radio" id="options-edge-show-arrow-v0" :value="false" v-model="options.edgeShowArrow" @change="changeEdgeShowArrow">
                            <label for="options-edge-show-arrow-v0"> false </label>
                        </span>

                        <span>
                            <input type="radio" id="options-edge-show-arrow-v1" :value="true" v-model="options.edgeShowArrow" @change="changeEdgeShowArrow">
                            <label for="options-edge-show-arrow-v1"> true </label>
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
import _, { update } from "lodash"
import gsap from "gsap"
import Joffa from "./flowchart/joffa"
import { FlowchartNode, type FlowchartNodeOptions } from "./flowchart/nodes"
import { type EdgeType } from "./flowchart/edge"
import SelectTool from "./flowchart/chart-tools/select"

interface Options {
    segments: number
    curvatureStrength: number
    midpoint: number
    edgeType: EdgeType
    edgeVisible: boolean
    edgeShowArrow: boolean
    nodeMaxWidth: number
    nodeOffsetPadding: number
}

export default defineComponent ({ 
    components: {},
    props: [],
    data() {
        return {
            options: {
                edgeType: "straight",
                segments: 0,
                curvatureStrength: 0.5,
                midpoint: 0.5,
                edgeVisible: true,
                edgeShowArrow: true,
                nodeMaxWidth: 200,
                nodeOffsetPadding: 8,
            } as Partial<Options>,
            nodes: [] as Array<FlowchartNode>,
            flowchart: undefined as Flowchart | undefined,
            ignoreOptionsUpdate: true,
            selectedNodes: [] as Array<FlowchartNode>,
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
            // Timeout is for giving some time for processing this.options
            setTimeout(() => {
                const flowchartOptions = {
                    edges: { 
                        type: this.options.edgeType,
                        curvatureStrength: this.options.curvatureStrength,
                        midpoint: this.options.midpoint ,
                        isVisible: this.options.edgeVisible,
                        showArrow: this.options.edgeShowArrow,
                    },
                    nodes: {
                        segments: this.options.segments,
                        maxWidth: this.options.nodeMaxWidth,
                        offsetPadding: this.options.nodeOffsetPadding,
                        class: ["flowchart-node"],
                        shape: { 
                            style: { fill:"rgba(255, 255, 255, 0.2)" }
                        },
                        text: {
                            style: {
                                fontSize: "24px",
                                fontFamily: "FixedSys"
                            }
                        },
                        events: [
                            { name: "show", handler: (node) => { gsap.to(node.svgGroup.style, { opacity: 1, delay: Math.random() })} }
                        ]
                    }
                }

                this.flowchart = markRaw(new Joffa("#segments-canvas", flowchartOptions))
                let names = ["Edges", "Nodes", "Tools"]
                let nodeWidth = 200
                let nodes = []
                const startNode = new FlowchartNode("start", {
                    text: "Start",
                    flowchart: this.flowchart,
                    x: (nodeWidth*names.length) /2 - nodeWidth/2 ,
                    y: "50",
                    options: { maxWidth: 480 }
                })

                const zoomTool = this.flowchart.getTool("zoom")
                setTimeout(() => {
                    zoomTool.fit()
                })
            })
        }

        this.loadOptions()
    },
    unmounted() {
        this.flowchart?.destroy()
    },
    methods: {
        changeSelectedNode(selectedNode: FlowchartNode) {
            if (!selectedNode) return
            if (!this.flowchart) return


            let target = {
                text: selectedNode.text,
                x: selectedNode.x,
                y: selectedNode.y,
                flowchart: this.flowchart,
                options: selectedNode.options
            } as Partial<FlowchartNodeOptions>
            
            
            let newNode: FlowchartNode | undefined

            const registeredNode = this.flowchart.registered.nodes.find(node => node.type === selectedNode.type)
            if (!registeredNode) {
                throw new Error(`Node no longer registered with flowchart: ${selectedNode.type}`)
            }
            
            newNode = new FlowchartNode(registeredNode.type, target)


            if (selectedNode) {
                // this.selectedNode.x = target.x
                this.flowchart.replaceNode(selectedNode, newNode)
                const selectTool = this.flowchart.getTool("select")

                if (selectTool instanceof SelectTool && selectTool.onClick) {
                    selectedNode.state.mouseOver = true
                    selectTool.onClick(new MouseEvent("click"))
                }
                // this.setMouseEvents(this.selectedNode)
            }
        },
        updateNodeSegments() {
            if (!this.flowchart) return
            this.flowchart.options.nodes.segments = this.options.segments
        },
        updateEdgeCurvature() {
            if (!this.flowchart) return
            this.flowchart.options.edges.curvatureStrength = this.options.curvatureStrength
        },
        updateEdgeMidpoint() {
            if (!this.flowchart) return
            this.flowchart.options.edges.midpoint = this.options.midpoint
        },
        changeEdgeType() {
            if (!this.flowchart) return

            this.flowchart.options.edges.type = this.options.edgeType || "straight"
        },
        changeEdgeVisibility() {
            if (!this.flowchart) return
            this.flowchart.options.edges.isVisible = this.options.edgeVisible
        },
        changeEdgeShowArrow() {
            if (!this.flowchart) return
            this.flowchart.options.edges.showArrow = this.options.edgeShowArrow
        },
        updateNodeMaxWidth() {
            if (!this.flowchart) return
            this.flowchart.options.nodes.maxWidth = this.options.nodeMaxWidth
        },
        updateOffsetPadding() {
            if (!this.flowchart) return
            this.flowchart.options.nodes.offsetPadding = this.options.nodeOffsetPadding
        },

        resetPan(e:Event) {
            e.preventDefault()
            if (this.flowchart) {
                // gsap.to(this.flowchart.pan, { x: 0, y: 0, duration: 0.5 })
            }
        },
        resetZoom(e:Event) {
            e.preventDefault()
            if (this.flowchart) {
                const zoom = this.flowchart.getTool("zoom")
                zoom.fit()
            }
        },
        loadOptions() {
            this.ignoreOptionsUpdate = true
            const optionsString = localStorage.getItem("options")
            if (optionsString) {
                const localOptions = JSON.parse(optionsString)
                _.forOwn(this.options, (_value,key) => {
                    const typedKey = key as keyof Options
                    if (typeof localOptions[typedKey] !== "undefined") {
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
        updateSelectedNodes() {
            if (!this.flowchart) return
            this.selectedNodes = markRaw(this.flowchart.nodes.filter(n => n.state.selected))
        },
    }
})
</script>


<style lang="scss">

.code-cleanup { 
    .flowchart {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
    .flowchart-edge {
        fill: none;
        stroke: #333;
        stroke-width: 2px;
    }

    .flowchart-shape {
        stroke-width: 4px;

        &.start-node { stroke: #ffccff;}
        &.end-node { stroke: #444;}
        &.process-node { stroke: #b2e0f9;}
        &.decision-node { stroke: #fffa88;}
    }
}

</style>