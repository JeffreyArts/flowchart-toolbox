<template>
    <div class="site-menu-container">
        <div class="site-menu" ref="siteMenu">
            <router-link to="/" class="site-menu-title">Toolbox</router-link>
            
            <div class="site-menu-list">
                <span class="site-menu-list-item"
                    @click="goTo(route.path)"
                    v-for="(route, routeIndex) in routes" 
                    :key="routeIndex"
                    :class="[currentRoute.name == route.name ? '__isCurrent' : '']">{{route.name}}</span>
            </div>
        </div>
        
        
        <div class="site-menu-toggle-mobile" @click="toggleMenu()" :class="[isOpen ? '__isOpen': '']">
            <site-icon :name="isOpen ? 'cross' : 'hamburger'" :transitEffect="{duration: .6, delay:.002, ease: 'step(1)', effect: 'left-to-right'  }" size="medium" activeColor="#fff" inactiveColor="rgba(0, 0, 0,.24)" />
        </div>
        <div class="site-menu-toggle" @click="toggleMenu()" :class="[showToggle ? '__isVisible': '']">›</div>
    </div>
</template>

<script lang="ts">
import { RouteRecord, RouteComponent } from "vue-router"
import {defineComponent} from "vue"
import siteIcon from "./site-icon/site-icon.vue"
import gsap from "gsap"

export default defineComponent ({
    name: "SiteMenu", 
    components: {siteIcon},
    props: [],
    data() {
        return {
            isOpen: false,
            showToggle: true,
            routes: [] as Array<RouteRecord>,
            currentRoute:{} as RouteComponent,
            bodyElement: document.querySelector("body") as HTMLElement
        }
    },
    watch:{
        $route (to){
            this.currentRoute = to
        }
    },
    mounted() {
        const allRoutes = this.$router.getRoutes()
        allRoutes.forEach((route: RouteRecord) :void => {
            if (route.name != "Home") {
                this.routes.push(route)
            }
        })
        
        const target = this.$refs["siteMenu"]
        if (!target) {
            throw new Error("Missing target siteMenu")
        }
        
        if (localStorage.getItem("siteMenuOpen") === "0") {
            this.isOpen = false 

            gsap.set(target, {
                paddingLeft: 0,
                width: 0,
                minWidth: 0,    
            })
        } else {
            this.isOpen = true

            gsap.set(target, {
                paddingLeft: 24,
                width: "100%",
                minWidth: 320,    
            })
        }
        localStorage.setItem("siteMenuOpen", this.isOpen ? "1" : "0")
        // this.toggleMenu()
        document.addEventListener("mousemove", this.displayToggle)
    },
    unmounted() {
        document.removeEventListener("mousemove", this.displayToggle)
    },
    methods: {
        toggleMenu() :void {
            const target = this.$refs["siteMenu"]
            if (!target) {
                throw new Error("Missing target siteMenu")
            }

            // Add .__menuOpen to <body>
            if (!this.isOpen) {
                this.bodyElement.classList.remove("__menuOpen")
                this.isOpen = !this.isOpen 
                gsap.to(target, {
                    paddingLeft: 24,
                    width: "100%",
                    minWidth: 320,
                    ease: "power1.inOut",
                    duration: .4,
                    onComplete: () => {
                        this.showToggle = true
                        localStorage.setItem("siteMenuOpen", this.isOpen ? "1" : "0")

                        setTimeout(() => {
                            window.dispatchEvent(new Event("resize"))
                        })
                    }
                })
            } else {
                this.bodyElement.classList.add("__menuOpen")
                gsap.to(target, {
                    paddingLeft: 0,
                    width: 0,
                    minWidth: 0,
                    ease: "power1.inOut",
                    duration: .4,
                    onComplete: () => {
                        this.isOpen = !this.isOpen 
                        this.showToggle = false
                        localStorage.setItem("siteMenuOpen", this.isOpen ? "1" : "0")
                        
                        setTimeout(() => {
                            window.dispatchEvent(new Event("resize"))
                        })
                    }
                })
            }
        },
        displayToggle(event: MouseEvent) :void {
            var width = this.$el.querySelector(".site-menu").clientWidth
            if (!this.isOpen) {
                if (event.clientX < 32) {
                    setTimeout(() => {
                        this.showToggle = true
                    })
                } else if (this.showToggle == true) {
                    setTimeout(() => {
                        this.showToggle = false
                    })
                }
            } else {
                if (event.clientX > width &&
                event.clientX < width + 36
                ) {
                    setTimeout(() => {
                        this.showToggle = true
                    })
                } else if (this.showToggle == true) {
                    setTimeout(() => {
                        this.showToggle = false
                    })
                }
            }
            
        },
        goTo(path: string) {
            this.$router.push({path})
            if (window.innerWidth <=640) {
                this.toggleMenu()
            }
        }
        
    }
})

</script>

<style lang="scss">
@forward '@/assets/scss/variables.scss';

.site-menu-container {
    position: relative;
    margin: 0;
    padding: 0;
    display: block;
    float: left;
}

.site-menu {
    height: 100%;
    width: 0;
    padding: 32px 0 48px;
    padding-left: 0;
    overflow-x: hidden;
    margin: 0;
    position: relative;
    background-image: linear-gradient(90deg, rgba(0,0,0,.32),  rgba(0,0,0,.16));
}

.__menuOpen {
    .site-menu {
        padding-left: 24px;
        width: 100%;
        min-width: 320px;
    }

    .site-menu-toggle {
        transform: rotateY(180deg);
    }
}

.site-menu-title {
    font-size: 32px;
    margin-bottom: 32px;
    display: inline-block;
    white-space: nowrap;
    font-weight: bold;
    color: #fff;
    text-decoration: none;
}

.site-menu-list {
    display: flex;
    flex-flow: column;
    overflow-y: auto;
    max-height: calc(100vh - 128px);
    overflow-x: hidden;
}

.site-menu-list-item {
    color: #fff;
    white-space: nowrap;
    display: block;
    margin-bottom: 8px;
    width: 100%;
    text-decoration: none;
    position: relative;
    margin-left: 16px;
    cursor: pointer;
    transition: .24s all ease;

    &:hover,
    &:focus {
        color: var(--accent-color);
        margin-left: 24px;
        &:before {
            color: #fff;
            left: -24px;
        }
    }
    &:before {
        position: absolute;
        transition: .24s all ease;
        left: -16px;
        content: "";
        width: 2px;
        background-color: currentColor;
        display: inline-block;
        height: 100%;
    }

    &.__isCurrent {
        color: #fff;
        &:before {
            color: var(--accent-color);
        }
    }
}

.site-menu-toggle {
    position: absolute;
    width: 0;
    background-color: rgba(0,0,0,.16);
    padding: 16px 0;
    overflow: hidden;
    text-align: center;
    cursor: pointer;
    top: 50%;
    z-index: 2021;
    right: -32px;
    font-size:32px;
    transition: all ease 0.24s;
    display: none;
    
    &.__isVisible {
        width: 32px;
        opacity: 1;
    }
    @media all and (min-width: 560px) {
        display: block
    }
}

.site-menu-toggle-mobile {
    position: absolute;
    right: -40px;
    top: 1px;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2024;
    font-size: 18px;
    svg {
        width: 13px;
    }

    &.__isOpen {
        right: 0;
    }
    @media all and (min-width: 640px) { 
        top: 2px;
        width: 64px;
        height: 64px;
        right: -64px;

        svg {
            width: 26px;
        }
    }

}
</style>