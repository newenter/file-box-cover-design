<template>
<div id="rulerTool"
	class="scale_box"
	onselectstart="return false;"
	v-if="rulerToggle"
	:style="{
		width: windowWidth + 'px',
		height: windowHeight + 'px',
		position: position
		}">
	<div id="levelRuler"
		class="scale_ruler_h"
		@mousedown.stop="levelDragRuler">
		<span v-for="(item, index) in xScale" :key="index"
			class="n"
			:style="{left: index * 50 + 2 + 'px'}">
			{{item.id}}
		</span>
	</div>
	<div id="verticalRuler"
		class="scale_ruler_v"
		@mousedown.stop="verticalDragRuler">
		<span v-for="(item, index) in yScale" :key="index"
			class="n"
			:style="{top: index * 50 + 2 + 'px'}">
			{{item.id}}
		</span>
	</div>
	<div id="levelDottedLine"
		class="ref_dot_h"
		:style="{top: verticalDottedTop + 'px'}" />
	<div id="verticalDottedLine"
		class="ref_dot_v"
		:style="{top: levelDottedLeft + 'px'}" />
	
	<div v-for="item in levelLineList"
		class="ref_line_h"
		:id="item.id"
		:title="item.title"
		:key="item.id"
		:style="{top: item.top + 'px'}"
		@mousedown="dragLevelLine(item.id)"/>
	<div v-for="item in verticalLineList"
		class="ref_line_v"
		:id="item.id"
		:title="item.title"
		:key="item.id"
		:style="{left: item.left + 'px'}"
		@mousedown="dragVerticalLine(item.id)"/>
	<div id="content"
		:style="{left: contentLayout.left + 'px', top: contentLayout.top + 'px'}">
		<slot />
	</div>
</div>
</template>

<script>
export default {
	name: 'RulerTool',
	components: {},
	props: {
		// 规定元素的定位类型
		position: {
			type: String,
			default: 'relative',
			validator: (val) => {
				return ['absolute', 'fixed', 'relative', 'static', 'inherit'].indexOf(val) !== -1
			}
		},
		// 热键开关
		isHotKey: {
			type: Boolean,
			default: true
		},
		// 刻度修正(根据content进行刻度重置)
		isScaleRevise: {
			type: Boolean,
			default: false
		},
		// 预置参考线
		presetLine: {
			type: Array,
			default: () => {
				return []
			}
		},
		// 内容部分布局
		contentLayout: {
			type: Object,
			default: () => {
				return { top: 18, left: 18 }
			}
		}
	},
	data() {
		return {
			windowWidth: 0, // 窗口宽度
			windowHeight: 0, // 窗口高度
			xScale: [], // 水平刻度
			yScale: [], // 垂直刻度
			topSpacing: 0, // 标尺与窗口上间距
			leftSpacing: 0, //  标尺与窗口左间距
			isDrag: false,
			dragFlag: '', // 拖动开始标记，可能值x(从水平标尺开始拖动),y(从垂直标尺开始拖动)
			levelLineList: [], // 生成的水平线列表
			verticalLineList: [], // 生成的垂直线列表
			levelDottedLeft: 0, // 水平虚线位置
			verticalDottedTop: 0, // 垂直虚线位置
			rulerWidth: 0, // 垂直标尺的宽度
			rulerHeight: 0, // 水平标尺的高度
			dragLineId: '', // 被移动线的ID
			keyCode: {
				r: 82
			}, // 快捷键参数
			rulerToggle: true // 标尺辅助线显示开关
		}
	},
	mounted() {
		document.documentElement.addEventListener('mousemove', this.dottedLineMove, true)
		document.documentElement.addEventListener('mouseup', this.dottedLineUp, true)
		document.documentElement.addEventListener('keyup', this.keyboard, true)
		this.init()
		this.quickGeneration(this.presetLine)	// 生成预置参考线
		const self = this 						// 绑定窗口调整大小onresize事件
		// 如果直接使用this,this指向的不是vue实例
		window.onresize = function() { 
			self.xScale = []
			self.yScale = []
			self.init()
		}
	},
	beforeDestroy() {
		document.documentElement.removeEventListener('mousemove', this.dottedLineMove, true)
		document.documentElement.removeEventListener('mouseup', this.dottedLineUp, true)
		document.documentElement.removeEventListener('keyup', this.keyboard, true)
	},
	methods: {
		init() {
			this.box()
			this.scaleCalc()
		},
		// 获取窗口宽与高
		box() {
			if (this.isScaleRevise) { // 根据内容部分进行刻度修正
				const content = document.getElementById('content')
				const contentLeft = content.offsetLeft
				const contentTop = content.offsetTop
				for (let i = 0; i < contentLeft; i += 1) {
					if (i % 50 === 0 && i + 50 <= contentLeft) {
						this.xScale.push({ id: i })
					}
				}
				for (let i = 0; i < contentTop; i += 1) {
					if (i % 50 === 0 && i + 50 <= contentTop) {
						this.yScale.push({ id: i })
					}
				}
			}
			this.windowWidth = document.documentElement.clientWidth - this.leftSpacing
			this.windowHeight = document.documentElement.clientHeight - this.topSpacing
			this.rulerWidth = document.getElementById('verticalRuler').clientWidth
			this.rulerHeight = document.getElementById('levelRuler').clientHeight
			this.topSpacing = document.getElementById('levelRuler').offsetParent.offsetTop
			this.leftSpacing =document.getElementById('verticalRuler').offsetParent.offsetLeft
		},
		// 计算刻度
		scaleCalc() {
			for (let i = 0; i < this.windowWidth; i += 1) {
				if (i % 50 === 0) {
					this.xScale.push({ id: i })
				}
			}
			for (let i = 0; i < this.windowHeight; i += 1) {
				if (i % 50 === 0) {
					this.yScale.push({ id: i })
				}
			}
		},
		// 生成一个水平参考线
		newLevelLine() {
			this.isDrag = true
			this.dragFlag = 'x'
		},
		// 生成一个垂直参考线
		newVerticalLine() {
			this.isDrag = true
			this.dragFlag = 'y'
		},
		// 虚线移动
		dottedLineMove($event) {
			switch (this.dragFlag) {
				case 'x':
					if (this.isDrag) {
						this.verticalDottedTop = $event.pageY - this.topSpacing
					}
					break
				case 'y':
					if (this.isDrag) {
						this.levelDottedLeft = $event.pageX - this.leftSpacing
					}
					break
				case 'l':
					if (this.isDrag) {
						this.verticalDottedTop = $event.pageY - this.topSpacing
					}
					break
				case 'v':
					if (this.isDrag) {
						this.levelDottedLeft = $event.pageX - this.leftSpacing
					}
					break
				default:
					break
			}
		},
		// 虚线松开
		dottedLineUp($event) {
			if (this.isDrag) {
				this.isDrag = false
				switch (this.dragFlag) {
					case 'x':
						this.levelLineList.push({
							id: 'levelLine' + this.levelLineList.length + 1,
							title: $event.pageY + 1 - this.topSpacing + 'px',
							top: $event.pageY - this.topSpacing + 1
						})
						break
					case 'y':
						this.verticalLineList.push({
							id: 'verticalLine' + this.verticalLineList.length + 1,
							title: $event.pageX + 1 - this.leftSpacing + 'px',
							left: $event.pageX - this.leftSpacing + 1
						})
						break
					case 'l':
						if ($event.pageY - this.topSpacing < this.rulerHeight) {
							let Index, id
							this.levelLineList.forEach((item, index) => {
								if (item.id === this.dragLineId) {
									Index = index
									id = item.id
								}
							})
							this.levelLineList.splice(Index, 1, {
								id: id,
								title: -600 + 'px',
								top: -600
							})
						} else {
							let Index, id
							this.levelLineList.forEach((item, index) => {
								if (item.id === this.dragLineId) {
									Index = index
									id = item.id
								}
							})
							this.levelLineList.splice(Index, 1, {
								id: id,
								title: $event.pageY + 1 - this.topSpacing + 'px',
								top: $event.pageY - this.topSpacing + 1
							})
						}
						break
					case 'v':
						if ($event.pageX - this.leftSpacing < this.rulerWidth) {
							let Index, id
							this.verticalLineList.forEach((item, index) => {
								if (item.id === this.dragLineId) {
									Index = index
									id = item.id
								}
							})
							this.verticalLineList.splice(Index, 1, {
								id: id,
								title: -600 + 'px',
								left: -600
							})
						} else {
							let Index, id
							this.verticalLineList.forEach((item, index) => {
								if (item.id === this.dragLineId) {
									Index = index
									id = item.id
								}
							})
							this.verticalLineList.splice(Index, 1, {
								id: id,
								title: $event.pageX + 1 - this.leftSpacing + 'px',
								left: $event.pageX - this.leftSpacing + 1
							})
						}
						break
					default:
						break
				}
				this.verticalDottedTop = this.levelDottedLeft = -10
			}
		}, 
		// 水平标尺处按下鼠标
		levelDragRuler() {
			this.newLevelLine()
		}, 
		// 垂直标尺处按下鼠标
		verticalDragRuler() {
			this.newVerticalLine()
		},
		// 水平线处按下鼠标
		dragLevelLine(id) {
			this.isDrag = true
			this.dragFlag = 'l'
			this.dragLineId = id
		},
		// 垂直线处按下鼠标
		dragVerticalLine(id) {
			this.isDrag = true
			this.dragFlag = 'v'
			this.dragLineId = id
		},
		// 键盘事件
		keyboard($event) {
			if (this.isHotKey) {
				switch ($event.keyCode) {
				case this.keyCode.r:
					this.rulerToggle = !this.rulerToggle
					break
				}
			}
		},
		// 快速生成参考线
		quickGeneration(params) {
			if (params !== []) {
				params.forEach(item => {
					switch (item.type) {
						case 'l':
							this.levelLineList.push({
								id: 'levelLine' + this.levelLineList.length + 1,
								title: item.site + 'px',
								top: item.site
							})
							break
						case 'v':
							this.verticalLineList.push({
								id: 'verticalLine' + this.verticalLineList.length + 1,
								title: item.site + 'px',
								left: item.site
							})
							break
						default:
							break
					}
				})
			}
		}
	}
}
</script>

<style scoped>
.scale_box {
	left: 0;
	top: 0;
	z-index: 999;
	overflow: hidden;
	user-select: none;
}

.scale_ruler_h, .scale_ruler_v, .ref_line_v, .ref_line_h, .ref_dot_h, .ref_dot_v {
	position: absolute;
	left: 0;
	top: 0;
	overflow: hidden;
	z-index: 999;
}

.scale_ruler_h {
	margin-left: 18px;
	width: 100%;
	height: 18px;
	background: url('./imgs/ruler_h.png') repeat-x;
}

.scale_ruler_v {
	margin-top: 18px;
	width: 18px;
	height: 100%;
	background: url('./imgs/ruler_v.png') repeat-y;
}

.scale_ruler_v .n, .scale_ruler_h .n {
	position: absolute;
	font: 10px/1 Arial, sans-serif;
	color: #333;
	cursor: default;
}

.scale_ruler_v .n {
	width: 8px;
	left: 3px;
	word-wrap: break-word;
}

.scale_ruler_h .n {
	top: 1px;
}

.ref_line_v, .ref_line_h, .ref_dot_h, .ref_dot_v {
	z-index: 998;
}

.ref_line_h {
	width: 100%;
	height: 3px;
	background: url('./imgs/line_h.png') repeat-x left center;
	cursor: n-resize; /*url(./image/cur_move_h.cur), move*/
}

.ref_line_v {
	width: 3px;
	height: 100%;
	_height: 9999px;
	background: url('./imgs/line_v.png') repeat-y center top;
	cursor: w-resize;/*url(./image/cur_move_v.cur), move*/
}

.ref_dot_h {
	width: 100%;
	height: 3px;
	background: url('./imgs/line_dot.png') repeat-x left 1px;
	cursor:  n-resize;/*url(./image/cur_move_h.cur), move*/
	top: -10px;
}

.ref_dot_v {
	width: 3px;
	height: 100%;
	_height: 9999px;
	background: url('./imgs/line_dot.png') repeat-y 1px top;
	cursor: w-resize;/*url(./image/cur_move_v.cur), move*/
	left: -10px;
}
#content {
	position: absolute;
}
</style>
