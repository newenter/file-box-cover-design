<template>
<div ref="boxLayout"
	class="vue-box-layout"
	:style="mergedStyle">
	<slot></slot>
	<box-item class="vue-box-placeholder"
		v-show="isDragging"
		:x="placeholder.x"
		:y="placeholder.y"
		:w="placeholder.w"
		:h="placeholder.h"
		:i="placeholder.i"/>
</div>
</template>

<script>
import Vue from 'vue'
import BoxItem from './box-item'
import {
	bottom,
	compact,
	getLayoutItem,
	moveElement,
	validateLayout
} from '@/libs/utils'
import {
	addWindowEventListener,
	removeWindowEventListener
} from '@/libs/DOM'
let elementResizeDetectorMarker = require('element-resize-detector')

export default {
	name: 'BoxLayout',
	provide() {
		return {
			eventBus: null
		}
	},
	components: {
		BoxItem
	},
	props: {
		// If true, the container height swells and contracts to fit contents
		autoSize: {
			type: Boolean,
			default: true
		},
		colNum: {
			type: Number,
			default: 12
		},
		rowHeight: {
			type: Number,
			default: 150
		},
		maxRows: {
			type: Number,
			default: Infinity
		},
		margin: {
			type: Array,
			default: function () {
				return [10, 10]
			}
		},
		isDraggable: {
			type: Boolean,
			default: true
		},
		isResizable: {
			type: Boolean,
			default: true
		},
		isMirrored: {
			type: Boolean,
			default: false
		},
		useCssTransforms: {
			type: Boolean,
			default: true
		},
		verticalCompact: {
			type: Boolean,
			default: true
		},
		layout: {
			type: Array,
			required: true,
		},
	},
	data() {
		return {
			width: null,
			mergedStyle: {},
			lastLayoutLength: 0,
			isDragging: false,
			placeholder: {
				x: 0,
				y: 0,
				w: 0,
				h: 0,
				i: -1
			},
		}
	},
	created() {
		const self = this
		// 可访问的引用的功能，删除之前销毁
		self.resizeEventHandler = (eventType, i, x, y, h, w) => {
			self.resizeEvent(eventType, i, x, y, h, w)
		}
		self.dragEventHandler = (eventType, i, x, y, h, w) => {
			self.dragEvent(eventType, i, x, y, h, w)
		}

		self._provided.eventBus = new Vue()
		self.eventBus = self._provided.eventBus
		self.eventBus.$on('resizeEvent', self.resizeEventHandler)
		self.eventBus.$on('dragEvent', self.dragEventHandler)
	},
	beforeDestroy() {
		// 删除监听事件
		this.eventBus.$off('resizeEvent', this.resizeEventHandler)
		this.eventBus.$off('ddragEvent', this.dragEventHandler)
		removeWindowEventListener("resize", this.onWindowResize)
	},
	mounted() {
		this.$nextTick(() => {
			validateLayout(this.layout)
			const self = this
			this.$nextTick(() => {
				if (self.width === null)  {
					self.onWindowResize()
					addWindowEventListener('resize', self.onWindowResize)
				}
				compact(self.layout, self.verticalCompact)

				self.updateHeight()
				self.$nextTick(() => {
					const erd = elementResizeDetectorMarker({
						strategy: "scroll"
					})
					erd.listenTo(self.$refs.boxLayout, () => {
						self.onWindowResize()
					})
				})
			})
			addWindowEventListener("load", self.onWindowLoad.bind(this))
		})
	},
	watch: {
		width() {
			this.$nextTick(() => {
				this.eventBus.$emit("updateWidth", this.width)
				this.updateHeight()
			})
		},
		layout() {
			this.layoutUpdate()
		},
		colNum(val) {
			this.eventBus.$emit("setColNum", val)
		},
		rowHeight(val) {
			this.eventBus.$emit("setRowHeight", val)
		},
		isDraggable(val) {
			this.eventBus.$emit("setDraggable", val)
		},
		isResizable(val) {
			this.eventBus.$emit("setResizable", val)
		}
	},
	methods: {
		onWindowLoad() {
			const self = this
			if (self.width === null) {
				self.onWindowResize()
				addWindowEventListener('resize', self.onWindowResize)
			}
			compact(self.layout, self.verticalCompact)

			self.updateHeight()
			self.$nextTick(() => {
				const erd = elementResizeDetectorMarker({
					strategy: 'scroll'
				})
				erd.listenTo(self.$refs.boxLayout, () => {
					self.onWindowResize()
				})
			})
		},
		layoutUpdate() {
			if (this.layout !== undefined) {
				if (this.layout.length !== this.lastLayoutLength) {
					this.lastLayoutLength = this.layout.length
				}
				compact(this.layout, this.verticalCompact)
				this.eventBus.$emit('updateWidth', this.width)
				this.updateHeight()
			}
		},
		updateHeight() {
			this.mergedStyle = {
				height: this.containerHeight()
			}
		},
		onWindowResize() {
			if (this.$refs !== null && this.$refs.boxLayout !== null && this.$refs.boxLayout !== undefined) {
				this.width = this.$refs.boxLayout.offsetWidth;
			}
		},
		containerHeight() {
			if (!this.autoSize) return
			return bottom(this.layout) * (this.rowHeight + this.margin[1]) + this.margin[1] + 'px'
		},
		dragEvent(eventName, id, x, y, h, w) {
			if (eventName === "dragmove" || eventName === "dragstart") {
				this.placeholder.i = id
				this.placeholder.x = x
				this.placeholder.y = y
				this.placeholder.w = w
				this.placeholder.h = h
				this.$nextTick(function() {
					this.isDragging = true
				})
				this.eventBus.$emit("updateWidth", this.width)
			} else {
				this.$nextTick(function() {
					this.isDragging = false
				})
			}
			let l = getLayoutItem(this.layout, id);
			//GetLayoutItem sometimes returns null object
			if (l === undefined || l === null) {
				l = {x:0, y:0}
			}
			l.x = x
			l.y = y
			// Move the element to the dragged location.
			this.layout = moveElement(this.layout, l, x, y, true)
			compact(this.layout, this.verticalCompact)
			// needed because vue can't detect changes on array element properties
			this.eventBus.$emit("compact")
			this.updateHeight()
			if (eventName === 'dragend') {
				this.$emit('layout-updated', this.layout)
			}
		},
		resizeEvent(eventName, id, x, y, h, w) {
			if (eventName === "resizestart" || eventName === "resizemove") {
				this.placeholder.i = id
				this.placeholder.x = x
				this.placeholder.y = y
				this.placeholder.w = w
				this.placeholder.h = h
				this.$nextTick(function() {
					this.isDragging = true
				})
				this.eventBus.$emit("updateWidth", this.width)
			} else {
				this.$nextTick(function() {
					this.isDragging = false
				})
			}
			let l = getLayoutItem(this.layout, id)
			//GetLayoutItem sometimes return null object
			if (l === undefined || l === null){
				l = {h:0, w:0}
			}
			l.h = h
			l.w = w
			compact(this.layout, this.verticalCompact)
			this.eventBus.$emit("compact")
			this.updateHeight()
			if (eventName === 'resizeend') {
				this.$emit('layout-updated', this.layout)
			}
		}
	}
}
</script>

<style scoped>
.vue-box-layout {
	position: relative;
	transition: height 200ms ease;
	background: url('./imgs/box-bg.png');
}
</style>
