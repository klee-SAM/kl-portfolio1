/* how to handle shelves
Requirements:
- Every section must be a "shelf" or "on the floor"
- By default, the contents of each section must be visible
    - All contents must be viewable if Javascript is disabled

Disregard:
- Screen readers

// commit to repo, then remove commented out code and this
*/

function getShelfDirection(elem) {
    for (const eleClass of elem.classList) {
        switch(eleClass) {
            case "top":
            case "right":
            case "bottom":
            case "left":
                return eleClass;
            default:
        }
    }
}

const capitalize = (str) => str.charAt(0).toUpperCase()+str.slice(1);

// used for extracting floating point numbers from CSS property-value pairs
function getNumericPropertyValue(obj, propStr) {
    // warning: very fragile and overcomplicated and horrid for maintainibility
    // https://www.tutorialspoint.com/extract-a-number-from-a-string-using-javascript
    return Number(obj[propStr].replace(/[^0-9\.]/g, ""));
}

function getBorderWidth(elem, direction) {
    switch(direction) {
        case "top":
        case "right":
        case "bottom":
        case "left":
            break;
        default:
            console.warn(direction, "is an invalid direction.")
            return 0;
    }
    compStyles = window.getComputedStyle(elem);

    return getNumericPropertyValue(compStyles, "border"+capitalize(direction)+"Width");
}

function setDraggableShelf(elem) {
    let dX = 0, dY = 0, cX = 0, cY = 0;
    let cTop = elem.offsetTop;
    let direction = getShelfDirection(elem);
    let timeout = false; // debounce
    const delay = 50; // ms

    let dim = elem.getBoundingClientRect();
    let winDim = elem.parentNode.getBoundingClientRect();
    let minLeftBound = dim.left;
    // let prevWinX = prevWinDim.width;
    // let prevWinY = prevWinDim.height;

    /* ONLY WORKS WHEN:
    * .shelf.left has a left rule
    * AND .shelf.right does not have a left rule (width instead)
    */
    function setOffsets(dWidth, dHeight) {
        // represents the other boundary of a shelf's draggable area based on its width
        dragTBBound = dim.height - getBorderWidth(elem, direction);
        dragLRBound = dim.width - getBorderWidth(elem, direction);

        switch(direction) {
            case "top":
            case "bottom":
                const isTop = direction == "top";
                // defined differently since only offsetTop is available, and
                // that is based off of offset from parent border, not itself
                elem.style.top = clamp(
                    elem.offsetTop - (isTop ? cTop : 0) - dHeight, 
                    isTop ? 0 : -dragTBBound, 
                    isTop ? dragTBBound : 0) + "px";
                break;
            case "right": 
            case "left":
                let maxBound = (direction == "right") ? 0 : (winDim.width - dim.width) + dragLRBound
                elem.style.left = clamp(
                    elem.offsetLeft - dWidth, 
                    direction == "right" ? -dragLRBound : minLeftBound, 
                    maxBound) + "px";
                break;
            default:
                console.warn("Attempted to drag draggable with undefined direction:", direction);
        }
    }

    const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

    elem.addEventListener("mousedown", mouseDown);
    elem.addEventListener("touchstart", touchStart, {passive: true});
    window.addEventListener("resize", () => {
        clearTimeout(timeout); 
        timeout = setTimeout(resizing, delay)
    });

    function resizing() {
        // parentDim = elem.parentNode.getBoundingClientRect();
        // let dWinX = parentDim.width - prevWinX;
        // let dWinY = parentDim.height - prevWinY; 
        // prevWinX = winDim.width;
        // prevWinY = parentDim.height;

        dim = elem.getBoundingClientRect();
        prevMinLeftBoundPercent = minLeftBound/winDim.width;

        winDim = elem.parentNode.getBoundingClientRect();
        minLeftBound = winDim.width * prevMinLeftBoundPercent;

        switch(direction) {
            case "top":
                // proper movement even when window is resized
                cTop = elem.offsetTop - getNumericPropertyValue(elem.style, "top");
               break;
            default:
                // setOffsets(-dWinX/2,dWinY/2);
                setOffsets(0,0) // reclamp to window
        }
    }

    function mouseDown(event) {
        event.preventDefault();
        cX = event.clientX;
        cY = event.clientY;

        document.addEventListener("mouseup", mouseUp);
        document.addEventListener("mousemove", dragging);
    }

    function touchStart(event) {
        cX = event.clientX;
        cY = event.clientY;

        document.addEventListener("touchend", touchEnd, {passive: false});
        document.addEventListener("touchcancel", touchEnd, {passive: false});
        document.addEventListener("touchmove", dragging, {passive: false});
    }

    function dragging(event) {
        event.preventDefault();
        updatePositions(event);
        setOffsets(dX, dY);
    }

    function updatePositions(event) {
        switch(event.type) {
            case "mousemove":
                dX = cX - event.clientX;
                dY = cY - event.clientY;
                cX = event.clientX;
                cY = event.clientY;
                break;
            case "touchmove":
                dX = cX - event.targetTouches[0].clientX;
                dY = cY - event.targetTouches[0].clientY;
                cX = event.targetTouches[0].clientX;
                cY = event.targetTouches[0].clientY;
                break;
            default:
        }
    }

    function mouseUp() {
        document.removeEventListener("mouseup", mouseUp);
        document.removeEventListener("mousemove", dragging);
    }

    function touchEnd() {
        document.removeEventListener("touchend", touchEnd);
        document.removeEventListener("touchcancel", touchEnd);
        document.removeEventListener("touchmove", dragging);
    }
}

const shelves = document.getElementsByClassName("shelf");
for (const shelf of shelves) {
    setDraggableShelf(shelf);
}