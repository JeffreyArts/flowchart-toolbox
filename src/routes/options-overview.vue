<template>

    <div class="options-overview">
        <header class="title">
            <h1>Options overview</h1>
        </header>

        <hr>
        <section class="viewport">
            <div class="viewport-content" ratio="1x1">
                {{value}}
            </div>
        </section>

        <aside class="sidebar">
            <div class="options">

                <div class="option-group" name="Selectables">
                    <div class="option">
                        <label>Selectbox</label>
                        <select v-model="value">
                            <option :value="0">0</option>
                            <option :value="1">1</option>
                        </select>
                    </div>

                    <div class="option">
                        <label>Radio input</label>
                        <input type="radio" id="radio-v0" value="0" v-model="value">
                        <label for="radio-v0">
                            0
                        </label>

                        <input type="radio" id="radio-v1" value="1" v-model="value">
                        <label for="radio-v1">
                            1
                        </label>
                    </div>

                    <div class="option">
                        <label>Checkbox</label>
                        <span>
                            <input type="checkbox" id="checkbox-v0" :checked="value == 0" v-on:input="value = 0">
                            <label for="checkbox-v0">
                                0
                            </label>
                        </span>

                        <span>
                            <input type="checkbox" id="checkbox-v1" :checked="value == 1" v-on:input="value = 1">
                            <label for="checkbox-v1">
                                1
                            </label>
                        </span>
                    </div>

                    <div class="option">
                        <label for="range">
                            Range input
                        </label>
                        <input type="range" id="range" min="0" max="1" step=".1" v-model="value">
                        <!-- optional number display-->
                        <input type="number"  min="0" max="1" v-model="value">
                    </div>
                </div>





                <div class="option-group" name="Open inputs">
                    <div class="option">
                        <label for="inputNumber">
                            Number input
                        </label>
                        <input type="number" id="inputNumber" v-model="value" step="0.1" min="0" max="1">
                    </div>
                    <div class="option">
                        <label for="inputText">
                            Text input
                        </label>
                        <input type="text" id="inputText" v-model="value">
                    </div>
                </div>
                <div class="option-group" name="Extra's">
                    <div class="option">
                        <label for="inputNumber">
                            Information pop-up<i class="info"><span class="info-icon">?</span><span class="info-details">Add additional information via a hover pop-up </span></i>
                        </label>
                    </div>
                    <div class="option">
                        <label for="inputText">
                            Additional information <small>to explain something small </small>
                        </label>
                    </div>
                    <div class="option">
                        <label>Table</label>
                        <table>
                            <tbody>
                                <tr>
                                    <td>id</td>
                                    <td>0029</td>
                                </tr>
                                <tr>
                                    <td>username</td>
                                    <td>Test</td>
                                </tr>
                                <tr>
                                    <td>key</td>
                                    <td>value</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="option __isSubmit">
                        <button class="button">Do nothing</button>
                    </div>
                </div>
            </div>
        </aside>
    </div>
</template>


<script lang="ts">
import {defineComponent} from "vue"
    
export default defineComponent ({ 
    props: [],
    data() {
        return {
            value: 0
        }
    },
    mounted() {
        window.dispatchEvent(new Event("resize"))
    },
    methods: {
    }
})
</script>


<style lang="scss">

    @forward '@/assets/scss/variables.scss';

    .options-overview {
        .viewport-content {
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--accent-color);
            font-size: 16vw;
        }
    }
</style>
