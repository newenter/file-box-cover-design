/**
 * Get {x, y} positions from event.
 * @param {Window.event} event 
 */
export function getControlPosition(event) {
	return offsetXYFromParentOf(event)
}

/**
 * Get from offsetParent
 * @param {Window.event} event 
 */
export function offsetXYFromParentOf(event) {
	const offsetParent  = event.target.offsetParent || document.body
	const offsetParentRect = event.offsetParent === document.body ?
		{ left: 0, top: 0} :
		offsetParent.getBoundingClientRect()

	const x = event.clientX + offsetParent.scrollLeft - offsetParentRect.left
	const y = event.clientY + offsetParent.scrollTop - offsetParentRect.top

	return {x, y}
}

/**
 * Create an data object exposed by <DraggableCore>'s events
 * @param {Number} lastX 
 * @param {Number} lastY 
 * @param {Number} x 
 * @param {Number} y 
 */
export function createCoreData(lastX, lastY, x, y) {
	// State changes are often (but not always!) async. We want the latest value.
	const isStart = !isNum(lastX)

	if (isStart) {
		// If this is our first move, use the x and y as last coords.
		return {
			deltaX: 0, deltaY: 0,
			lastX: x, lastY: y,
			x: x, y: y
		}
	} else {
		// Otherwise calculate proper values.
		return {
			deltaX: x - lastX, deltaY: y - lastY,
			lastX: lastX, lastY: lastY,
			x: x, y: y
		}
	}
}

function isNum(num) {
	return typeof num === 'number' && !isNaN(num)
}