<template>
<div ref="item"
	class="vue-box-item"
	:style="style"
	:class="{
		'vue-resizable': resizable
	}">
	<slot></slot>
	<span ref="handle"
		 v-if="resizable"
		:class="resizableHandleClass"/>
</div>
</template>

<script>
export default {
	name: 'BoxItem',
	props: {
		isDraggable: {
			type: Boolean,
			required: false,
			default: null
		},
		isResizable: {
			type: Boolean,
			required: false,
			default: null
		},
		minH: {
			type: Number,
			required: false,
			default: 1
		},
		minW: {
			type: Number,
			required: false,
			default: 1
		},
		maxH: {
			type: Number,
			required: false,
			default: Infinity
		},
		maxW: {
			type: Number,
			required: false,
			default: Infinity
		},
		x: {
			type: Number,
			required: true
		},
		y: {
			type: Number,
			required: true
		},
		w: {
			type: Number,
			required: true
		},
		h: {
			type: Number,
			required: true
		},
		i: {
			required: true
		},
		dragIgnoreFrom: {
			type: String,
			required: false,
			default: 'a, button'
		},
		dragAllowFrom: {
			type: String,
			required: false,
			default: null
		},
		resizeIgnoreFrom: {
			type: String,
			required: false,
			default: 'a, button'
		},
	},
	inject: ['eventBus'],
	data() {
		return {
			cols: 1,
			containerWidth: 100,
			rowHeight: 30,
			margin: [10, 10],
			maxRows: Infinity,
			draggable: null,
			resizable: null,
			useCssTransforms: true,

			isDragging: false,
			dragging: null,
			isResizing: false,
			resizing: null,
			lastX: NaN,
			lastY: NaN,
			lastW: NaN,
			lastH: NaN,
			style: {},
			rtl: false,

			dragEventSet: false,
			resizeEventSet: false,

			previousW: null,
			previousH: null,
			previousX: null,
			previousY: null,
			innerX: this.x,
			innerY: this.y,
			innerW: this.w,
			innerH: this.h
		}
	}
}
</script>

<style>

</style>
