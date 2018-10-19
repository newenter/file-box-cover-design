function hasWindow() {
	return (typeof window !== "undefined")
}

function hasDocument() {
	return (typeof document !== "undefined")
}

let currentDir = "auto"

export function getDocumentDir() {
	if (!hasDocument()) {
		return currentDir
	}
	return (typeof document.dir !== "undefined") ?
		document.dir :
		document.getElementsByTagName("html")[0].getAttribute("dir")
}

export function setDocumentDir(dir) {
	if (dir !== "ltr" && dir !== "rtl" && dir !== "auto") {
		return
	}
	if (!hasDocument) {
		currentDir = dir
		return
	}
	const html = document.getElementsByTagName("html")[0]
	html.setAttribute("dir", dir)
}
export function addWindowEventListener(event, callback) {
	if (!hasWindow) {
		return
	}
	window.addEventListener(event, callback)
}

export function removeWindowEventListener(event, callback) {
	if (!hasWindow) {
		return
	}
	window.removeEventListener(event, callback)
}