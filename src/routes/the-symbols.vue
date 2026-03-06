<template>
    <div class="the-symbols">
        <header class="title">
            <h1>The symbols</h1>
        </header>

        <hr>
        <section class="viewport">
            <div class="viewport-content" ratio="1x1" >
                <!-- {{ options.symbolType }} -->
                <div class="canvas">
                    <processSymbol x="50%" y="50%" v-if="options.symbolType === 'process'"> {{ options.symbolText }}</processSymbol>
                    <startSymbol x="50%" y="50%" v-if="options.symbolType === 'start'"> {{ options.symbolText }}</startSymbol>
                    <endSymbol x="50%" y="50%" v-if="options.symbolType === 'end'"> {{ options.symbolText }}</endSymbol>
                    <decisionSymbol x="50%" y="50%" v-if="options.symbolType === 'decision'"> {{ options.symbolText }} </decisionSymbol>
                </div>
            </div>
        </section>

        <aside class="sidebar">
            <div class="options">
                <div class="option-group" name="Options" >
                    <div class="option">
                        <label for="options-symbolType">Symbol Type</label>
                        <select id="options-symbolType" v-model="options.symbolType">
                            <option v-for="symbolType in SymbolTypes" :key="symbolType" :value="symbolType">
                                {{ symbolType }}
                            </option>
                        </select>
                    </div>
                    <div class="option">
                        <label for="options-symbolText">Text</label>
                        <textarea id="options-symbolText" v-model="options.symbolText">
                        </textarea>
                    </div>
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
import { defineComponent } from "vue"
import _ from "lodash"
import startSymbol from "@/components/symbols/start.vue"
import endSymbol from "@/components/symbols/end.vue"
import processSymbol from "@/components/symbols/process.vue"
import decisionSymbol from "@/components/symbols/decision.vue"

interface Options {
    symbolType: SymbolType | undefined
    symbolText: string
}

export type SymbolType = "start" | "end" | "process" | "decision" 

export default defineComponent ({ 
    components: {
        processSymbol,
        startSymbol,
        endSymbol,
        decisionSymbol,
    },
    props: [],
    data() {
        return {
            SymbolTypes: ["start", "end", "process", "decision"] as SymbolType[],
            options: {
                symbolType: undefined as SymbolType | undefined,
                symbolText: "", 
            } as Partial<Options>,
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
        this.loadOptions()
    },
    unmounted() {
        //
    },
    methods: {
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
                symbolType: undefined,
                symbolText: "Test",
            }
        },
    }
})
</script>


<style lang="scss" scoped>

.the-symbols {
    .viewport-content {
        font-size: 16px;
    }
    
    .canvas {
        color: #333;
        position: relative;
        width: 100%;
        height: 100%;
    }
}

</style>