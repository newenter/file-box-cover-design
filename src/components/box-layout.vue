<template>
<div ref="item"
	class="vue-box-layout"
	:style="mergedStyle">
	<slot></slot>
	
</div>
</template>

<script>
import Vue from 'vue'
import BoxItem from './box-item'
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
		
	},
	mounted() {

	}
}
</script>

<style scoped>
.vue-box-layout {
	position: relative;
	transition: height 200ms ease;
}
</style>
