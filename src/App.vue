<template>
<div id="app">
	<!-- <h1 style="text-align: center">File Box Cover Design</h1> -->
	<div class="layoutJSON">
		显示为<code>[x, y, w, h]</code>
		<div class="columns">
			<div class="layoutItem" v-for="item in layout" :key="item.i">
				<b>{{item.i}}</b>: [{{item.x}}, {{item.y}}, {{item.w}}, {{item.h}}]
			</div>
		</div>
	</div>
	<div id="content">
		<button @click="decreaseWidth">减少宽度</button>
		<button @click="increaseWidth">增加宽度</button>
		<button @click="removeItem">删除元素</button>
		<button @click="addItem">添加元素</button>
		<!-- Add to show rtl support -->
		<button @click="changeDirection">改变方向</button>
		<input type="checkbox" v-model="draggable"/> 可拖动
		<input type="checkbox" v-model="resizable"/> 可变大小
		<input type="checkbox" v-model="mirrored"/> 镜像
		<div style="margin-top: 10px;margin-bottom: 10px;">
			行高: <input type="number" v-model="rowHeight"/> 列数: <input type="number" v-model="colNum"/>
		</div>
		<box-layout
			:layout="layout"
			:col-num="parseInt(colNum)"
			:row-height="rowHeight"
			:is-draggable="draggable"
			:is-resizable="resizable"
			:is-mirrored="mirrored"
			:vertical-compact="true"
			:use-css-transforms="true"
			>
			<box-item v-for="item in layout" :key="item.i"
				:x="item.x"
				:y="item.y"
				:w="item.w"
				:h="item.h"
				:i="item.i"
				@resize="resize"
				@move="move"
				@resized="resized"
				@moved="moved"
				>
			</box-item>
		</box-layout>
	</div>
</div>
</template>

<script>
import BoxLayout from './components/box-layout'
import BoxItem from './components/box-item'


let testLayout = [
	{"x":0,"y":0,"w":2,"h":2,"i":"0", resizable: true, draggable: true},
	{"x":2,"y":0,"w":2,"h":4,"i":"1", resizable: null, draggable: null},
	{"x":4,"y":0,"w":2,"h":5,"i":"2", resizable: false, draggable: false},
	{"x":6,"y":0,"w":2,"h":3,"i":"3", resizable: false, draggable: false},
	{"x":8,"y":0,"w":2,"h":3,"i":"4", resizable: false, draggable: false},
	{"x":10,"y":0,"w":2,"h":3,"i":"5", resizable: false, draggable: false},
	{"x":0,"y":5,"w":2,"h":5,"i":"6", resizable: false, draggable: false},
	{"x":2,"y":5,"w":2,"h":5,"i":"7", resizable: false, draggable: false},
	{"x":4,"y":5,"w":2,"h":5,"i":"8", resizable: false, draggable: false},
	{"x":6,"y":4,"w":2,"h":4,"i":"9", resizable: false, draggable: false},
	{"x":8,"y":4,"w":2,"h":4,"i":"10", resizable: false, draggable: false},
	{"x":10,"y":4,"w":2,"h":4,"i":"11", resizable: false, draggable: false},
	{"x":0,"y":10,"w":2,"h":5,"i":"12", resizable: false, draggable: false},
	{"x":2,"y":10,"w":2,"h":5,"i":"13", resizable: false, draggable: false},
	{"x":4,"y":8,"w":2,"h":4,"i":"14", resizable: false, draggable: false},
	{"x":6,"y":8,"w":2,"h":4,"i":"15", resizable: false, draggable: false},
	{"x":8,"y":10,"w":2,"h":5,"i":"16", resizable: false, draggable: false},
	{"x":10,"y":4,"w":2,"h":2,"i":"17", resizable: false, draggable: false},
	{"x":0,"y":9,"w":2,"h":3,"i":"18", resizable: false, draggable: false},
	{"x":2,"y":6,"w":2,"h":2,"i":"19", resizable: false, draggable: false}
]
export default {
	name: 'app',
	components: {
		BoxLayout,
		BoxItem
	},
	data() {
		return {
			layout: JSON.parse(JSON.stringify(testLayout)),
			draggable: true,
			resizable: true,
			mirrored: false,
			rowHeight: 30,
			colNum: 12,
			index: 0
		}
	},
	mounted() {
		this.index = this.layout.length
	},
	methods: {
		increaseWidth: function() {
			let width = document.getElementById("content").offsetWidth
			width += 20;
			document.getElementById("content").style.width = width+"px"
		},
		decreaseWidth: function() {
			let width = document.getElementById("content").offsetWidth
			width -= 20;
			document.getElementById("content").style.width = width+"px"
		},
		removeItem: function(item) {
			//console.log("### REMOVE " + item.i);
			this.layout.splice(this.layout.indexOf(item), 1)
		},
		addItem: function() {
			// let self = this;
			//console.log("### LENGTH: " + this.layout.length);
			let item = {"x":0,"y":0,"w":2,"h":2,"i":this.index+"", whatever: "bbb"}
			this.index++;
			this.layout.push(item);
		},
		changeDirection() {
			let documentDirection = getDocumentDir();
			let toggle = "";
			if (documentDirection === "rtl") {
				toggle = "ltr"
			} else {
				toggle = "rtl"
			}
			setDocumentDir(toggle)
		},
		move: function(i, newX, newY){
			console.log("MOVE i=" + i + ", X=" + newX + ", Y=" + newY);
		},
		resize: function(i, newH, newW, newHPx, newWPx){
			console.log("RESIZE i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
		},
		moved: function(i, newX, newY){
			console.log("### MOVED i=" + i + ", X=" + newX + ", Y=" + newY);
		},
		resized: function(i, newH, newW, newHPx, newWPx){
			console.log("### RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx);
		},
	}
}
</script>

<style>
#app {
	font-family: 'Avenir', Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	/* text-align: center; */
	color: #2c3e50;
	/* margin-top: 60px; */
}
.layoutJSON {
	background: #ddd;
	border: 1px solid black;
	margin-top: 10px;
	padding: 10px;
}
.columns {
	-moz-columns: 120px;
	-webkit-columns: 120px;
	columns: 120px;
}
#content {
    width: 100%;
    margin-top:10px;
}
</style>
