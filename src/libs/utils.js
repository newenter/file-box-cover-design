/**
 * Return the bottom coordinate of the layout.
 * @param  {Array<LayoutItem>} layout  Layout array.
 * @Return {Number}                    Bottom coordinate.
 */
export function bottom(layout) {
	let max = 0, bottomY
	for (let  i = 0, len = layout.length;  i < len; i++) {
		bottomY = layout[i].y + layout[i].h
		if (bottomY > max) {
			max = bottomY
		}
	}
	return max
}

export function cloneLayout(layout) {
	const newLayout = Array(layout.length)
	for (let i = 0, len = layout.length; i < len; i++) {
		newLayout[i] = cloneLayoutItem(layout[i])
	}
	return newLayout
}
/**
 * 
 * @param {Object} layoutItem 
 */
export function cloneLayoutItem(layoutItem) {
	return JSON.parse(JSON.stringify(layoutItem))
}

/**
 * 碰撞检测
 * @param {BoxItem} item1 
 * @param {BoxItem} item2 
 */
export function collides (item1, item2) {
	// 相同的元素
	if (item1 === item2) return false
	// item1在item2左边
	if (item1.x + item1.w <= item2.x) return false
	// item1在item2右边
	if (item1.x >= item2.x + item2.w) return false
	// item1在item2上面
	if (item1.y + item1.h <= item2.y) return false
	// item1在item2下面
	if (item1.y >= item2.y + item2.h) return false

	// 重叠
	return true
}

/**
 * 给定一个布局，压缩它。这涉及到向下移动每个y坐标，并删除项目之间的间隙。
 * @param {BoxLayout} layout 
 * @param {Boolean} verticalCompact 
 */
export function compact(layout, verticalCompact) {
	const compareWith = getStatics(layout)
	const sorted = sortLayoutItemsByRowCol(layout)
	const out = Array(layout.length)

	for (let i = 0, len = sorted.length; i < len; i++) {
		let l = sorted[i]
		if (!l.static) {
			l = compactItem(compareWith, l, verticalCompact)
			compareWith.push(l)
		}

		out[layout.indexOf(l)] = l
		l.moved = false
	}
	return out
}
/**
 * 压缩一个Item
 * @param {BoxLayout} compareWith 
 * @param {BoxItem} item 
 * @param {Boolean} verticalCompact 
 */
export function compactItem(compareWith, item, verticalCompact) {
	if (verticalCompact) {
		// 将元素向上移动到不发生碰撞的最大距离
		while (item.y > 0 && !getFirstCollistion(compareWith, item)) {
			item.y--
		}
	}

	// 把它往下移动，如果它碰撞了就继续往下移动
	let collides
	while ((collides = getFirstCollistion(compareWith, item))) {
		item.y = collides.y + collides.h
	}

	return item
}

/**
 * 确保所有元素都在给定的layout边界内
 * @param {Array} layout 
 * @param {Number} bounds 
 */
export function correctBounds(layout, bounds) {
	const collidesWith = getStatics(layout)
	for (let i = 0, len = layout.length; i < len; i++) {
		const l = layout[i]
		// 右边溢出
		if (l.x + l.w > bounds.cols) {
			l.x = bounds.cols - l.w
		}
		// 左边溢出
		if (l.x < 0) {
			l.x = 0
			l.w = bounds.cols
		}
		if (!l.static) {
			collidesWith.push(l)
		} else {
			// 如果这是静态的并且与其他静态碰撞，我们必须把它移下来。
			// 我们要做的比让它们重叠更好.
			while(getFirstCollistion(collidesWith, l)) {
				l.y++
			}
		}
	}
	return layout
}

/**
 * 根据Id获取layout中的Item
 * @param {Array} layout 
 * @param {String} id 
 */
export function getLayoutItem(layout, id) {
	for (let i = 0, len = layout.length; i < len; i++) {
		if (layout[i].i === id) return layout[i]
	}
}

/**
 * 获取所有静态元素
 * @param {*} layout 
 */
export function getStatics(layout) {
	return layout.filter((l) => l.static)
}

/**
 * 从左上角到右下角依次排列布局项。
 * @param {*} layout 
 */
export function sortLayoutItemsByRowCol(layout) {
	return [].concat(layout).sort((a,b) => {
		if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
			return 1
		}
		return -1
	})
}

/**
 * 返回当前layout中每个重叠的Item.
 * @param {*} layout 
 * @param {*} layoutItem 
 */
export function getFirstCollistion(layout, layoutItem) {
	for (let i = 0, len = layout.length; i < len; i++) {
		if (collides(layout[i], layoutItem)) {
			return layout[i]
		}
	}
}

/**
 * 返回所有重叠的Item
 * @param {*} layout 
 * @param {*} layoutItem 
 */
export function getAllCollistions(layout, layoutItem) {
	return layout.filter((l) => collides(l, layoutItem))
}

/**
 * 移动元素
 * @param {Array} layout 
 * @param {BoxItem} item 
 * @param {Number} x 
 * @param {Number} y 
 * @param {Boolean} isUserAction 
 */
export function moveElement(layout, item, x, y, isUserAction) {
	if (item.static) return layout
	// Short-circuit if nothing to do.
	//if (item.y === y && item.x === x) return layout;

	const movingUp = y && item.y > y
	// This is quite a bit faster than extending the object
	if (typeof x === 'number') item.x = x
	if (typeof y === 'number') item.y = y
	item.moved = true

	// If this collides with anything, move it.
	// When doing this comparison, we have to sort the items we compare with
	// to ensure, in the case of multiple collisions, that we're getting the
	// nearest collision.
	let sorted = sortLayoutItemsByRowCol(layout)
	if (movingUp) sorted = sorted.reverse()
	const collisions = getAllCollisions(sorted, item)

	// Move each item that collides away from this element.
	for (let i = 0, len = collisions.length; i < len; i++) {
		const collision = collisions[i]
		// console.log('resolving collision between', l.i, 'at', l.y, 'and', collision.i, 'at', collision.y);

		// Short circuit so we can't infinite loop
		if (collision.moved) continue

		// This makes it feel a bit more precise by waiting to swap for just a bit when moving up.
		if (item.y > collision.y && item.y - collision.y > collision.h / 4) continue

		// Don't move static items - we have to move *this* element away
		if (collision.static) {
			layout = moveElementAwayFromCollision(layout, collision, item, isUserAction)
		} else {
			layout = moveElementAwayFromCollision(layout, item, collision, isUserAction)
		}
	}

	return layout
}

/**
 * This is where the magic needs to happen - given a collision, move an element away from the collision.
 * We attempt to move it up if there's room, otherwise it goes below.
 *
 * @param  {Array} layout            Full layout to modify.
 * @param  {LayoutItem} collidesWith Layout item we're colliding with.
 * @param  {LayoutItem} itemToMove   Layout item we're moving.
 * @param  {Boolean} [isUserAction]  If true, designates that the item we're moving is being dragged/resized
 *                                   by the user.
 */
export function moveElementAwayFromCollision(layout, collidesWith, itemToMove, isUserAction) {
	// If there is enough space above the collision to put this element, move it there.
	// We only do this on the main collision as this can get funky in cascades and cause
	// unwanted swapping behavior.
	if (isUserAction) {
		// Make a mock item so we don't modify the item here, only modify in moveElement.
		const fakeItem = {
			x: itemToMove.x,
			y: itemToMove.y,
			w: itemToMove.w,
			h: itemToMove.h,
			i: '-1'
		}
		fakeItem.y = Math.max(collidesWith.y - itemToMove.h, 0)
		if (!getFirstCollision(layout, fakeItem)) {
			return moveElement(layout, itemToMove, undefined, fakeItem.y)
		}
	}

	// Previously this was optimized to move below the collision directly, but this can cause problems
	// with cascading moves, as an item may actually leapflog a collision and cause a reversal in order.
	return moveElement(layout, itemToMove, undefined, itemToMove.y + 1)
}
/**
 * Returns the first item this layout collides with.
 * It doesn't appear to matter which order we approach this from, although
 * perhaps that is the wrong thing to do.
 *
 * @param  {Object} layoutItem Layout item.
 * @return {Object|undefined}  A colliding layout item, or undefined.
 */
export function getFirstCollision(layout, layoutItem) {
	for (let i = 0, len = layout.length; i < len; i++) {
		if (collides(layout[i], layoutItem)) return layout[i]
	}
}

export function getAllCollisions(layout, layoutItem) {
	return layout.filter((l) => collides(l, layoutItem))
}

/**
 * Helper to convert a number to a percentage string.
 *
 * @param  {Number} num Any number
 * @return {String}     That number as a percentage.
 */
export function perc(num) {
	return num * 100 + '%'
}

export function setTransform(top, left, width, height) {
	// Replace unitless items with px
	const translate = "translate3d(" + left + "px," + top + "px, 0)"
	return {
		transform: translate,
		WebkitTransform: translate,
		MozTransform: translate,
		msTransform: translate,
		OTransform: translate,
		width: width + "px",
		height: height + "px",
		position: 'absolute'
	}
  }

  /**
 * Just like the setTransform method, but instead it will return a negative value of right.
 *
 * @param top
 * @param right
 * @param width
 * @param height
 * @returns {{transform: string, WebkitTransform: string, MozTransform: string, msTransform: string, OTransform: string, width: string, height: string, position: string}}
 */
export function setTransformRtl(top, right, width, height) {
	// Replace unitless items with px
	const translate = "translate3d(" + right * -1 + "px," + top + "px, 0)"
	return {
		transform: translate,
		WebkitTransform: translate,
		MozTransform: translate,
		msTransform: translate,
		OTransform: translate,
		width: width + "px",
		height: height + "px",
		position: 'absolute'
	}
}

export function setTopLeft(top, left, width, height) {
	return {
		top: top + "px",
		left: left + "px",
		width: width + "px",
		height: height + "px",
		position: 'absolute'
	}
}

/**
 * Just like the setTopLeft method, but instead, it will return a right property instead of left.
 *
 * @param top
 * @param right
 * @param width
 * @param height
 * @returns {{top: string, right: string, width: string, height: string, position: string}}
 */
export function setTopRight(top, right, width, height) {
	return {
		top: top + "px",
		right: right+ "px",
		width: width + "px",
		height: height + "px",
		position: 'absolute'
	}
}

/**
 * Validate a layout. Throws errors.
 *
 * @param  {Array}  layout        Array of layout items.
 * @param  {String} [contextName] Context name for errors.
 * @throw  {Error}                Validation error.
 */
export function validateLayout(layout, contextName) {
	contextName = contextName || "Layout"
	const subProps = ['x', 'y', 'w', 'h']
	if (!Array.isArray(layout)) throw new Error(contextName + " must be an array!")
	for (let i = 0, len = layout.length; i < len; i++) {
		const item = layout[i]
		for (let j = 0; j < subProps.length; j++) {
			if (typeof item[subProps[j]] !== 'number') {
				throw new Error('VueGridLayout: ' + contextName + '[' + i + '].' + subProps[j] + ' must be a number!')
			}
		}
		if (item.i && typeof item.i !== 'string') {
		// number is also ok, so comment the error
			// TODO confirm if commenting the line below doesn't cause unexpected problems
		// throw new Error('VueGridLayout: ' + contextName + '[' + i + '].i must be a string!');
		}
		if (item.static !== undefined && typeof item.static !== 'boolean') {
			throw new Error('VueGridLayout: ' + contextName + '[' + i + '].static must be a boolean!')
		}
	}
}

/**
 * Flow can't really figure this out, so we just use Object
 * @param {Object} el 
 * @param {Array<String>} fns 
 */
export function autoBindHandlers(el, fns) {
	fns.forEach((key) => el[key] = el[key].bind(el));
}


/**
 * Convert a JS object to CSS string. Similar to React's output of CSS.
 * @param obj
 * @returns {string}
 */
export function createMarkup(obj) {
	var keys = Object.keys(obj)
	if (!keys.length) return ''
	var i, len = keys.length
	var result = ''

	for (i = 0; i < len; i++) {
		var key = keys[i]
		var val = obj[key]
		result += hyphenate(key) + ':' + addPx(key, val) + ';'
	}

	return result
}


/* The following list is defined in React's core */
export var IS_UNITLESS = {
	animationIterationCount: true,
	boxFlex: true,
	boxFlexGroup: true,
	boxOrdinalGroup: true,
	columnCount: true,
	flex: true,
	flexGrow: true,
	flexPositive: true,
	flexShrink: true,
	flexNegative: true,
	flexOrder: true,
	gridRow: true,
	gridColumn: true,
	fontWeight: true,
	lineClamp: true,
	lineHeight: true,
	opacity: true,
	order: true,
	orphans: true,
	tabSize: true,
	widows: true,
	zIndex: true,
	zoom: true,

	// SVG-related properties
	fillOpacity: true,
	stopOpacity: true,
	strokeDashoffset: true,
	strokeOpacity: true,
	strokeWidth: true
}


/**
 * Will add px to the end of style values which are Numbers.
 * @param name
 * @param value
 * @returns {*}
 */
export function addPx(name, value) {
	if(typeof value === 'number' && !IS_UNITLESS[ name ]) {
	return value + 'px'
	} else {
		return value;
	}
}


/**
 * Hyphenate a camelCase string.
 *
 * @param {String} str
 * @return {String}
 */

export var hyphenateRE = /([a-z\d])([A-Z])/g

export function hyphenate(str) {
	return str.replace(hyphenateRE, '$1-$2').toLowerCase()
}


export function findItemInArray(array, property, value) {
	for (var i=0; i < array.length; i++)
		if (array[i][property] == value)
			return true

	return false
}

export function findAndRemove(array, property, value) {
	array.forEach(function (result, index) {
		if (result[property] === value) {
			//Remove from array
			array.splice(index, 1)
		}
	})
}