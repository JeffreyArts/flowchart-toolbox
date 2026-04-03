<template>
    <div class="shape-outside">
        <header class="title">
            <h1>Shape-outside</h1>
        </header>

        <hr>
        <section class="viewport">
            <div class="viewport-content" ratio="1x1" >
                <div id="shape-outside-canvas"> 
                    <div class="text" :class="options.classType" ref="text" :style="`text-align: ${options.textAlign}`">
                        <div class="spacer-left" :style="`height: ${styleHeight};`"></div>
                        <div class="spacer-right" :style="`height: ${styleHeight};`"></div>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem eum possimus, porro, ab odio quia doloribus reprehenderit nostrum dolores eligendi tempore quam earum! Autem impedit quam rem porro laboriosam illum.
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem eum possimus, porro, ab odio quia doloribus reprehenderit nostrum dolores eligendi tempore quam earum! Autem impedit quam rem porro laboriosam illum.
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem eum possimus, porro, ab odio quia doloribus reprehenderit nostrum dolores eligendi tempore quam earum! Autem impedit quam rem porro laboriosam illum.
                    </div>
                </div>
            </div>
        </section>

        <aside class="sidebar">
            <div class="options">
                <div class="option-group" name="Options" >
                    <div class="option">
                     
                        <label for="classType">Class Type:</label>
                        <select id="classType" v-model="options.classType" @change="resetStyleHeight">
                            <option value="__None">None</option>
                            <option value="__Circle">Circle</option>
                            <option value="__Ellipse">Ellipse</option>
                            <option value="__Hourglass">Hourglass</option>
                            <option value="__Diamond">Diamond</option>
                            <option value="__Slash">Slash</option>
                            <option value="__Pill">Pill</option>
                        </select>

                    </div>
                    <div class="option">                     
                        <label for="classType">Text align:</label>
                        <select id="classType" v-model="options.textAlign" @change="resetStyleHeight">
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                        </select>
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
//@ts-nocheck
import { defineComponent, markRaw } from "vue"
import _, { set, update } from "lodash"

interface Options {
    classType: string,
    textAlign: string,
}

export default defineComponent ({ 
    components: {},
    props: [],
    data() {
        return {
            options: {
                textAlign: "left",
                classType: "__None",
            } as Partial<Options>,
            classType: "__None",
            styleHeight: "0px",
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
        this.updateStyleHeight()

        this.loadOptions()
    },
    unmounted() {
        // this.flowchart?.destroy()
    },
    methods: {
        resetStyleHeight() {
            this.styleHeight = "0px"
            setTimeout(() => {
                this.updateStyleHeight()
            })
        },
        updateStyleHeight() {
            
            const el = this.$refs.text as HTMLElement
            if (!el) return
            const style = getComputedStyle(el)
            let startHeight = el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
            console.log("Start Height", startHeight, style.paddingTop, style.paddingBottom)
            this.styleHeight = startHeight + "px"

            setTimeout(() => {
                if (startHeight < el.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) {
                    this.updateStyleHeight()
                }
            })
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
                classType: "__None",
                textAlign: "left",
            }
        },
    }
})
</script>


<style lang="scss">
.shape-outside { 
    .text {
        padding: 32px;
        color: #333;
        line-height: 1;
        text-align: center;
        // &::before{
        //     content: "";
        //     shape-outside: circle(50%);
        //     float: left;
        //     height: 180px;
        //     width: 80px;
        // }
        
        .spacer-left { float: left; width: 25%;}
        .spacer-right { float: right; width: 25%;}
        

        &.__None { 
            .spacer-left,
            .spacer-right { display: none; }
        }

        &.__Circle {
            .spacer-left,
            .spacer-right { shape-outside: circle(25%); }
        }

        &.__Ellipse {
            text-align: center;
            .spacer-right,
            .spacer-left { shape-outside: ellipse(50% 100%); }
        }

        &.__Hourglass {
            .spacer-left { shape-outside: polygon(0 0, 100% 50%, 0% 100%); }
            .spacer-right { shape-outside: polygon(100% 0, 0% 50%, 100% 100%); }
        }

        &.__Diamond {
            .spacer-left { shape-outside: polygon(0 0, 100% 0, 0 50%,100% 100%, 0 100%); }
            .spacer-right { shape-outside: polygon(100% 0, 100% 100%, 0 100%, 100% 50%, 0 0); }
        }


        &.__Slash {
            .spacer-left { shape-outside: polygon(0% 0%, 100% 0, 0 100%); }
            .spacer-right { shape-outside: polygon(100% 0, 0 100%, 100% 100%); }
        }

        &.__Pill {
            .spacer-left { aspect-ratio:1;max-width: 50%; shape-outside: polygon(0% 0%, 50% 0%, 50% 0%, 43.19% 0.47%, 36.51% 1.85%, 30.08% 4.14%, 24.02% 7.28%, 18.45% 11.21%, 13.46% 15.87%, 9.15% 21.17%, 5.61% 27%, 2.89% 33.26%, 1.05% 39.83%, 0.12% 46.59%, 0.12% 53.41%, 1.05% 60.17%, 2.89% 66.74%, 5.61% 73%, 9.15% 78.83%, 13.46% 84.13%, 18.45% 88.79%, 24.02% 92.72%, 30.08% 95.86%, 36.51% 98.15%, 43.19% 99.53%, 50% 100%, 50% 100%, 0% 100%); }
            .spacer-right { aspect-ratio:1;max-width: 50%; shape-outside: polygon(100% 0%, 50% 0%, 50% 0%, 56.81% 0.47%, 63.49% 1.85%, 69.92% 4.14%, 75.98% 7.28%, 81.55% 11.21%, 86.54% 15.87%, 90.85% 21.17%, 94.39% 27%, 97.11% 33.26%, 98.95% 39.83%, 99.88% 46.59%, 99.88% 53.41%, 98.95% 60.17%, 97.11% 66.74%, 94.39% 73%, 90.85% 78.83%, 86.54% 84.13%, 81.55% 88.79%, 75.98% 92.72%, 69.92% 95.86%, 63.49% 98.15%, 56.81% 99.53%, 50% 100%, 50% 100%, 100% 100%); }
        }
    }
}
</style>