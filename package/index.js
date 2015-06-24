// Bobril.Core
var DEBUG;
if (typeof DEBUG === "undefined")
    DEBUG = true;
function assert(shoudBeTrue, messageIfFalse) {
    if (DEBUG && !shoudBeTrue)
        throw Error(messageIfFalse || "assertion failed");
}
var isArray = Array.isArray;
function createTextNode(content) {
    return document.createTextNode(content);
}
function createElement(name) {
    return document.createElement(name);
}
var hasTextContent = "textContent" in createTextNode("");
function isObject(value) {
    return typeof value === "object";
}
var inSvg = false;
var updateCall = [];
var updateInstance = [];
var setValueCallback = function (el, node, newValue, oldValue) {
    if (newValue !== oldValue)
        el["value"] = newValue;
};
function setSetValue(callback) {
    var prev = setValueCallback;
    setValueCallback = callback;
    return prev;
}
exports.setSetValue = setSetValue;
function newHashObj() {
    return Object.create(null);
}
var vendors = ["webkit", "Moz", "ms", "o"];
var testingDivStyle = document.createElement("div").style;
function testPropExistence(name) {
    return typeof testingDivStyle[name] === "string";
}
var mapping = newHashObj();
var isUnitlessNumber = {
    boxFlex: true,
    boxFlexGroup: true,
    columnCount: true,
    flex: true,
    flexGrow: true,
    flexNegative: true,
    flexPositive: true,
    flexShrink: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    strokeDashoffset: true,
    widows: true,
    zIndex: true,
    zoom: true,
};
function renamer(newName) {
    return function (style, value, oldName) {
        style[newName] = value;
        style[oldName] = undefined;
    };
}
;
function renamerpx(newName) {
    return function (style, value, oldName) {
        if (typeof value === "number") {
            style[newName] = value + "px";
        }
        else {
            style[newName] = value;
        }
        style[oldName] = undefined;
    };
}
function pxadder(style, value, name) {
    if (typeof value === "number")
        style[name] = value + "px";
}
function ieVersion() {
    return document.documentMode;
}
exports.ieVersion = ieVersion;
function shimStyle(newValue) {
    var k = Object.keys(newValue);
    for (var i = 0, l = k.length; i < l; i++) {
        var ki = k[i];
        var mi = mapping[ki];
        var vi = newValue[ki];
        if (vi === undefined)
            continue; // don't want to map undefined
        if (mi === undefined) {
            if (DEBUG) {
                if (ki === "float" && window.console && console.error)
                    console.error("In style instead of 'float' you have to use 'cssFloat'");
                if (/-/.test(ki) && window.console && console.warn)
                    console.warn("Style property " + ki + " contains dash (must use JS props instead of css names)");
            }
            if (testPropExistence(ki)) {
                mi = (isUnitlessNumber[ki] === true) ? null : pxadder;
            }
            else {
                var titleCaseKi = ki.replace(/^\w/, function (match) { return match.toUpperCase(); });
                for (var j = 0; j < vendors.length; j++) {
                    if (testPropExistence(vendors[j] + titleCaseKi)) {
                        mi = ((isUnitlessNumber[ki] === true) ? renamer : renamerpx)(vendors[j] + titleCaseKi);
                        break;
                    }
                }
                if (mi === undefined) {
                    mi = (isUnitlessNumber[ki] === true) ? null : pxadder;
                    if (DEBUG && window.console && console.warn)
                        console.warn("Style property " + ki + " is not supported in this browser");
                }
            }
            mapping[ki] = mi;
        }
        if (mi !== null)
            mi(newValue, vi, ki);
    }
}
function removeProperty(s, name) {
    s[name] = "";
}
function updateStyle(n, el, newStyle, oldStyle) {
    var s = el.style;
    if (isObject(newStyle)) {
        shimStyle(newStyle);
        var rule;
        if (isObject(oldStyle)) {
            for (rule in oldStyle) {
                if (!(rule in newStyle))
                    removeProperty(s, rule);
            }
            for (rule in newStyle) {
                var v = newStyle[rule];
                if (v !== undefined) {
                    if (oldStyle[rule] !== v)
                        s[rule] = v;
                }
                else {
                    removeProperty(s, rule);
                }
            }
        }
        else {
            if (oldStyle)
                s.cssText = "";
            for (rule in newStyle) {
                var v = newStyle[rule];
                if (v !== undefined)
                    s[rule] = v;
            }
        }
    }
    else if (newStyle) {
        s.cssText = newStyle;
    }
    else {
        if (isObject(oldStyle)) {
            for (rule in oldStyle) {
                removeProperty(s, rule);
            }
        }
        else if (oldStyle) {
            s.cssText = "";
        }
    }
}
function setClassName(el, className) {
    if (inSvg)
        el.setAttribute("class", className);
    else
        el.className = className;
}
function updateElement(n, el, newAttrs, oldAttrs) {
    var attrName, newAttr, oldAttr, valueOldAttr, valueNewAttr;
    for (attrName in newAttrs) {
        newAttr = newAttrs[attrName];
        oldAttr = oldAttrs[attrName];
        if (attrName === "value" && !inSvg) {
            valueOldAttr = oldAttr;
            valueNewAttr = newAttr;
            oldAttrs[attrName] = newAttr;
            continue;
        }
        if (oldAttr !== newAttr) {
            oldAttrs[attrName] = newAttr;
            if (inSvg) {
                if (attrName === "href")
                    el.setAttributeNS("http://www.w3.org/1999/xlink", "href", newAttr);
                else
                    el.setAttribute(attrName, newAttr);
            }
            else if (attrName in el && !(attrName === "list" || attrName === "form")) {
                el[attrName] = newAttr;
            }
            else
                el.setAttribute(attrName, newAttr);
        }
    }
    for (attrName in oldAttrs) {
        if (oldAttrs[attrName] !== undefined && !(attrName in newAttrs)) {
            oldAttrs[attrName] = undefined;
            el.removeAttribute(attrName);
        }
    }
    if (valueNewAttr !== undefined) {
        setValueCallback(el, n, valueNewAttr, valueOldAttr);
    }
    return oldAttrs;
}
function pushInitCallback(c, aupdate) {
    var cc = c.component;
    if (cc) {
        if (cc[aupdate ? "postUpdateDom" : "postInitDom"]) {
            updateCall.push(aupdate);
            updateInstance.push(c);
        }
    }
}
function findCfg(parent) {
    var cfg;
    while (parent) {
        cfg = parent.cfg;
        if (cfg !== undefined)
            break;
        if (parent.ctx) {
            cfg = parent.ctx.cfg;
            break;
        }
        parent = parent.parent;
    }
    return cfg;
}
function setRef(ref, value) {
    if (ref == null)
        return;
    if (typeof ref === "function") {
        ref(value);
        return;
    }
    var ctx = ref[0];
    var refs = ctx.refs;
    if (!refs) {
        refs = newHashObj();
        ctx.refs = refs;
    }
    refs[ref[1]] = value;
}
function createNode(n, parentNode, createInto, createBefore) {
    var c = {
        tag: n.tag,
        key: n.key,
        ref: n.ref,
        className: n.className,
        style: n.style,
        attrs: n.attrs,
        children: n.children,
        component: n.component,
        data: n.data,
        cfg: n.cfg,
        parent: parentNode,
        element: undefined,
        ctx: undefined
    };
    var backupInSvg = inSvg;
    var component = c.component;
    var el;
    setRef(c.ref, c);
    if (component) {
        var ctx = { data: c.data || {}, me: c, cfg: findCfg(parentNode) };
        c.ctx = ctx;
        if (component.init) {
            component.init(ctx, c);
        }
        if (component.render) {
            component.render(ctx, c);
        }
    }
    var tag = c.tag;
    var children = c.children;
    if (tag === undefined) {
        if (typeof children === "string") {
            el = createTextNode(children);
            c.element = el;
            createInto.insertBefore(el, createBefore);
        }
        else {
            createChildren(c, createInto, createBefore);
        }
        if (component) {
            if (component.postRender) {
                component.postRender(c.ctx, c);
            }
        }
        return c;
    }
    else if (tag === "/") {
        var htmltext = children;
        if (htmltext === "") {
        }
        else if (createBefore == null) {
            var before = createInto.lastChild;
            createInto.insertAdjacentHTML("beforeend", htmltext);
            c.element = [];
            if (before) {
                before = before.nextSibling;
            }
            else {
                before = createInto.firstChild;
            }
            while (before) {
                c.element.push(before);
                before = before.nextSibling;
            }
        }
        else {
            el = createBefore;
            var elprev = createBefore.previousSibling;
            var removeEl = false;
            var parent = createInto;
            if (!el.insertAdjacentHTML) {
                el = parent.insertBefore(createElement("i"), el);
                removeEl = true;
            }
            el.insertAdjacentHTML("beforebegin", htmltext);
            if (elprev) {
                elprev = elprev.nextSibling;
            }
            else {
                elprev = parent.firstChild;
            }
            var newElements = [];
            while (elprev !== el) {
                newElements.push(elprev);
                elprev = elprev.nextSibling;
            }
            n.element = newElements;
            if (removeEl) {
                parent.removeChild(el);
            }
        }
        if (component) {
            if (component.postRender) {
                component.postRender(c.ctx, c);
            }
        }
        return c;
    }
    else if (inSvg || tag === "svg") {
        el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        inSvg = true;
    }
    else if (!el) {
        el = createElement(tag);
    }
    createInto.insertBefore(el, createBefore);
    c.element = el;
    createChildren(c, el, null);
    if (component) {
        if (component.postRender) {
            component.postRender(c.ctx, c);
        }
    }
    if (c.attrs)
        c.attrs = updateElement(c, el, c.attrs, {});
    if (c.style)
        updateStyle(c, el, c.style, undefined);
    var className = c.className;
    if (className)
        setClassName(el, className);
    inSvg = backupInSvg;
    pushInitCallback(c, false);
    return c;
}
exports.createNode = createNode;
function normalizeNode(n) {
    var t = typeof n;
    if (t === "string") {
        return { children: n };
    }
    if (t === "boolean")
        return null;
    return n;
}
function createChildren(c, createInto, createBefore) {
    var ch = c.children;
    if (!ch)
        return;
    if (!isArray(ch)) {
        if (typeof ch === "string") {
            if (hasTextContent) {
                createInto.textContent = ch;
            }
            else {
                createInto.innerText = ch;
            }
            return;
        }
        ch = [ch];
    }
    ch = ch.slice(0);
    var i = 0, l = ch.length;
    while (i < l) {
        var item = ch[i];
        if (isArray(item)) {
            ch.splice.apply(ch, [i, 1].concat(item));
            l = ch.length;
            continue;
        }
        item = normalizeNode(item);
        if (item == null) {
            ch.splice(i, 1);
            l--;
            continue;
        }
        var j = ch[i] = createNode(item, c, createInto, createBefore);
        i++;
    }
    c.children = ch;
}
function destroyNode(c) {
    setRef(c.ref, null);
    var ch = c.children;
    if (isArray(ch)) {
        for (var i = 0, l = ch.length; i < l; i++) {
            destroyNode(ch[i]);
        }
    }
    var component = c.component;
    if (component) {
        if (component.destroy)
            component.destroy(c.ctx, c, c.element);
    }
}
function removeNodeRecursive(c) {
    var el = c.element;
    if (isArray(el)) {
        var pa = el[0].parentNode;
        if (pa) {
            for (var i = 0; i < el.length; i++) {
                pa.removeChild(el[i]);
            }
        }
    }
    else if (el != null) {
        var p = el.parentNode;
        if (p)
            p.removeChild(el);
    }
    else {
        var ch = c.children;
        if (isArray(ch)) {
            for (var i = 0, l = ch.length; i < l; i++) {
                removeNodeRecursive(ch[i]);
            }
        }
    }
}
function removeNode(c) {
    destroyNode(c);
    removeNodeRecursive(c);
}
var roots = Object.create(null);
function nodeContainsNode(c, n, resIndex, res) {
    var el = c.element;
    var ch = c.children;
    if (isArray(el)) {
        for (var ii = 0; ii < el.length; ii++) {
            if (el[ii] === n) {
                res.push(c);
                if (isArray(ch)) {
                    return ch;
                }
                return null;
            }
        }
    }
    else if (el == null) {
        if (isArray(ch)) {
            for (var i = 0; i < ch.length; i++) {
                var result = nodeContainsNode(ch[i], n, resIndex, res);
                if (result !== undefined) {
                    res.splice(resIndex, 0, c);
                    return result;
                }
            }
        }
    }
    else if (el === n) {
        res.push(c);
        if (isArray(ch)) {
            return ch;
        }
        return null;
    }
    return undefined;
}
function vdomPath(n) {
    var res = [];
    if (n == null)
        return res;
    var rootIds = Object.keys(roots);
    var rootElements = rootIds.map(function (i) { return roots[i].e || document.body; });
    var nodeStack = [];
    rootFound: while (n) {
        for (var j = 0; j < rootElements.length; j++) {
            if (n === rootElements[j])
                break rootFound;
        }
        nodeStack.push(n);
        n = n.parentNode;
    }
    if (!n || nodeStack.length === 0)
        return res;
    var currentCacheArray = null;
    var currentNode = nodeStack.pop();
    rootFound2: for (j = 0; j < rootElements.length; j++) {
        if (n === rootElements[j]) {
            var rc = roots[rootIds[j]].c;
            for (var k = 0; k < rc.length; k++) {
                var rck = rc[k];
                var findResult = nodeContainsNode(rck, currentNode, res.length, res);
                if (findResult !== undefined) {
                    currentCacheArray = findResult;
                    break rootFound2;
                }
            }
        }
    }
    while (nodeStack.length) {
        currentNode = nodeStack.pop();
        if (currentCacheArray && currentCacheArray.length)
            for (var i = 0, l = currentCacheArray.length; i < l; i++) {
                var bn = currentCacheArray[i];
                var findResult = nodeContainsNode(bn, currentNode, res.length, res);
                if (findResult !== undefined) {
                    currentCacheArray = findResult;
                    currentNode = null;
                    break;
                }
            }
        if (currentNode) {
            res.push(null);
            break;
        }
    }
    return res;
}
exports.vdomPath = vdomPath;
function deref(n) {
    var s = vdomPath(n);
    if (s.length == 0)
        return null;
    return s[s.length - 1];
}
exports.deref = deref;
function finishUpdateNode(n, c, component) {
    if (component) {
        if (component.postRender) {
            component.postRender(c.ctx, n, c);
        }
    }
    c.data = n.data;
    pushInitCallback(c, true);
}
function updateNode(n, c, createInto, createBefore, deepness) {
    var component = n.component;
    var backupInSvg = inSvg;
    var bigChange = false;
    var ctx = c.ctx;
    if (component && ctx != null) {
        if (ctx[ctxInvalidated] === frameCounter) {
            deepness = Math.max(deepness, ctx[ctxDeepness]);
        }
        if (component.id !== c.component.id) {
            bigChange = true;
        }
        else {
            if (c.parent != undefined)
                ctx.cfg = findCfg(c.parent);
            if (component.shouldChange)
                if (!component.shouldChange(ctx, n, c))
                    return c;
            ctx.data = n.data || {};
            c.component = component;
            if (component.render)
                component.render(ctx, n, c);
            c.cfg = n.cfg;
        }
    }
    if (DEBUG) {
        if (!((n.ref == null && c.ref == null) ||
            ((n.ref != null && c.ref != null && (typeof n.ref === "function" || typeof c.ref === "function" ||
                n.ref[0] === c.ref[0] && n.ref[1] === c.ref[1]))))) {
            if (window.console && console.warn)
                console.warn("ref changed in child in update");
        }
    }
    var newChildren = n.children;
    var cachedChildren = c.children;
    var tag = n.tag;
    if (bigChange || (component && ctx == null)) {
    }
    else if (tag === "/") {
        if (c.tag === "/" && cachedChildren === newChildren) {
            finishUpdateNode(n, c, component);
            return c;
        }
    }
    else if (tag === c.tag) {
        if (tag === undefined) {
            if (typeof newChildren === "string" && typeof cachedChildren === "string") {
                if (newChildren !== cachedChildren) {
                    var el = c.element;
                    if (hasTextContent) {
                        el.textContent = newChildren;
                    }
                    else {
                        el.nodeValue = newChildren;
                    }
                    c.children = newChildren;
                }
            }
            else {
                if (deepness <= 0) {
                    if (isArray(cachedChildren))
                        selectedUpdate(c.children, createInto, createBefore);
                }
                else {
                    c.children = updateChildren(createInto, newChildren, cachedChildren, c, createBefore, deepness - 1);
                }
            }
            finishUpdateNode(n, c, component);
            return c;
        }
        else {
            if (tag === "svg") {
                inSvg = true;
            }
            var el = c.element;
            if ((typeof newChildren === "string") && !isArray(cachedChildren)) {
                if (newChildren !== cachedChildren) {
                    if (hasTextContent) {
                        el.textContent = newChildren;
                    }
                    else {
                        el.innerText = newChildren;
                    }
                    cachedChildren = newChildren;
                }
            }
            else {
                if (deepness <= 0) {
                    if (isArray(cachedChildren))
                        selectedUpdate(c.children, el, createBefore);
                }
                else {
                    cachedChildren = updateChildren(el, newChildren, cachedChildren, c, null, deepness - 1);
                }
            }
            c.children = cachedChildren;
            finishUpdateNode(n, c, component);
            if (c.attrs || n.attrs)
                c.attrs = updateElement(c, el, n.attrs || {}, c.attrs || {});
            updateStyle(c, el, n.style, c.style);
            c.style = n.style;
            var className = n.className;
            if (className !== c.className) {
                setClassName(el, className || "");
                c.className = className;
            }
            inSvg = backupInSvg;
            return c;
        }
    }
    var parEl = c.element;
    if (isArray(parEl))
        parEl = parEl[0];
    if (parEl == null)
        parEl = createInto;
    else
        parEl = parEl.parentNode;
    var r = createNode(n, c.parent, parEl, getDomNode(c));
    removeNode(c);
    return r;
}
exports.updateNode = updateNode;
function getDomNode(c) {
    var el = c.element;
    if (el != null) {
        if (isArray(el))
            return el[0];
        return el;
    }
    var ch = c.children;
    if (!isArray(ch))
        return null;
    for (var i = 0; i < ch.length; i++) {
        el = getDomNode(ch[i]);
        if (el)
            return el;
    }
    return null;
}
exports.getDomNode = getDomNode;
function findNextNode(a, i, len, def) {
    while (++i < len) {
        var ai = a[i];
        if (ai == null)
            continue;
        var n = getDomNode(ai);
        if (n != null)
            return n;
    }
    return def;
}
function callPostCallbacks() {
    var count = updateInstance.length;
    for (var i = 0; i < count; i++) {
        var n = updateInstance[i];
        if (updateCall[i]) {
            n.component.postUpdateDom(n.ctx, n, n.element);
        }
        else {
            n.component.postInitDom(n.ctx, n, n.element);
        }
    }
    updateCall = [];
    updateInstance = [];
}
exports.callPostCallbacks = callPostCallbacks;
function updateNodeInUpdateChildren(newNode, cachedChildren, cachedIndex, cachedLength, createBefore, element, deepness) {
    cachedChildren[cachedIndex] = updateNode(newNode, cachedChildren[cachedIndex], element, findNextNode(cachedChildren, cachedIndex, cachedLength, createBefore), deepness);
}
function reorderInUpdateChildrenRec(c, element, before) {
    var el = c.element;
    if (el != null) {
        if (isArray(el)) {
            for (var i = 0; i < el.length; i++) {
                element.insertBefore(el[i], before);
            }
        }
        else
            element.insertBefore(el, before);
        return;
    }
    var ch = c.children;
    if (!isArray(ch))
        return null;
    for (var i = 0; i < ch.length; i++) {
        reorderInUpdateChildrenRec(ch[i], element, before);
    }
}
function reorderInUpdateChildren(cachedChildren, cachedIndex, cachedLength, createBefore, element) {
    var before = findNextNode(cachedChildren, cachedIndex, cachedLength, createBefore);
    var cur = cachedChildren[cachedIndex];
    var what = getDomNode(cur);
    if (what != null && what !== before) {
        reorderInUpdateChildrenRec(cur, element, before);
    }
}
function reorderAndUpdateNodeInUpdateChildren(newNode, cachedChildren, cachedIndex, cachedLength, createBefore, element, deepness) {
    var before = findNextNode(cachedChildren, cachedIndex, cachedLength, createBefore);
    var cur = cachedChildren[cachedIndex];
    var what = getDomNode(cur);
    if (what != null && what !== before) {
        reorderInUpdateChildrenRec(cur, element, before);
    }
    cachedChildren[cachedIndex] = updateNode(newNode, cur, element, before, deepness);
}
function updateChildren(element, newChildren, cachedChildren, parentNode, createBefore, deepness) {
    if (newChildren == null)
        newChildren = [];
    if (!isArray(newChildren)) {
        newChildren = [newChildren];
    }
    if (cachedChildren == null)
        cachedChildren = [];
    if (!isArray(cachedChildren)) {
        if (element.firstChild)
            element.removeChild(element.firstChild);
        cachedChildren = [];
    }
    newChildren = newChildren.slice(0);
    var newLength = newChildren.length;
    var cachedLength = cachedChildren.length;
    var newIndex;
    for (newIndex = 0; newIndex < newLength;) {
        var item = newChildren[newIndex];
        if (isArray(item)) {
            newChildren.splice.apply(newChildren, [newIndex, 1].concat(item));
            newLength = newChildren.length;
            continue;
        }
        item = normalizeNode(item);
        if (item == null) {
            newChildren.splice(newIndex, 1);
            newLength--;
            continue;
        }
        newChildren[newIndex] = item;
        newIndex++;
    }
    var newEnd = newLength;
    var cachedEnd = cachedLength;
    newIndex = 0;
    var cachedIndex = 0;
    while (newIndex < newEnd && cachedIndex < cachedEnd) {
        if (newChildren[newIndex].key === cachedChildren[cachedIndex].key) {
            updateNodeInUpdateChildren(newChildren[newIndex], cachedChildren, cachedIndex, cachedLength, createBefore, element, deepness);
            newIndex++;
            cachedIndex++;
            continue;
        }
        while (true) {
            if (newChildren[newEnd - 1].key === cachedChildren[cachedEnd - 1].key) {
                newEnd--;
                cachedEnd--;
                updateNodeInUpdateChildren(newChildren[newEnd], cachedChildren, cachedEnd, cachedLength, createBefore, element, deepness);
                if (newIndex < newEnd && cachedIndex < cachedEnd)
                    continue;
            }
            break;
        }
        if (newIndex < newEnd && cachedIndex < cachedEnd) {
            if (newChildren[newIndex].key === cachedChildren[cachedEnd - 1].key) {
                cachedChildren.splice(cachedIndex, 0, cachedChildren[cachedEnd - 1]);
                cachedChildren.splice(cachedEnd, 1);
                reorderAndUpdateNodeInUpdateChildren(newChildren[newIndex], cachedChildren, cachedIndex, cachedLength, createBefore, element, deepness);
                newIndex++;
                cachedIndex++;
                continue;
            }
            if (newChildren[newEnd - 1].key === cachedChildren[cachedIndex].key) {
                cachedChildren.splice(cachedEnd, 0, cachedChildren[cachedIndex]);
                cachedChildren.splice(cachedIndex, 1);
                cachedEnd--;
                newEnd--;
                reorderAndUpdateNodeInUpdateChildren(newChildren[newEnd], cachedChildren, cachedEnd, cachedLength, createBefore, element, deepness);
                continue;
            }
        }
        break;
    }
    if (cachedIndex === cachedEnd) {
        if (newIndex === newEnd) {
            return cachedChildren;
        }
        // Only work left is to add new nodes
        while (newIndex < newEnd) {
            cachedChildren.splice(cachedIndex, 0, createNode(newChildren[newIndex], parentNode, element, findNextNode(cachedChildren, cachedIndex - 1, cachedLength, createBefore)));
            cachedIndex++;
            cachedEnd++;
            cachedLength++;
            newIndex++;
        }
        return cachedChildren;
    }
    if (newIndex === newEnd) {
        // Only work left is to remove old nodes
        while (cachedIndex < cachedEnd) {
            cachedEnd--;
            removeNode(cachedChildren[cachedEnd]);
            cachedChildren.splice(cachedEnd, 1);
        }
        return cachedChildren;
    }
    // order of keyed nodes ware changed => reorder keyed nodes first
    var cachedKeys = newHashObj();
    var newKeys = newHashObj();
    var key;
    var node;
    var backupNewIndex = newIndex;
    var backupCachedIndex = cachedIndex;
    var deltaKeyless = 0;
    for (; cachedIndex < cachedEnd; cachedIndex++) {
        node = cachedChildren[cachedIndex];
        key = node.key;
        if (key != null) {
            assert(!(key in cachedKeys));
            cachedKeys[key] = cachedIndex;
        }
        else
            deltaKeyless--;
    }
    var keyLess = -deltaKeyless - deltaKeyless;
    for (; newIndex < newEnd; newIndex++) {
        node = newChildren[newIndex];
        key = node.key;
        if (key != null) {
            assert(!(key in newKeys));
            newKeys[key] = newIndex;
        }
        else
            deltaKeyless++;
    }
    keyLess += deltaKeyless;
    var delta = 0;
    newIndex = backupNewIndex;
    cachedIndex = backupCachedIndex;
    var cachedKey;
    while (cachedIndex < cachedEnd && newIndex < newEnd) {
        if (cachedChildren[cachedIndex] === null) {
            cachedChildren.splice(cachedIndex, 1);
            cachedEnd--;
            cachedLength--;
            delta--;
            continue;
        }
        cachedKey = cachedChildren[cachedIndex].key;
        if (cachedKey == null) {
            cachedIndex++;
            continue;
        }
        key = newChildren[newIndex].key;
        if (key == null) {
            newIndex++;
            while (newIndex < newEnd) {
                key = newChildren[newIndex].key;
                if (key != null)
                    break;
                newIndex++;
            }
            if (key == null)
                break;
        }
        var akpos = cachedKeys[key];
        if (akpos === undefined) {
            // New key
            cachedChildren.splice(cachedIndex, 0, createNode(newChildren[newIndex], parentNode, element, findNextNode(cachedChildren, cachedIndex - 1, cachedLength, createBefore)));
            delta++;
            newIndex++;
            cachedIndex++;
            cachedEnd++;
            cachedLength++;
            continue;
        }
        if (!(cachedKey in newKeys)) {
            // Old key
            removeNode(cachedChildren[cachedIndex]);
            cachedChildren.splice(cachedIndex, 1);
            delta--;
            cachedEnd--;
            cachedLength--;
            continue;
        }
        if (cachedIndex === akpos + delta) {
            // Inplace update
            updateNodeInUpdateChildren(newChildren[newIndex], cachedChildren, cachedIndex, cachedLength, createBefore, element, deepness);
            newIndex++;
            cachedIndex++;
        }
        else {
            // Move
            cachedChildren.splice(cachedIndex, 0, cachedChildren[akpos + delta]);
            delta++;
            cachedChildren[akpos + delta] = null;
            reorderAndUpdateNodeInUpdateChildren(newChildren[newIndex], cachedChildren, cachedIndex, cachedLength, createBefore, element, deepness);
            cachedIndex++;
            cachedEnd++;
            cachedLength++;
            newIndex++;
        }
    }
    // remove old keyed cached nodes
    while (cachedIndex < cachedEnd) {
        if (cachedChildren[cachedIndex] === null) {
            cachedChildren.splice(cachedIndex, 1);
            cachedEnd--;
            cachedLength--;
            continue;
        }
        if (cachedChildren[cachedIndex].key != null) {
            removeNode(cachedChildren[cachedIndex]);
            cachedChildren.splice(cachedIndex, 1);
            cachedEnd--;
            cachedLength--;
            continue;
        }
        cachedIndex++;
    }
    // add new keyed nodes
    while (newIndex < newEnd) {
        key = newChildren[newIndex].key;
        if (key != null) {
            cachedChildren.splice(cachedIndex, 0, createNode(newChildren[newIndex], parentNode, element, findNextNode(cachedChildren, cachedIndex - 1, cachedLength, createBefore)));
            cachedEnd++;
            cachedLength++;
            delta++;
            cachedIndex++;
        }
        newIndex++;
    }
    // Without any keyless nodes we are done
    if (!keyLess)
        return cachedChildren;
    // calculate common (old and new) keyless
    keyLess = (keyLess - Math.abs(deltaKeyless)) >> 1;
    // reorder just nonkeyed nodes
    newIndex = backupNewIndex;
    cachedIndex = backupCachedIndex;
    while (newIndex < newEnd) {
        if (cachedIndex < cachedEnd) {
            cachedKey = cachedChildren[cachedIndex].key;
            if (cachedKey != null) {
                cachedIndex++;
                continue;
            }
        }
        key = newChildren[newIndex].key;
        if (newIndex < cachedEnd && key === cachedChildren[newIndex].key) {
            if (key != null) {
                newIndex++;
                continue;
            }
            updateNodeInUpdateChildren(newChildren[newIndex], cachedChildren, newIndex, cachedLength, createBefore, element, deepness);
            keyLess--;
            newIndex++;
            cachedIndex = newIndex;
            continue;
        }
        if (key != null) {
            assert(newIndex === cachedIndex);
            if (keyLess === 0 && deltaKeyless < 0) {
                while (true) {
                    removeNode(cachedChildren[cachedIndex]);
                    cachedChildren.splice(cachedIndex, 1);
                    cachedEnd--;
                    cachedLength--;
                    deltaKeyless++;
                    assert(cachedIndex !== cachedEnd, "there still need to exist key node");
                    if (cachedChildren[cachedIndex].key != null)
                        break;
                }
                continue;
            }
            while (cachedChildren[cachedIndex].key == null)
                cachedIndex++;
            assert(key === cachedChildren[cachedIndex].key);
            cachedChildren.splice(newIndex, 0, cachedChildren[cachedIndex]);
            cachedChildren.splice(cachedIndex + 1, 1);
            reorderInUpdateChildren(cachedChildren, newIndex, cachedLength, createBefore, element);
            // just moving keyed node it was already updated before
            newIndex++;
            cachedIndex = newIndex;
            continue;
        }
        if (cachedIndex < cachedEnd) {
            cachedChildren.splice(newIndex, 0, cachedChildren[cachedIndex]);
            cachedChildren.splice(cachedIndex + 1, 1);
            reorderAndUpdateNodeInUpdateChildren(newChildren[newIndex], cachedChildren, newIndex, cachedLength, createBefore, element, deepness);
            keyLess--;
            newIndex++;
            cachedIndex++;
        }
        else {
            cachedChildren.splice(newIndex, 0, createNode(newChildren[newIndex], parentNode, element, findNextNode(cachedChildren, newIndex - 1, cachedLength, createBefore)));
            cachedEnd++;
            cachedLength++;
            newIndex++;
            cachedIndex++;
        }
    }
    while (cachedEnd > newIndex) {
        cachedEnd--;
        removeNode(cachedChildren[cachedEnd]);
        cachedChildren.splice(cachedEnd, 1);
    }
    return cachedChildren;
}
exports.updateChildren = updateChildren;
var hasNativeRaf = false;
var nativeRaf = window.requestAnimationFrame;
if (nativeRaf) {
    nativeRaf(function (param) { if (param === +param)
        hasNativeRaf = true; });
}
exports.now = Date.now || (function () { return (new Date).getTime(); });
var startTime = exports.now();
var lastTickTime = 0;
function requestAnimationFrame(callback) {
    if (hasNativeRaf) {
        nativeRaf(callback);
    }
    else {
        var delay = 50 / 3 + lastTickTime - exports.now();
        if (delay < 0)
            delay = 0;
        window.setTimeout(function () {
            lastTickTime = exports.now();
            callback(lastTickTime - startTime);
        }, delay);
    }
}
var ctxInvalidated = "$invalidated";
var ctxDeepness = "$deepness";
var fullRecreateRequested = false;
var scheduled = false;
var uptimeMs = 0;
var frameCounter = 0;
var lastFrameDurationMs = 0;
var renderFrameBegin = 0;
var regEvents = {};
var registryEvents = {};
function addEvent(name, priority, callback) {
    var list = registryEvents[name] || [];
    list.push({ priority: priority, callback: callback });
    registryEvents[name] = list;
}
exports.addEvent = addEvent;
function emitEvent(name, ev, target, node) {
    var events = regEvents[name];
    if (events)
        for (var i = 0; i < events.length; i++) {
            if (events[i](ev, target, node))
                return true;
        }
    return false;
}
exports.emitEvent = emitEvent;
function addListener(el, name) {
    if (name[0] == "!")
        return;
    var capture = (name[0] == "^");
    var eventName = name;
    if (capture) {
        eventName = name.slice(1);
    }
    function enhanceEvent(ev) {
        ev = ev || window.event;
        var t = ev.target || ev.srcElement || el;
        var n = deref(t);
        emitEvent(name, ev, t, n);
    }
    if (("on" + eventName) in window)
        el = window;
    el.addEventListener(eventName, enhanceEvent, capture);
}
var eventsCaptured = false;
function initEvents() {
    if (eventsCaptured)
        return;
    eventsCaptured = true;
    var eventNames = Object.keys(registryEvents);
    for (var j = 0; j < eventNames.length; j++) {
        var eventName = eventNames[j];
        var arr = registryEvents[eventName];
        arr = arr.sort(function (a, b) { return a.priority - b.priority; });
        regEvents[eventName] = arr.map(function (v) { return v.callback; });
    }
    registryEvents = null;
    var body = document.body;
    for (var i = 0; i < eventNames.length; i++) {
        addListener(body, eventNames[i]);
    }
}
function selectedUpdate(cache, element, createBefore) {
    var len = cache.length;
    for (var i = 0; i < len; i++) {
        var node = cache[i];
        var ctx = node.ctx;
        if (ctx != null && ctx[ctxInvalidated] === frameCounter) {
            var cloned = { data: ctx.data, component: node.component };
            cache[i] = updateNode(cloned, node, element, createBefore, ctx[ctxDeepness]);
        }
        else if (isArray(node.children)) {
            var backupInSvg = inSvg;
            if (node.tag === "svg")
                inSvg = true;
            selectedUpdate(node.children, node.element || element, findNextNode(cache, i, len, createBefore));
            inSvg = backupInSvg;
        }
    }
}
var beforeFrameCallback = function () { };
var afterFrameCallback = function () { };
function setBeforeFrame(callback) {
    var res = beforeFrameCallback;
    beforeFrameCallback = callback;
    return res;
}
exports.setBeforeFrame = setBeforeFrame;
function setAfterFrame(callback) {
    var res = afterFrameCallback;
    afterFrameCallback = callback;
    return res;
}
exports.setAfterFrame = setAfterFrame;
function findLastNode(children) {
    for (var i = children.length - 1; i >= 0; i--) {
        var c = children[i];
        var el = c.element;
        if (el != null) {
            if (isArray(el)) {
                var l = el.length;
                if (l === 0)
                    continue;
                return el[l - 1];
            }
            return el;
        }
        var ch = c.children;
        if (!isArray(ch))
            continue;
        var res = findLastNode(ch);
        if (res != null)
            return res;
    }
    return null;
}
function update(time) {
    renderFrameBegin = exports.now();
    initEvents();
    frameCounter++;
    uptimeMs = time;
    scheduled = false;
    beforeFrameCallback();
    var fullRefresh = false;
    if (fullRecreateRequested) {
        fullRecreateRequested = false;
        fullRefresh = true;
    }
    var rootIds = Object.keys(roots);
    for (var i = 0; i < rootIds.length; i++) {
        var r = roots[rootIds[i]];
        if (!r)
            continue;
        var rc = r.c;
        var insertBefore = findLastNode(rc);
        if (insertBefore != null)
            insertBefore = insertBefore.nextSibling;
        if (fullRefresh) {
            var newChildren = r.f();
            r.e = r.e || document.body;
            r.c = updateChildren(r.e, newChildren, rc, null, insertBefore, 1e6);
        }
        else {
            selectedUpdate(rc, r.e, insertBefore);
        }
    }
    callPostCallbacks();
    afterFrameCallback(roots["0"].c);
    lastFrameDurationMs = exports.now() - renderFrameBegin;
}
function invalidate(ctx, deepness) {
    if (fullRecreateRequested)
        return;
    if (ctx != null) {
        if (deepness == undefined)
            deepness = 1e6;
        if (ctx[ctxInvalidated] !== frameCounter + 1) {
            ctx[ctxInvalidated] = frameCounter + 1;
            ctx[ctxDeepness] = deepness;
        }
        else {
            if (deepness > ctx[ctxDeepness])
                ctx[ctxDeepness] = deepness;
        }
    }
    else {
        fullRecreateRequested = true;
    }
    if (scheduled)
        return;
    scheduled = true;
    requestAnimationFrame(update);
}
exports.invalidate = invalidate;
var lastRootId = 0;
function addRoot(factory, element) {
    lastRootId++;
    var rootId = "" + lastRootId;
    roots[rootId] = { f: factory, e: element, c: [] };
    invalidate();
    return rootId;
}
exports.addRoot = addRoot;
function removeRoot(id) {
    var root = roots[id];
    if (!root)
        return;
    if (root.c.length) {
        root.c = updateChildren(root.e, [], root.c, null, null, 1e9);
    }
    delete roots[id];
}
exports.removeRoot = removeRoot;
function getRoots() {
    return roots;
}
exports.getRoots = getRoots;
function init(factory, element) {
    removeRoot("0");
    roots["0"] = { f: factory, e: element, c: [] };
    invalidate();
}
exports.init = init;
function bubble(node, name, param) {
    while (node) {
        var c = node.component;
        if (c) {
            var ctx = node.ctx;
            var m = c[name];
            if (m) {
                if (m.call(c, ctx, param))
                    return ctx;
            }
            m = c.shouldStopBubble;
            if (m) {
                if (m.call(c, ctx, name, param))
                    break;
            }
        }
        node = node.parent;
    }
    return null;
}
exports.bubble = bubble;
function broadcastEventToNode(node, name, param) {
    if (!node)
        return null;
    var c = node.component;
    if (c) {
        var ctx = node.ctx;
        var m = c[name];
        if (m) {
            if (m.call(c, ctx, param))
                return ctx;
        }
        m = c.shouldStopBroadcast;
        if (m) {
            if (m.call(c, ctx, name, param))
                return null;
        }
    }
    var ch = node.children;
    if (isArray(ch)) {
        for (var i = 0; i < ch.length; i++) {
            var res = broadcastEventToNode(ch[i], name, param);
            if (res != null)
                return res;
        }
    }
    else {
        return broadcastEventToNode(ch, name, param);
    }
}
function broadcast(name, param) {
    var k = Object.keys(roots);
    for (var i = 0; i < k.length; i++) {
        var ch = roots[k[i]].c;
        if (ch != null) {
            for (var j = 0; j < ch.length; j++) {
                var res = broadcastEventToNode(ch[j], name, param);
                if (res != null)
                    return res;
            }
        }
    }
    return null;
}
exports.broadcast = broadcast;
function merge(f1, f2) {
    var _this = this;
    return function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i - 0] = arguments[_i];
        }
        var result = f1.apply(_this, params);
        if (result)
            return result;
        return f2.apply(_this, params);
    };
}
var emptyObject = {};
function mergeComponents(c1, c2) {
    var res = Object.create(c1);
    for (var i in c2) {
        if (!(i in emptyObject)) {
            var m = c2[i];
            var origM = c1[i];
            if (i === "id") {
                res[i] = ((origM != null) ? origM : "") + "/" + m;
            }
            else if (typeof m === "function" && origM != null && typeof origM === "function") {
                res[i] = merge(origM, m);
            }
            else {
                res[i] = m;
            }
        }
    }
    return res;
}
function preEnhance(node, methods) {
    var comp = node.component;
    if (!comp) {
        node.component = methods;
        return node;
    }
    node.component = mergeComponents(methods, comp);
    return node;
}
exports.preEnhance = preEnhance;
function postEnhance(node, methods) {
    var comp = node.component;
    if (!comp) {
        node.component = methods;
        return node;
    }
    node.component = mergeComponents(comp, methods);
    return node;
}
exports.postEnhance = postEnhance;
function assign(target, source) {
    if (target == null)
        target = {};
    if (source != null)
        for (var propname in source) {
            if (!source.hasOwnProperty(propname))
                continue;
            target[propname] = source[propname];
        }
    return target;
}
exports.assign = assign;
function preventDefault(event) {
    var pd = event.preventDefault;
    if (pd)
        pd.call(event);
    else
        event.returnValue = false;
}
exports.preventDefault = preventDefault;
function cloneNodeArray(a) {
    a = a.slice(0);
    for (var i = 0; i < a.length; i++) {
        var n = a[i];
        if (isArray(n)) {
            a[i] = cloneNodeArray(n);
        }
        else if (isObject(n)) {
            a[i] = cloneNode(n);
        }
    }
    return a;
}
function cloneNode(node) {
    var r = assign({}, node);
    if (r.attrs) {
        r.attrs = assign({}, r.attrs);
    }
    if (isObject(r.style)) {
        r.style = assign({}, r.style);
    }
    var ch = r.children;
    if (ch) {
        if (isArray(ch)) {
            r.children = cloneNodeArray(ch);
        }
        else if (isObject(ch)) {
            r.children = cloneNode(ch);
        }
    }
    return r;
}
exports.cloneNode = cloneNode;
function setStyleShim(name, action) { mapping[name] = action; }
exports.setStyleShim = setStyleShim;
function uptime() { return uptimeMs; }
exports.uptime = uptime;
function lastFrameDuration() { return lastFrameDurationMs; }
exports.lastFrameDuration = lastFrameDuration;
function frame() { return frameCounter; }
exports.frame = frame;
function invalidated() { return scheduled; }
exports.invalidated = invalidated;
var media = null;
var breaks = [
    [414, 800, 900],
    [736, 1280, 1440] //landscape widths
];
function emitOnMediaChange() {
    media = null;
    invalidate();
    return false;
}
var events = ["resize", "orientationchange"];
for (var i = 0; i < events.length; i++)
    addEvent(events[i], 10, emitOnMediaChange);
function accDeviceBreaks(newBreaks) {
    if (newBreaks != null) {
        breaks = newBreaks;
        emitOnMediaChange();
    }
    return breaks;
}
exports.accDeviceBreaks = accDeviceBreaks;
var viewport = window.document.documentElement;
function getMedia() {
    if (media == null) {
        var w = viewport.clientWidth;
        var h = viewport.clientHeight;
        var o = window.orientation;
        var p = h >= w;
        if (o == null)
            o = (p ? 0 : 90);
        var device = 0;
        while (w > breaks[+!p][device])
            device++;
        media = {
            width: w,
            height: h,
            orientation: o,
            deviceCategory: device,
            portrait: p
        };
    }
    return media;
}
exports.getMedia = getMedia;
exports.asap = (function () {
    var callbacks = [];
    function executeCallbacks() {
        var cbList = callbacks;
        callbacks = [];
        for (var i = 0, len = cbList.length; i < len; i++) {
            cbList[i]();
        }
    }
    var onreadystatechange = 'onreadystatechange';
    // Modern browsers, fastest async
    if (window.MutationObserver) {
        var hiddenDiv = document.createElement("div");
        (new MutationObserver(executeCallbacks)).observe(hiddenDiv, { attributes: true });
        return function (callback) {
            if (!callbacks.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            callbacks.push(callback);
        };
    }
    else if (!window.setImmediate && window.postMessage && window.addEventListener) {
        var MESSAGE_PREFIX = "basap" + Math.random(), hasPostMessage = false;
        var onGlobalMessage = function (event) {
            if (event.source === window && event.data === MESSAGE_PREFIX) {
                hasPostMessage = false;
                executeCallbacks();
            }
        };
        window.addEventListener("message", onGlobalMessage, false);
        return function (fn) {
            callbacks.push(fn);
            if (!hasPostMessage) {
                hasPostMessage = true;
                window.postMessage(MESSAGE_PREFIX, "*");
            }
        };
    }
    else if (!window.setImmediate && onreadystatechange in document.createElement('script')) {
        var scriptEl;
        return function (callback) {
            callbacks.push(callback);
            if (!scriptEl) {
                scriptEl = document.createElement("script");
                scriptEl[onreadystatechange] = function () {
                    scriptEl[onreadystatechange] = null;
                    scriptEl.parentNode.removeChild(scriptEl);
                    scriptEl = null;
                    executeCallbacks();
                };
                document.body.appendChild(scriptEl);
            }
        };
    }
    else {
        var timeout;
        var timeoutFn = window.setImmediate || setTimeout;
        return function (callback) {
            callbacks.push(callback);
            if (!timeout) {
                timeout = timeoutFn(function () {
                    timeout = undefined;
                    executeCallbacks();
                }, 0);
            }
        };
    }
})();
if (!window.Promise) {
    // Polyfill for Function.prototype.bind
    function bind(fn, thisArg) {
        return function () {
            fn.apply(thisArg, arguments);
        };
    }
    function handle(deferred) {
        var _this = this;
        if (this.s /*tate*/ === null) {
            this.d /*eferreds*/.push(deferred);
            return;
        }
        exports.asap(function () {
            var cb = _this.s /*tate*/ ? deferred[0] : deferred[1];
            if (cb == null) {
                (_this.s /*tate*/ ? deferred[2] : deferred[3])(_this.v /*alue*/);
                return;
            }
            var ret;
            try {
                ret = cb(_this.v /*alue*/);
            }
            catch (e) {
                deferred[3](e);
                return;
            }
            deferred[2](ret);
        });
    }
    function finale() {
        for (var i = 0, len = this.d /*eferreds*/.length; i < len; i++) {
            handle.call(this, this.d /*eferreds*/[i]);
        }
        this.d /*eferreds*/ = null;
    }
    function reject(newValue) {
        this.s /*tate*/ = false;
        this.v /*alue*/ = newValue;
        finale.call(this);
    }
    /**
     * Take a potentially misbehaving resolver function and make sure
     * onFulfilled and onRejected are only called once.
     *
     * Makes no guarantees about asynchrony.
     */
    function doResolve(fn, onFulfilled, onRejected) {
        var done = false;
        try {
            fn(function (value) {
                if (done)
                    return;
                done = true;
                onFulfilled(value);
            }, function (reason) {
                if (done)
                    return;
                done = true;
                onRejected(reason);
            });
        }
        catch (ex) {
            if (done)
                return;
            done = true;
            onRejected(ex);
        }
    }
    function resolve(newValue) {
        try {
            if (newValue === this)
                throw new TypeError('Promise selfresolve');
            if (Object(newValue) === newValue) {
                var then = newValue.then;
                if (typeof then === 'function') {
                    doResolve(bind(then, newValue), bind(resolve, this), bind(reject, this));
                    return;
                }
            }
            this.s /*tate*/ = true;
            this.v /*alue*/ = newValue;
            finale.call(this);
        }
        catch (e) {
            reject.call(this, e);
        }
    }
    function Promise(fn) {
        this.s /*tate*/ = null;
        this.v /*alue*/ = null;
        this.d /*eferreds*/ = [];
        doResolve(fn, bind(resolve, this), bind(reject, this));
    }
    Promise.prototype.then = function (onFulfilled, onRejected) {
        var me = this;
        return new Promise(function (resolve, reject) {
            handle.call(me, [onFulfilled, onRejected, resolve, reject]);
        });
    };
    Promise.all = function () {
        var args = [].slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments);
        return new Promise(function (resolve, reject) {
            if (args.length === 0) {
                resolve(args);
                return;
            }
            var remaining = args.length;
            function res(i, val) {
                try {
                    if (val && (typeof val === 'object' || typeof val === 'function')) {
                        var then = val.then;
                        if (typeof then === 'function') {
                            then.call(val, function (val) { res(i, val); }, reject);
                            return;
                        }
                    }
                    args[i] = val;
                    if (--remaining === 0) {
                        resolve(args);
                    }
                }
                catch (ex) {
                    reject(ex);
                }
            }
            for (var i = 0; i < args.length; i++) {
                res(i, args[i]);
            }
        });
    };
    Promise.resolve = function (value) {
        if (value && typeof value === 'object' && value.constructor === Promise) {
            return value;
        }
        return new Promise(function (resolve) {
            resolve(value);
        });
    };
    Promise.reject = function (value) { return new Promise(function (resolve, reject) {
        reject(value);
    }); };
    Promise.race = function (values) { return new Promise(function (resolve, reject) {
        for (var i = 0, len = values.length; i < len; i++) {
            values[i].then(resolve, reject);
        }
    }); };
    window.Promise = Promise;
}
// Bobril.StyleShim
/// <reference path="bobril.d.ts"/>
if (ieVersion() === 9) {
    function addFilter(s, v) {
        if (s.zoom == null)
            s.zoom = "1";
        var f = s.filter;
        s.filter = (f == null) ? v : f + " " + v;
    }
    var simpleLinearGradient = /^linear\-gradient\(to (.+?),(.+?),(.+?)\)/ig;
    setStyleShim("background", function (s, v, oldName) {
        var match = simpleLinearGradient.exec(v);
        if (match == null)
            return;
        var dir = match[1];
        var color1 = match[2];
        var color2 = match[3];
        var tmp;
        switch (dir) {
            case "top":
                dir = "0";
                tmp = color1;
                color1 = color2;
                color2 = tmp;
                break;
            case "bottom":
                dir = "0";
                break;
            case "left":
                dir = "1";
                tmp = color1;
                color1 = color2;
                color2 = tmp;
                break;
            case "right":
                dir = "1";
                break;
            default: return;
        }
        s[oldName] = "none";
        addFilter(s, "progid:DXImageTransform.Microsoft.gradient(startColorstr='" + color1 + "',endColorstr='" + color2 + "', gradientType='" + dir + "')");
    });
}
else {
    var teststyle = document.createElement("div").style;
    teststyle.cssText = "background:-webkit-linear-gradient(top,red,red)";
    if (teststyle.background.length > 0) {
        var startsWithGradient = /^(?:repeating\-)?(?:linear|radial)\-gradient/ig;
        var revdirs = { top: "bottom", bottom: "top", left: "right", right: "left" };
        function gradientWebkitter(style, value, name) {
            if (startsWithGradient.test(value)) {
                var pos = value.indexOf("(to ");
                if (pos > 0) {
                    pos += 4;
                    var posend = value.indexOf(",", pos);
                    var dir = value.slice(pos, posend);
                    dir = dir.split(" ").map(function (v) { return revdirs[v] || v; }).join(" ");
                    value = value.slice(0, pos - 3) + dir + value.slice(posend);
                }
                value = "-webkit-" + value;
            }
            style[name] = value;
        }
        ;
        setStyleShim("background", gradientWebkitter);
    }
}
// Bobril.OnChange
/// <reference path="bobril.d.ts"/>
/// <reference path="bobril.onchange.d.ts"/>
var bvalue = "b$value";
var tvalue = "value";
function isCheckboxlike(el) {
    var t = el.type;
    return t === "checkbox" || t === "radio";
}
function stringArrayEqual(a1, a2) {
    var l = a1.length;
    if (l !== a2.length)
        return false;
    for (var j = 0; j < l; j++) {
        if (a1[j] !== a2[j])
            return false;
    }
    return true;
}
function stringArrayContains(a, v) {
    for (var j = 0; j < a.length; j++) {
        if (a[j] === v)
            return true;
    }
    return false;
}
function selectedArray(options) {
    var res = [];
    for (var j = 0; j < options.length; j++) {
        if (options[j].selected)
            res.push(options[j].value);
    }
    return res;
}
var prevSetValueCallback = setSetValue(function (el, node, newValue, oldValue) {
    var tagName = el.tagName;
    var isSelect = tagName === "SELECT";
    var isInput = tagName === "INPUT" || tagName === "TEXTAREA";
    if (!isInput && !isSelect) {
        prevSetValueCallback(el, node, newValue, oldValue);
        return;
    }
    if (node.ctx === undefined)
        node.ctx = {};
    if (oldValue === undefined) {
        node.ctx[bvalue] = newValue;
    }
    var isMultiSelect = isSelect && el.multiple;
    var emitDiff = false;
    if (isMultiSelect) {
        var options = el.options;
        var currentMulti = selectedArray(options);
        if (!stringArrayEqual(newValue, currentMulti)) {
            if (oldValue === undefined || stringArrayEqual(currentMulti, oldValue) || !stringArrayEqual(newValue, node.ctx[bvalue])) {
                for (var j = 0; j < options.length; j++) {
                    options[j].selected = stringArrayContains(newValue, options[j].value);
                }
                currentMulti = selectedArray(options);
                if (stringArrayEqual(currentMulti, newValue)) {
                    emitDiff = true;
                }
            }
            else {
                emitDiff = true;
            }
        }
    }
    else if (isInput || isSelect) {
        if (isInput && isCheckboxlike(el)) {
            var currentChecked = el.checked;
            if (newValue !== currentChecked) {
                if (oldValue === undefined || currentChecked === oldValue || newValue !== node.ctx[bvalue]) {
                    el.checked = newValue;
                }
                else {
                    emitDiff = true;
                }
            }
        }
        else {
            var isCombobox = isSelect && el.size < 2;
            var currentValue = (el[tvalue]);
            if (newValue !== currentValue) {
                if (oldValue === undefined || currentValue === oldValue || newValue !== node.ctx[bvalue]) {
                    if (isSelect) {
                        if (newValue === "") {
                            el.selectedIndex = isCombobox ? 0 : -1;
                        }
                        else {
                            el[tvalue] = newValue;
                        }
                        if (newValue !== "" || isCombobox) {
                            currentValue = (el[tvalue]);
                            if (newValue !== currentValue) {
                                emitDiff = true;
                            }
                        }
                    }
                    else {
                        el[tvalue] = newValue;
                    }
                }
                else {
                    emitDiff = true;
                }
            }
        }
    }
    if (emitDiff) {
        emitOnChange(null, el, node);
    }
    else {
        node.ctx[bvalue] = newValue;
    }
});
function emitOnChange(ev, target, node) {
    if (target && target.nodeName === "OPTION") {
        target = document.activeElement;
        node = deref(target);
    }
    if (!node) {
        return false;
    }
    var c = node.component;
    if (!c)
        return false;
    if (!c.onChange)
        return false;
    var ctx = node.ctx;
    var tagName = target.tagName;
    var isSelect = tagName === "SELECT";
    var isMultiSelect = isSelect && target.multiple;
    if (isMultiSelect) {
        var vs = selectedArray(target.options);
        if (!stringArrayEqual(ctx[bvalue], vs)) {
            ctx[bvalue] = vs;
            c.onChange(ctx, vs);
        }
    }
    else if (isCheckboxlike(target)) {
        // Postpone change event so onClick will be processed before it
        if (ev && ev.type === "change") {
            setTimeout(function () {
                emitOnChange(null, target, node);
            }, 10);
            return false;
        }
        if (target.type === "radio") {
            var radios = document.getElementsByName(target.name);
            for (var j = 0; j < radios.length; j++) {
                var radio = radios[j];
                var radionode = deref(radio);
                if (!radionode)
                    continue;
                var radiocomponent = radionode.component;
                if (!radiocomponent)
                    continue;
                if (!radiocomponent.onChange)
                    continue;
                var radioctx = radionode.ctx;
                var vrb = radio.checked;
                if (radioctx[bvalue] !== vrb) {
                    radioctx[bvalue] = vrb;
                    radiocomponent.onChange(radioctx, vrb);
                }
            }
        }
        else {
            var vb = target.checked;
            if (ctx[bvalue] !== vb) {
                ctx[bvalue] = vb;
                c.onChange(ctx, vb);
            }
        }
    }
    else {
        var v = target.value;
        if (ctx[bvalue] !== v) {
            ctx[bvalue] = v;
            c.onChange(ctx, v);
        }
    }
    return false;
}
// click here must have lower priority (higher number) over mouse handlers
var events = ["input", "cut", "paste", "keydown", "keypress", "keyup", "click", "change"];
for (var i = 0; i < events.length; i++)
    addEvent(events[i], 10, emitOnChange);
function buildParam(ev) {
    return {
        shift: ev.shiftKey,
        ctrl: ev.ctrlKey,
        alt: ev.altKey,
        meta: ev.metaKey || false,
        which: ev.which || ev.keyCode,
    };
}
function emitOnKeyDown(ev, target, node) {
    if (!node)
        return false;
    var param = buildParam(ev);
    if (bubble(node, "onKeyDown", param)) {
        preventDefault(ev);
        return true;
    }
    return false;
}
function emitOnKeyUp(ev, target, node) {
    if (!node)
        return false;
    var param = buildParam(ev);
    if (bubble(node, "onKeyUp", param)) {
        preventDefault(ev);
        return true;
    }
    return false;
}
function emitOnKeyPress(ev, target, node) {
    if (!node)
        return false;
    if (ev.which === 0)
        return false;
    var param = { charCode: ev.which || ev.keyCode };
    if (bubble(node, "onKeyPress", param)) {
        preventDefault(ev);
        return true;
    }
    return false;
}
addEvent("keydown", 50, emitOnKeyDown);
addEvent("keyup", 50, emitOnKeyUp);
addEvent("keypress", 50, emitOnKeyPress);
var ownerCtx = null;
var invokingOwner;
var onClickText = "onClick";
function isMouseOwner(ctx) {
    return ownerCtx === ctx;
}
exports.isMouseOwner = isMouseOwner;
function isMouseOwnerEvent() {
    return invokingOwner;
}
exports.isMouseOwnerEvent = isMouseOwnerEvent;
function registerMouseOwner(ctx) {
    ownerCtx = ctx;
}
exports.registerMouseOwner = registerMouseOwner;
function releaseMouseOwner() {
    ownerCtx = null;
}
exports.releaseMouseOwner = releaseMouseOwner;
function invokeMouseOwner(handlerName, param) {
    if (ownerCtx == null) {
        return false;
    }
    var handler = ownerCtx.me.component[handlerName];
    if (!handler) {
        return false;
    }
    invokingOwner = true;
    var stop = handler(ownerCtx, param);
    invokingOwner = false;
    return stop;
}
function hasPointerEventsNoneB(node) {
    while (node) {
        var s = node.style;
        if (s) {
            var e = s.pointerEvents;
            if (e !== undefined) {
                if (e === "none")
                    return true;
                return false;
            }
        }
        node = node.parent;
    }
    return false;
}
function hasPointerEventsNone(target) {
    var bNode = deref(target);
    return hasPointerEventsNoneB(bNode);
}
function revertVisibilityChanges(hiddenEls) {
    if (hiddenEls.length) {
        for (var i = hiddenEls.length - 1; i >= 0; --i) {
            hiddenEls[i].t.style.visibility = hiddenEls[i].p;
        }
        return true;
    }
    return false;
}
function pushAndHide(hiddenEls, t) {
    hiddenEls.push({ t: t, p: t.style.visibility });
    t.style.visibility = "hidden";
}
function pointerThroughIE(ev, target, node) {
    var hiddenEls = [];
    var t = target;
    while (hasPointerEventsNone(t)) {
        pushAndHide(hiddenEls, t);
        t = document.elementFromPoint(ev.x, ev.y);
    }
    if (revertVisibilityChanges(hiddenEls)) {
        try {
            t.dispatchEvent(ev);
        }
        catch (e) {
            return false;
        }
        preventDefault(ev);
        return true;
    }
    return false;
}
function addEvent5(name, callback) {
    addEvent(name, 5, callback);
}
var pointersEventNames = ["PointerDown", "PointerMove", "PointerUp", "PointerCancel"];
var i;
if (ieVersion() && ieVersion() < 11) {
    // emulate pointer-events: none in older ie
    var mouseEvents = [
        "click", "dblclick", "drag", "dragend",
        "dragenter", "dragleave", "dragover", "dragstart",
        "drop", "mousedown", "mousemove", "mouseout",
        "mouseover", "mouseup", "mousewheel", "scroll", "wheel"];
    for (i = 0; i < mouseEvents.length; ++i) {
        addEvent(mouseEvents[i], 1, pointerThroughIE);
    }
}
function type2Bobril(t) {
    if (t == "mouse")
        return 0 /* Mouse */;
    if (t == "pen")
        return 2 /* Pen */;
    return 1 /* Touch */;
}
function pointerEventsNoneFix(x, y, target, node) {
    var hiddenEls = [];
    var t = target;
    while (hasPointerEventsNoneB(node)) {
        pushAndHide(hiddenEls, t);
        t = document.elementFromPoint(x, y);
        node = deref(t);
    }
    revertVisibilityChanges(hiddenEls);
    return [t, node];
}
function buildHandlerPointer(name) {
    return function handlePointerDown(ev, target, node) {
        if (hasPointerEventsNoneB(node)) {
            var fixed = pointerEventsNoneFix(ev.x, ev.y, target, node);
            target = fixed[0];
            node = fixed[1];
        }
        var param = { id: ev.pointerId, type: type2Bobril(ev.pointerType), x: ev.clientX, y: ev.clientY, button: ev.button + 1, shift: ev.shiftKey, ctrl: ev.ctrlKey, alt: ev.altKey, meta: ev.metaKey || false };
        if (emitEvent("!" + name, param, target, node)) {
            preventDefault(ev);
            return true;
        }
        return false;
    };
}
function buildHandlerTouch(name) {
    return function handlePointerDown(ev, target, node) {
        var preventDef = false;
        for (var i = 0; i < ev.changedTouches.length; i++) {
            var t = ev.changedTouches[i];
            target = document.elementFromPoint(t.clientX, t.clientY);
            node = deref(target);
            var param = { id: t.identifier + 2, type: 1 /* Touch */, x: t.clientX, y: t.clientY, button: 1, shift: ev.shiftKey, ctrl: ev.ctrlKey, alt: ev.altKey, meta: ev.metaKey || false };
            if (emitEvent("!" + name, param, target, node))
                preventDef = true;
        }
        if (preventDef) {
            preventDefault(ev);
            return true;
        }
        return false;
    };
}
function buildHandlerMouse(name) {
    return function handlePointer(ev, target, node) {
        target = document.elementFromPoint(ev.clientX, ev.clientY);
        node = deref(target);
        if (hasPointerEventsNoneB(node)) {
            var fixed = pointerEventsNoneFix(ev.clientX, ev.clientY, target, node);
            target = fixed[0];
            node = fixed[1];
        }
        var param = { id: 1, type: 0 /* Mouse */, x: ev.clientX, y: ev.clientY, button: decodeButton(ev), shift: ev.shiftKey, ctrl: ev.ctrlKey, alt: ev.altKey, meta: ev.metaKey || false };
        if (emitEvent("!" + name, param, target, node)) {
            preventDefault(ev);
            return true;
        }
        return false;
    };
}
if (window.onpointerdown !== undefined) {
    for (i = 0; i < 4 /*pointersEventNames.length*/; i++) {
        var name = pointersEventNames[i];
        addEvent5(name.toLowerCase(), buildHandlerPointer(name));
    }
}
else if (window.onmspointerdown !== undefined) {
    for (i = 0; i < 4 /*pointersEventNames.length*/; i++) {
        var name = pointersEventNames[i];
        addEvent5("MS" + name, buildHandlerPointer(name));
    }
}
else {
    if (window.ontouchstart !== undefined) {
        addEvent5("touchstart", buildHandlerTouch(pointersEventNames[0] /*"PointerDown"*/));
        addEvent5("touchmove", buildHandlerTouch(pointersEventNames[1] /*"PointerMove"*/));
        addEvent5("touchend", buildHandlerTouch(pointersEventNames[2] /*"PointerUp"*/));
        addEvent5("touchcancel", buildHandlerTouch(pointersEventNames[3] /*"PointerCancel"*/));
    }
    addEvent5("mousedown", buildHandlerMouse(pointersEventNames[0] /*"PointerDown"*/));
    addEvent5("mousemove", buildHandlerMouse(pointersEventNames[1] /*"PointerMove"*/));
    addEvent5("mouseup", buildHandlerMouse(pointersEventNames[2] /*"PointerUp"*/));
}
for (var j = 0; j < 4 /*pointersEventNames.length*/; j++) {
    (function (name) {
        var onname = "on" + name;
        addEvent("!" + name, 50, function (ev, target, node) {
            return invokeMouseOwner(onname, ev) || (bubble(node, onname, ev) != null);
        });
    })(pointersEventNames[j]);
}
var pointersDown = Object.create(null);
var toBust = [];
var firstPointerDown = -1;
var firstPointerDownTime = 0;
var firstPointerDownX = 0;
var firstPointerDownY = 0;
var tapCanceled = false;
function diffLess(n1, n2, diff) {
    return Math.abs(n1 - n2) < diff;
}
var prevMousePath = [];
function mouseEnterAndLeave(ev) {
    var t = document.elementFromPoint(ev.x, ev.y);
    var toPath = vdomPath(t);
    var node = toPath.length == 0 ? null : toPath[toPath.length - 1];
    if (hasPointerEventsNoneB(node)) {
        var fixed = pointerEventsNoneFix(ev.x, ev.y, t, node);
        t = fixed[0];
        toPath = vdomPath(t);
    }
    bubble(node, "onMouseOver", ev);
    var common = 0;
    while (common < prevMousePath.length && common < toPath.length && prevMousePath[common] === toPath[common])
        common++;
    var i = prevMousePath.length;
    var n;
    var c;
    while (i > common) {
        i--;
        n = prevMousePath[i];
        if (n) {
            c = n.component;
            if (c && c.onMouseLeave)
                c.onMouseLeave(n.ctx, ev);
        }
    }
    while (i < toPath.length) {
        n = toPath[i];
        if (n) {
            c = n.component;
            if (c && c.onMouseEnter)
                c.onMouseEnter(n.ctx, ev);
        }
        i++;
    }
    prevMousePath = toPath;
    return false;
}
;
function noPointersDown() {
    return Object.keys(pointersDown).length === 0;
}
function bustingPointerDown(ev, target, node) {
    if (firstPointerDown === -1 && noPointersDown()) {
        firstPointerDown = ev.id;
        firstPointerDownTime = exports.now();
        firstPointerDownX = ev.x;
        firstPointerDownY = ev.y;
        tapCanceled = false;
        mouseEnterAndLeave(ev);
    }
    pointersDown[ev.id] = ev.type;
    if (firstPointerDown !== ev.id) {
        tapCanceled = true;
    }
    return false;
}
function bustingPointerMove(ev, target, node) {
    // Browser forgot to send mouse up? Let's fix it
    if (ev.type === 0 /* Mouse */ && ev.button === 0 && pointersDown[ev.id] != null) {
        ev.button = 1;
        emitEvent("!PointerUp", ev, target, node);
        ev.button = 0;
    }
    if (firstPointerDown === ev.id) {
        mouseEnterAndLeave(ev);
        if (!diffLess(firstPointerDownX, ev.x, 13 /* MoveOverIsNotTap */) || !diffLess(firstPointerDownY, ev.y, 13 /* MoveOverIsNotTap */))
            tapCanceled = true;
    }
    else if (noPointersDown()) {
        mouseEnterAndLeave(ev);
    }
    return false;
}
function bustingPointerUp(ev, target, node) {
    delete pointersDown[ev.id];
    if (firstPointerDown == ev.id) {
        mouseEnterAndLeave(ev);
        firstPointerDown = -1;
        if (ev.type == 1 /* Touch */ && !tapCanceled) {
            if (exports.now() - firstPointerDownTime < 750 /* TapShouldBeShorterThanMs */) {
                emitEvent("!PointerCancel", ev, target, node);
                var handled = invokeMouseOwner(onClickText, ev) || (bubble(node, onClickText, ev) != null);
                var delay = (ieVersion()) ? 800 /* MaxBustDelayForIE */ : 500 /* MaxBustDelay */;
                toBust.push([ev.x, ev.y, exports.now() + delay, handled ? 1 : 0]);
                return handled;
            }
        }
    }
    return false;
}
function bustingPointerCancel(ev, target, node) {
    delete pointersDown[ev.id];
    if (firstPointerDown == ev.id) {
        firstPointerDown = -1;
    }
    return false;
}
function bustingClick(ev, target, node) {
    var n = exports.now();
    for (var i = 0; i < toBust.length; i++) {
        var j = toBust[i];
        if (j[2] < n) {
            toBust.splice(i, 1);
            i--;
            continue;
        }
        if (diffLess(j[0], ev.clientX, 50 /* BustDistance */) && diffLess(j[1], ev.clientY, 50 /* BustDistance */)) {
            toBust.splice(i, 1);
            if (j[3])
                preventDefault(ev);
            return true;
        }
    }
    return false;
}
var bustingEventNames = ["!PointerDown", "!PointerMove", "!PointerUp", "!PointerCancel", "click"];
var bustingEventHandlers = [bustingPointerDown, bustingPointerMove, bustingPointerUp, bustingPointerCancel, bustingClick];
for (var i = 0; i < 5 /*bustingEventNames.length*/; i++) {
    addEvent(bustingEventNames[i], 3, bustingEventHandlers[i]);
}
function createHandlerMouse(handlerName) {
    return function (ev, target, node) {
        if (firstPointerDown != ev.id && !noPointersDown())
            return false;
        if (invokeMouseOwner(handlerName, ev) || bubble(node, handlerName, ev)) {
            return true;
        }
        return false;
    };
}
var mouseHandlerNames = ["Down", "Move", "Up", "Up"];
for (var i = 0; i < 4; i++) {
    addEvent(bustingEventNames[i], 80, createHandlerMouse("onMouse" + mouseHandlerNames[i]));
}
function decodeButton(ev) {
    return ev.which || ev.button;
}
function createHandler(handlerName) {
    return function (ev, target, node) {
        var param = { x: ev.clientX, y: ev.clientY, button: decodeButton(ev) || 1, shift: ev.shiftKey, ctrl: ev.ctrlKey, alt: ev.altKey, meta: ev.metaKey || false };
        if (invokeMouseOwner(handlerName, param) || bubble(node, handlerName, param)) {
            preventDefault(ev);
            return true;
        }
        return false;
    };
}
function nodeOnPoint(x, y) {
    var target = document.elementFromPoint(x, y);
    var node = deref(target);
    if (hasPointerEventsNoneB(node)) {
        var fixed = pointerEventsNoneFix(x, y, target, node);
        node = fixed[1];
    }
    return node;
}
exports.nodeOnPoint = nodeOnPoint;
function handleSelectStart(ev, target, node) {
    while (node) {
        var s = node.style;
        if (s) {
            var us = s.userSelect;
            if (us === "none") {
                preventDefault(ev);
                return true;
            }
            if (us) {
                break;
            }
        }
        node = node.parent;
    }
    return false;
}
addEvent5("selectstart", handleSelectStart);
// click must have higher priority over onchange detection
addEvent5("click", createHandler(onClickText));
addEvent5("dblclick", createHandler("onDoubleClick"));
exports.pointersDownCount = function () { return Object.keys(pointersDown).length; };
exports.firstPointerDownId = function () { return firstPointerDown; };
exports.ignoreClick = function (x, y) {
    var delay = ieVersion() ? 800 /* MaxBustDelayForIE */ : 500 /* MaxBustDelay */;
    toBust.push([x, y, exports.now() + delay, 1]);
};
// Bobril.Focus
var currentActiveElement = null;
var currentFocusedNode = null;
var nodestack = [];
function emitOnFocusChange() {
    var newActiveElement = document.hasFocus() ? document.activeElement : null;
    if (newActiveElement !== currentActiveElement) {
        currentActiveElement = newActiveElement;
        var newstack = vdomPath(currentActiveElement);
        var common = 0;
        while (common < nodestack.length && common < newstack.length && nodestack[common] === newstack[common])
            common++;
        var i = nodestack.length - 1;
        var n;
        var c;
        if (i >= common) {
            n = nodestack[i];
            if (n) {
                c = n.component;
                if (c && c.onBlur)
                    c.onBlur(n.ctx);
            }
            i--;
        }
        while (i >= common) {
            n = nodestack[i];
            if (n) {
                c = n.component;
                if (c && c.onFocusOut)
                    c.onFocusOut(n.ctx);
            }
            i--;
        }
        i = common;
        while (i + 1 < newstack.length) {
            n = newstack[i];
            if (n) {
                c = n.component;
                if (c && c.onFocusIn)
                    c.onFocusIn(n.ctx);
            }
            i++;
        }
        if (i < newstack.length) {
            n = newstack[i];
            if (n) {
                c = n.component;
                if (c && c.onFocus)
                    c.onFocus(n.ctx);
            }
            i++;
        }
        nodestack = newstack;
        currentFocusedNode = nodestack.length == 0 ? null : nodestack[nodestack.length - 1];
    }
}
function emitOnFocusChangeIE() {
    setTimeout(emitOnFocusChange, 10);
    emitOnFocusChange();
}
var events = ["focus", "blur", "keydown", "keyup", "keypress", "mousedown", "mouseup", "mousemove", "touchstart", "touchend"];
for (var i = 0; i < events.length; i++)
    addEvent(events[i], 50, (ieVersion() ? emitOnFocusChangeIE : emitOnFocusChange));
function focused() {
    return currentFocusedNode;
}
exports.focused = focused;
var focusableTag = /^input$|^select$|^textarea$|^button$/;
function focus(node) {
    if (node == null)
        return false;
    if (typeof node === "string")
        return false;
    var style = node.style;
    if (style != null) {
        if (style.visibility === "hidden")
            return false;
        if (style.display === "none")
            return false;
    }
    var attrs = node.attrs;
    if (attrs != null) {
        var ti = attrs.tabindex || attrs.tabIndex; // < tabIndex is here because of backward compatibility
        if (ti !== undefined || focusableTag.test(node.tag)) {
            if (+ti === -1)
                return false;
            var el = node.element;
            el.focus();
            emitOnFocusChange();
            return true;
        }
    }
    var children = node.children;
    if (isArray(children)) {
        for (var i = 0; i < children.length; i++) {
            if (focus(children[i]))
                return true;
        }
        return false;
    }
    return focus(children);
}
exports.focus = focus;
// Bobril.Scroll
var callbacks = [];
function emitOnScroll() {
    for (var i = 0; i < callbacks.length; i++) {
        callbacks[i]();
    }
    return false;
}
// capturing event to hear everything
addEvent("^scroll", 10, emitOnScroll);
function addOnScroll(callback) {
    callbacks.push(callback);
}
exports.addOnScroll = addOnScroll;
function removeOnScroll(callback) {
    for (var i = 0; i < callbacks.length; i++) {
        if (callbacks[i] === callback) {
            callbacks.splice(i, 1);
            return;
        }
    }
}
exports.removeOnScroll = removeOnScroll;
var isHtml = /^(?:html)$/i;
var isScrollOrAuto = /^(?:auto)$|^(?:scroll)$/i;
// inspired by https://github.com/litera/jquery-scrollintoview/blob/master/jquery.scrollintoview.js
function isScrollable(el) {
    var styles = window.getComputedStyle(el);
    var res = [true, true];
    if (!isHtml.test(el.nodeName)) {
        res[0] = isScrollOrAuto.test(styles.overflowX);
        res[1] = isScrollOrAuto.test(styles.overflowY);
    }
    res[0] = res[0] && el.scrollWidth > el.clientWidth;
    res[1] = res[1] && el.scrollHeight > el.clientHeight;
    return res;
}
exports.isScrollable = isScrollable;
// returns standart X,Y order
function getWindowScroll() {
    var left = window.pageXOffset;
    var top = window.pageYOffset;
    return [left, top];
}
exports.getWindowScroll = getWindowScroll;
var lastDndId = 0;
var dnds = [];
var systemdnd = null;
var rootId = null;
var DndCtx = function (pointerId) {
    this.id = ++lastDndId;
    this.pointerid = pointerId;
    this.enabledOperations = 7 /* MoveCopyLink */;
    this.operation = 0 /* None */;
    this.local = true;
    this.ended = false;
    this.targetCtx = null;
    this.dragView = null;
    this.startX = 0;
    this.startY = 0;
    this.x = 0;
    this.y = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.shift = false;
    this.ctrl = false;
    this.alt = false;
    this.meta = false;
    this.data = Object.create(null);
    if (pointerId >= 0)
        pointer2Dnd[pointerId] = this;
    dnds.push(this);
    if (rootId == null) {
        rootId = addRoot(dndRootFactory);
    }
};
var DndComp = {
    render: function (ctx, me) {
        var dnd = ctx.data;
        me.tag = "div";
        me.style = { position: "absolute", left: dnd.x, top: dnd.y };
        me.children = dnd.dragView(dnd);
    }
};
var DndRootComp = {
    render: function (ctx, me) {
        var res = [];
        for (var i = 0; i < dnds.length; i++) {
            var dnd = dnds[i];
            if (dnd.dragView != null && (dnd.x != 0 || dnd.y != 0)) {
                res.push({ key: "" + dnd.id, data: dnd, component: DndComp });
            }
        }
        me.tag = "div";
        me.style = { position: "fixed", userSelect: "none", pointerEvents: "none", left: 0, top: 0, right: 0, bottom: 0 };
        me.children = res;
    },
    onDrag: function (ctx) {
        invalidate(ctx);
        return false;
    }
};
function dndRootFactory() {
    return { component: DndRootComp };
}
var dndProto = DndCtx.prototype;
dndProto.setOperation = function (operation) {
    this.operation = operation;
};
dndProto.setDragNodeView = function (view) {
    this.dragView = view;
};
dndProto.addData = function (type, data) {
    this.data[type] = data;
    return true;
};
dndProto.listData = function () {
    return Object.keys(this.data);
};
dndProto.hasData = function (type) {
    return this.data[type] !== undefined;
};
dndProto.getData = function (type) {
    return this.data[type];
};
dndProto.setEnabledOps = function (ops) {
    this.enabledOperations = ops;
};
dndProto.cancelDnd = function () {
    dndmoved(null, this);
    this.ended = true;
    broadcast("onDragEnd", this);
    this.destroy();
};
dndProto.destroy = function () {
    delete pointer2Dnd[this.pointerid];
    for (var i = 0; i < dnds.length; i++) {
        if (dnds[i] === this) {
            dnds.splice(i, 1);
            break;
        }
    }
    if (systemdnd === this) {
        systemdnd = null;
    }
    if (dnds.length === 0) {
        removeRoot(rootId);
        rootId = null;
    }
};
var pointer2Dnd = Object.create(null);
function handlePointerDown(ev, target, node) {
    var dnd = pointer2Dnd[ev.id];
    if (dnd && dnd.totalX == null) {
        dnd.cancelDnd();
    }
    if (ev.button === 1) {
        pointer2Dnd[ev.id] = { lastX: ev.x, lastY: ev.y, totalX: 0, totalY: 0, startX: ev.x, startY: ev.y, sourceNode: node };
    }
    return false;
}
function dndmoved(node, dnd) {
    dnd.targetCtx = bubble(node, "onDragOver", dnd);
    if (dnd.targetCtx == null) {
        dnd.operation = 0 /* None */;
    }
    broadcast("onDrag", dnd);
}
function updateDndFromPointerEvent(dnd, ev) {
    dnd.shift = ev.shift;
    dnd.ctrl = ev.ctrl;
    dnd.alt = ev.alt;
    dnd.meta = ev.meta;
}
function handlePointerMove(ev, target, node) {
    var dnd = pointer2Dnd[ev.id];
    if (dnd && dnd.totalX == null) {
        dnd.x = ev.x;
        dnd.y = ev.y;
        updateDndFromPointerEvent(dnd, ev);
        dndmoved(node, dnd);
        return true;
    }
    else if (dnd && dnd.totalX != null) {
        dnd.totalX += Math.abs(ev.x - dnd.lastX);
        dnd.totalY += Math.abs(ev.y - dnd.lastY);
        dnd.lastX = ev.x;
        dnd.lastY = ev.y;
        if (dnd.totalX + dnd.totalY > 10) {
            node = dnd.sourceNode;
            var startX = dnd.startX;
            var startY = dnd.startY;
            dnd = new DndCtx(ev.id);
            dnd.startX = startX;
            dnd.startY = startY;
            dnd.x = ev.x;
            dnd.y = ev.y;
            updateDndFromPointerEvent(dnd, ev);
            var sourceCtx = bubble(node, "onDragStart", dnd);
            if (sourceCtx) {
                var htmlNode = getDomNode(sourceCtx.me);
                if (htmlNode == null) {
                    dnd.destroy();
                    return false;
                }
                var boundFn = htmlNode.getBoundingClientRect;
                if (boundFn) {
                    var rect = boundFn.call(htmlNode);
                    dnd.deltaX = rect.left - startX;
                    dnd.deltaY = rect.top - startY;
                }
                dndmoved(node, dnd);
                return true;
            }
            else {
                dnd.destroy();
            }
        }
    }
    return false;
}
function handlePointerUp(ev, target, node) {
    var dnd = pointer2Dnd[ev.id];
    if (dnd && dnd.totalX == null) {
        dnd.x = ev.x;
        dnd.y = ev.y;
        updateDndFromPointerEvent(dnd, ev);
        dndmoved(node, dnd);
        var t = dnd.targetCtx;
        if (t && bubble(t.me, "onDrop", dnd)) {
            dnd.ended = true;
            broadcast("onDragEnd", dnd);
            dnd.destroy();
        }
        else {
            dnd.cancelDnd();
        }
        return true;
    }
    else if (dnd) {
        delete pointer2Dnd[ev.id];
    }
    return false;
}
function handlePointerCancel(ev, target, node) {
    var dnd = pointer2Dnd[ev.id];
    if (dnd && dnd.totalX == null) {
        dnd.cancelDnd();
    }
    else {
        delete pointer2Dnd[ev.id];
    }
    return false;
}
function updateFromNative(dnd, ev) {
    dnd.shift = ev.shiftKey;
    dnd.ctrl = ev.ctrlKey;
    dnd.alt = ev.altKey;
    dnd.meta = ev.metaKey;
    dnd.x = ev.clientX;
    dnd.y = ev.clientY;
    var node = nodeOnPoint(dnd.x, dnd.y); // Needed to correctly emulate pointerEvents:none
    dndmoved(node, dnd);
}
var effectAllowedTable = ["none", "link", "copy", "copyLink", "move", "linkMove", "copyMove", "all"];
function handleDragStart(ev, target, node) {
    var dnd = systemdnd;
    if (dnd != null) {
        dnd.destroy();
    }
    var activePointerIds = Object.keys(pointer2Dnd);
    var startX = ev.clientX, startY = ev.clientY, poid = -1;
    for (var i = 0; i < activePointerIds.length; i++) {
        dnd = pointer2Dnd[activePointerIds[i]];
        if (dnd.totalX != null) {
            poid = +activePointerIds[i];
            startX = dnd.startX;
            startY = dnd.startY;
            delete pointer2Dnd[poid];
            break;
        }
    }
    dnd = new DndCtx(poid);
    systemdnd = dnd;
    dnd.x = ev.clientX;
    dnd.y = ev.clientY;
    dnd.startX = startX;
    dnd.startY = startY;
    var sourceCtx = bubble(node, "onDragStart", dnd);
    if (sourceCtx) {
        var htmlNode = getDomNode(sourceCtx.me);
        if (htmlNode == null) {
            dnd.destroy();
            return false;
        }
        var boundFn = htmlNode.getBoundingClientRect;
        if (boundFn) {
            var rect = boundFn.call(htmlNode);
            dnd.deltaX = rect.left - startX;
            dnd.deltaY = rect.top - startY;
        }
        var eff = effectAllowedTable[dnd.enabledOperations];
        var dt = ev.dataTransfer;
        dt.effectAllowed = eff;
        if (dt.setDragImage) {
            var div = document.createElement("div");
            div.style.pointerEvents = "none";
            dt.setDragImage(div, 0, 0);
        }
        else {
            // For IE10 and IE11 hack to hide default drag element
            var style = htmlNode.style;
            var opacityBackup = style.opacity;
            var widthBackup = style.width;
            var heightBackup = style.height;
            var paddingBackup = style.padding;
            style.opacity = "0";
            style.width = "0";
            style.height = "0";
            style.padding = "0";
            window.setTimeout(function () {
                style.opacity = opacityBackup;
                style.width = widthBackup;
                style.height = heightBackup;
                style.padding = paddingBackup;
            }, 0);
        }
        var datas = dnd.data;
        var dataKeys = Object.keys(datas);
        for (var i = 0; i < dataKeys.length; i++) {
            try {
                var k = dataKeys[i];
                var d = datas[k];
                if (typeof d !== "string")
                    d = JSON.stringify(d);
                ev.dataTransfer.setData(k, d);
            }
            catch (e) {
                if (DEBUG)
                    if (window.console)
                        console.log("Cannot set dnd data to " + dataKeys[i]);
            }
        }
        updateFromNative(dnd, ev);
    }
    else {
        dnd.destroy();
    }
    return false;
}
function setDropEffect(ev, op) {
    ev.dataTransfer.dropEffect = ["none", "link", "copy", "move"][op];
}
function handleDragOver(ev, target, node) {
    var dnd = systemdnd;
    if (dnd == null) {
        dnd = new DndCtx(-1);
        systemdnd = dnd;
        dnd.x = ev.clientX;
        dnd.y = ev.clientY;
        dnd.startX = dnd.x;
        dnd.startY = dnd.y;
        dnd.local = false;
        var dt = ev.dataTransfer;
        var eff = 0;
        try {
            var effectAllowed = dt.effectAllowed;
        }
        catch (e) { }
        for (; eff < 7; eff++) {
            if (effectAllowedTable[eff] === effectAllowed)
                break;
        }
        dnd.enabledOperations = eff;
        var dttypes = dt.types;
        if (dttypes) {
            for (var i = 0; i < dttypes.length; i++) {
                var tt = dttypes[i];
                if (tt === "text/plain")
                    tt = "Text";
                else if (tt === "text/uri-list")
                    tt = "Url";
                dnd.data[tt] = null;
            }
        }
        else {
            if (dt.getData("Text") !== undefined)
                dnd.data["Text"] = null;
        }
    }
    updateFromNative(dnd, ev);
    setDropEffect(ev, dnd.operation);
    if (dnd.operation != 0 /* None */) {
        preventDefault(ev);
        return true;
    }
    return false;
}
function handleDrag(ev, target, node) {
    var x = ev.clientX;
    var y = ev.clientY;
    var m = getMedia();
    if (systemdnd != null && (x === 0 && y === 0 || x < 0 || y < 0 || x >= m.width || y >= m.height)) {
        systemdnd.x = 0;
        systemdnd.y = 0;
        systemdnd.operation = 0 /* None */;
        broadcast("onDrag", systemdnd);
    }
    return false;
}
function handleDragEnd(ev, target, node) {
    if (systemdnd != null) {
        systemdnd.ended = true;
        broadcast("onDragEnd", systemdnd);
        systemdnd.cancelDnd();
    }
    return false;
}
function handleDrop(ev, target, node) {
    var dnd = systemdnd;
    if (dnd == null)
        return false;
    dnd.x = ev.clientX;
    dnd.y = ev.clientY;
    if (!dnd.local) {
        var dataKeys = Object.keys(dnd.data);
        var dt = ev.dataTransfer;
        for (var i_1 = 0; i_1 < dataKeys.length; i_1++) {
            var k = dataKeys[i_1];
            var d;
            if (k === "Files") {
                d = [].slice.call(dt.files, 0); // What a useless FileList type! Get rid of it.
            }
            else {
                d = dt.getData(k);
                if (typeof d !== "string") {
                    d = JSON.parse(d);
                }
            }
            dnd.data[k] = d;
        }
    }
    updateFromNative(dnd, ev);
    var t = dnd.targetCtx;
    if (t && bubble(t.me, "onDrop", dnd)) {
        setDropEffect(ev, dnd.operation);
        dnd.ended = true;
        broadcast("onDragEnd", dnd);
        dnd.destroy();
        preventDefault(ev);
    }
    else {
        dnd.cancelDnd();
    }
    return true;
}
function justPreventDefault(ev, target, node) {
    preventDefault(ev);
    return true;
}
addEvent("!PointerDown", 4, handlePointerDown);
addEvent("!PointerMove", 4, handlePointerMove);
addEvent("!PointerUp", 4, handlePointerUp);
addEvent("!PointerCancel", 4, handlePointerCancel);
addEvent("dragstart", 5, handleDragStart);
addEvent("dragover", 5, handleDragOver);
addEvent("dragend", 5, handleDragEnd);
addEvent("drag", 5, handleDrag);
addEvent("drop", 5, handleDrop);
addEvent("dragenter", 5, justPreventDefault);
addEvent("dragleave", 5, justPreventDefault);
exports.getDnds = function () { return dnds; };
function emitOnHashChange() {
    invalidate();
    return false;
}
addEvent("hashchange", 10, emitOnHashChange);
var myAppHistoryDeepness = 0;
function push(path, inapp) {
    var l = window.location;
    if (inapp) {
        l.hash = path.substring(1);
        myAppHistoryDeepness++;
    }
    else {
        l.href = path;
    }
}
function replace(path, inapp) {
    var l = window.location;
    if (inapp) {
        l.replace(l.pathname + l.search + path);
    }
    else {
        l.replace(path);
    }
}
function pop() {
    myAppHistoryDeepness--;
    window.history.back();
}
var rootRoutes;
var nameRouteMap = {};
function encodeUrl(url) {
    return encodeURIComponent(url).replace(/%20/g, "+");
}
function decodeUrl(url) {
    return decodeURIComponent(url.replace(/\+/g, " "));
}
function encodeUrlPath(path) {
    return String(path).split("/").map(encodeUrl).join("/");
}
var paramCompileMatcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|[*.()\[\]\\+|{}^$]/g;
var paramInjectMatcher = /:([a-zA-Z_$][a-zA-Z0-9_$?]*[?]?)|[*]/g;
var compiledPatterns = {};
function compilePattern(pattern) {
    if (!(pattern in compiledPatterns)) {
        var paramNames = [];
        var source = pattern.replace(paramCompileMatcher, function (match, paramName) {
            if (paramName) {
                paramNames.push(paramName);
                return "([^/?#]+)";
            }
            else if (match === "*") {
                paramNames.push("splat");
                return "(.*?)";
            }
            else {
                return "\\" + match;
            }
        });
        compiledPatterns[pattern] = {
            matcher: new RegExp("^" + source + "$", "i"),
            paramNames: paramNames
        };
    }
    return compiledPatterns[pattern];
}
function extractParamNames(pattern) {
    return compilePattern(pattern).paramNames;
}
// Extracts the portions of the given URL path that match the given pattern.
// Returns null if the pattern does not match the given path.
function extractParams(pattern, path) {
    var object = compilePattern(pattern);
    var match = decodeUrl(path).match(object.matcher);
    if (!match)
        return null;
    var params = {};
    var pn = object.paramNames;
    var l = pn.length;
    for (var i = 0; i < l; i++) {
        params[pn[i]] = match[i + 1];
    }
    return params;
}
// Returns a version of the given route path with params interpolated.
// Throws if there is a dynamic segment of the route path for which there is no param.
function injectParams(pattern, params) {
    params = params || {};
    var splatIndex = 0;
    return pattern.replace(paramInjectMatcher, function (match, paramName) {
        paramName = paramName || "splat";
        // If param is optional don't check for existence
        if (paramName.slice(-1) !== "?") {
            if (params[paramName] == null)
                throw new Error("Missing \"" + paramName + "\" parameter for path \"" + pattern + "\"");
        }
        else {
            paramName = paramName.slice(0, -1);
            if (params[paramName] == null) {
                return "";
            }
        }
        var segment;
        if (paramName === "splat" && Array.isArray(params[paramName])) {
            segment = params[paramName][splatIndex++];
            if (segment == null)
                throw new Error("Missing splat # " + splatIndex + " for path \"" + pattern + "\"");
        }
        else {
            segment = params[paramName];
        }
        return encodeUrlPath(segment);
    });
}
function findMatch(path, rs, outParams) {
    var l = rs.length;
    var notFoundRoute;
    var defaultRoute;
    var params;
    for (var i = 0; i < l; i++) {
        var r = rs[i];
        if (r.isNotFound) {
            notFoundRoute = r;
            continue;
        }
        if (r.isDefault) {
            defaultRoute = r;
            continue;
        }
        if (r.children) {
            var res = findMatch(path, r.children, outParams);
            if (res) {
                res.push(r);
                return res;
            }
        }
        if (r.url) {
            params = extractParams(r.url, path);
            if (params) {
                outParams.p = params;
                return [r];
            }
        }
    }
    if (defaultRoute) {
        params = extractParams(defaultRoute.url, path);
        if (params) {
            outParams.p = params;
            return [defaultRoute];
        }
    }
    if (notFoundRoute) {
        params = extractParams(notFoundRoute.url, path);
        if (params) {
            outParams.p = params;
            return [notFoundRoute];
        }
    }
    return null;
}
;
var activeRoutes = [];
var futureRoutes;
var activeParams = Object.create(null);
var nodesArray = [];
var setterOfNodesArray = [];
var urlRegex = /\:|\//g;
function isInApp(name) {
    return !urlRegex.test(name);
}
function isAbsolute(url) {
    return url[0] === "/";
}
function noop() {
    return null;
}
function getSetterOfNodesArray(idx) {
    while (idx >= setterOfNodesArray.length) {
        setterOfNodesArray.push((function (a, i) {
            return (function (n) {
                if (n)
                    a[i] = n;
            });
        })(nodesArray, idx));
    }
    return setterOfNodesArray[idx];
}
var firstRouting = true;
function rootNodeFactory() {
    var path = window.location.hash.substr(1);
    if (!isAbsolute(path))
        path = "/" + path;
    var out = { p: {} };
    var matches = findMatch(path, rootRoutes, out) || [];
    if (firstRouting) {
        firstRouting = false;
        currentTransition = { inApp: true, type: 2 /* Pop */, name: null, params: null };
        transitionState = -1;
    }
    if (currentTransition && currentTransition.type === 2 /* Pop */ && transitionState < 0) {
        currentTransition.inApp = true;
        if (currentTransition.name == null && matches.length > 0) {
            currentTransition.name = matches[0].name;
            currentTransition.params = out.p;
            nextIteration();
        }
        return null;
    }
    if (currentTransition == null) {
        activeRoutes = matches;
        while (nodesArray.length > activeRoutes.length)
            nodesArray.pop();
        while (nodesArray.length < activeRoutes.length)
            nodesArray.push(null);
        activeParams = out.p;
    }
    var fn = noop;
    for (var i = 0; i < activeRoutes.length; i++) {
        (function (fninner, r, routeParams, i) {
            fn = function (otherdata) {
                var data = r.data || {};
                assign(data, otherdata);
                data.activeRouteHandler = fninner;
                data.routeParams = routeParams;
                var handler = r.handler;
                var res;
                if (typeof handler === "function") {
                    res = handler(data);
                }
                else {
                    res = { key: undefined, ref: undefined, data: data, component: handler };
                }
                if (r.keyBuilder)
                    res.key = r.keyBuilder(routeParams);
                res.ref = getSetterOfNodesArray(i);
                return res;
            };
        })(fn, activeRoutes[i], activeParams, i);
    }
    return fn();
}
function joinPath(p1, p2) {
    if (isAbsolute(p2))
        return p2;
    if (p1[p1.length - 1] === "/")
        return p1 + p2;
    return p1 + "/" + p2;
}
function registerRoutes(url, rs) {
    var l = rs.length;
    for (var i = 0; i < l; i++) {
        var r = rs[i];
        var u = url;
        var name = r.name;
        if (!name && url === "/") {
            name = "root";
            r.name = name;
            nameRouteMap[name] = r;
        }
        else if (name) {
            nameRouteMap[name] = r;
            u = joinPath(u, name);
        }
        if (r.isDefault) {
            u = url;
        }
        else if (r.isNotFound) {
            u = joinPath(url, "*");
        }
        else if (r.url) {
            u = joinPath(url, r.url);
        }
        r.url = u;
        if (r.children)
            registerRoutes(u, r.children);
    }
}
function routes(rootroutes) {
    if (!isArray(rootroutes)) {
        rootroutes = [rootroutes];
    }
    registerRoutes("/", rootroutes);
    rootRoutes = rootroutes;
    init(rootNodeFactory);
}
exports.routes = routes;
function route(config, nestedRoutes) {
    return { name: config.name, url: config.url, data: config.data, handler: config.handler, keyBuilder: config.keyBuilder, children: nestedRoutes };
}
exports.route = route;
function routeDefault(config) {
    return { name: config.name, data: config.data, handler: config.handler, keyBuilder: config.keyBuilder, isDefault: true };
}
exports.routeDefault = routeDefault;
function routeNotFound(config) {
    return { name: config.name, data: config.data, handler: config.handler, keyBuilder: config.keyBuilder, isNotFound: true };
}
exports.routeNotFound = routeNotFound;
function isActive(name, params) {
    if (params) {
        for (var prop in params) {
            if (params.hasOwnProperty(prop)) {
                if (activeParams[prop] !== params[prop])
                    return false;
            }
        }
    }
    for (var i = 0, l = activeRoutes.length; i < l; i++) {
        if (activeRoutes[i].name === name) {
            return true;
        }
    }
    return false;
}
exports.isActive = isActive;
function urlOfRoute(name, params) {
    if (isInApp(name)) {
        var r = nameRouteMap[name];
        return "#" + injectParams(r.url, params);
    }
    return name;
}
exports.urlOfRoute = urlOfRoute;
function link(node, name, params) {
    node.data = node.data || {};
    node.data.active = isActive(name, params);
    node.data.url = urlOfRoute(name, params);
    node.data.transition = createRedirectPush(name, params);
    postEnhance(node, {
        render: function (ctx, me) {
            me.attrs = me.attrs || {};
            if (me.tag === "a") {
                me.attrs.href = ctx.data.url;
            }
            me.className = me.className || "";
            if (ctx.data.active) {
                me.className += " active";
            }
        },
        onClick: function (ctx) {
            runTransition(ctx.data.transition);
            return true;
        }
    });
    return node;
}
exports.link = link;
function createRedirectPush(name, params) {
    return {
        inApp: isInApp(name),
        type: 0 /* Push */,
        name: name,
        params: params || {}
    };
}
exports.createRedirectPush = createRedirectPush;
function createRedirectReplace(name, params) {
    return {
        inApp: isInApp(name),
        type: 1 /* Replace */,
        name: name,
        params: params || {}
    };
}
exports.createRedirectReplace = createRedirectReplace;
function createBackTransition() {
    return {
        inApp: myAppHistoryDeepness > 0,
        type: 2 /* Pop */,
        name: null,
        params: {}
    };
}
exports.createBackTransition = createBackTransition;
var currentTransition = null;
var nextTransition = null;
var transitionState = 0;
function doAction(transition) {
    switch (transition.type) {
        case 0 /* Push */:
            push(urlOfRoute(transition.name, transition.params), transition.inApp);
            break;
        case 1 /* Replace */:
            replace(urlOfRoute(transition.name, transition.params), transition.inApp);
            break;
        case 2 /* Pop */:
            pop();
            break;
    }
    invalidate();
}
function nextIteration() {
    while (true) {
        if (transitionState >= 0 && transitionState < activeRoutes.length) {
            var node = nodesArray[transitionState];
            transitionState++;
            if (!node)
                continue;
            var comp = node.component;
            if (!comp)
                continue;
            var fn = comp.canDeactivate;
            if (!fn)
                continue;
            var res = fn.call(comp, node.ctx, currentTransition);
            Promise.resolve(res).then(function (resp) {
                if (resp === true) { }
                else if (resp === false) {
                    currentTransition = null;
                    nextTransition = null;
                    return;
                }
                else {
                    nextTransition = resp;
                }
                nextIteration();
            }).catch(console.log.bind(console));
            return;
        }
        else if (transitionState == activeRoutes.length) {
            if (nextTransition) {
                if (currentTransition && currentTransition.type == 0 /* Push */) {
                    push(urlOfRoute(currentTransition.name, currentTransition.params), currentTransition.inApp);
                }
                currentTransition = nextTransition;
                nextTransition = null;
            }
            transitionState = -1;
            if (!currentTransition.inApp || currentTransition.type === 2 /* Pop */) {
                doAction(currentTransition);
                return;
            }
        }
        else if (transitionState === -1) {
            var out = { p: {} };
            var matches = findMatch(urlOfRoute(currentTransition.name, currentTransition.params), rootRoutes, out) || [];
            futureRoutes = matches;
            transitionState = -2;
        }
        else if (transitionState === -2 - futureRoutes.length) {
            if (nextTransition) {
                transitionState = activeRoutes.length;
                continue;
            }
            if (currentTransition.type !== 2 /* Pop */) {
                doAction(currentTransition);
            }
            else {
                invalidate();
            }
            currentTransition = null;
            return;
        }
        else {
            if (nextTransition) {
                transitionState = activeRoutes.length;
                continue;
            }
            var rr = futureRoutes[futureRoutes.length + 1 + transitionState];
            transitionState--;
            var handler = rr.handler;
            var comp = null;
            if (typeof handler === "function") {
                var node = handler({});
                if (!node)
                    continue;
                comp = node.component;
            }
            else {
                comp = handler;
            }
            if (!comp)
                continue;
            var fn = comp.canActivate;
            if (!fn)
                continue;
            var res = fn.call(comp, currentTransition);
            Promise.resolve(res).then(function (resp) {
                if (resp === true) { }
                else if (resp === false) {
                    currentTransition = null;
                    nextTransition = null;
                    return;
                }
                else {
                    nextTransition = resp;
                }
                nextIteration();
            }).catch(console.log.bind(console));
            return;
        }
    }
}
function runTransition(transition) {
    if (currentTransition != null) {
        nextTransition = transition;
        return;
    }
    firstRouting = false;
    currentTransition = transition;
    transitionState = 0;
    nextIteration();
}
exports.runTransition = runTransition;
var allStyles = Object.create(null);
var allSprites = Object.create(null);
var allNameHints = Object.create(null);
var rebuildStyles = false;
var htmlStyle = null;
var globalCounter = 0;
var chainedBeforeFrame = setBeforeFrame(beforeFrame);
function buildCssRule(parent, name) {
    var result = "";
    if (parent) {
        if (isArray(parent)) {
            for (var i_2 = 0; i_2 < parent.length; i_2++) {
                if (i_2 > 0)
                    result += ",";
                result += "." + allStyles[parent[i_2]].name + "." + name;
            }
        }
        else {
            result = "." + allStyles[parent].name + "." + name;
        }
    }
    else {
        result = "." + name;
    }
    return result;
}
function beforeFrame() {
    if (rebuildStyles) {
        var stylestr = "";
        for (var key in allStyles) {
            var ss = allStyles[key];
            var parent_1 = ss.parent;
            var name_1 = ss.name;
            if (ss.cssStyle.length > 0)
                stylestr += buildCssRule(parent_1, name_1) + " {" + ss.cssStyle + "}\n";
            var ssp = ss.pseudo;
            if (ssp)
                for (var key2 in ssp) {
                    stylestr += buildCssRule(parent_1, name_1 + ":" + key2) + " {" + ssp[key2] + "}\n";
                }
        }
        var styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        if (styleElement.styleSheet) {
            styleElement.styleSheet.cssText = stylestr;
        }
        else {
            styleElement.appendChild(document.createTextNode(stylestr));
        }
        var head = document.head || document.getElementsByTagName('head')[0];
        if (htmlStyle != null) {
            head.replaceChild(styleElement, htmlStyle);
        }
        else {
            head.appendChild(styleElement);
        }
        htmlStyle = styleElement;
        rebuildStyles = false;
    }
    chainedBeforeFrame();
}
function apply(s, className, inlineStyle) {
    if (typeof s === "boolean") {
    }
    else if (typeof s === "string") {
        var sd = allStyles[s];
        if (inlineStyle != null) {
            inlineStyle = assign(inlineStyle, sd.fullInlStyle);
        }
        else {
            if (className == null)
                className = sd.name;
            else
                className = className + " " + sd.name;
            var inls = sd.inlStyle;
            if (inls) {
                if (inlineStyle == null)
                    inlineStyle = inls;
                else
                    inlineStyle = assign(inlineStyle, inls);
            }
        }
    }
    else if (Array.isArray(s)) {
        for (var i = 0; i < s.length; i++) {
            _a = apply(s[i], className, inlineStyle), className = _a[0], inlineStyle = _a[1];
        }
    }
    else {
        if (inlineStyle == null)
            inlineStyle = s;
        else
            inlineStyle = assign(inlineStyle, s);
    }
    return [className, inlineStyle];
    var _a;
}
function style(node) {
    var styles = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        styles[_i - 1] = arguments[_i];
    }
    var className = node.className;
    var inlineStyle = node.style;
    for (var i = 0; i < styles.length; i++) {
        _a = apply(styles[i], className, inlineStyle), className = _a[0], inlineStyle = _a[1];
    }
    node.className = className;
    node.style = inlineStyle;
    return node;
    var _a;
}
exports.style = style;
var uppercasePattern = /([A-Z])/g;
var msPattern = /^ms-/;
function hyphenateStyle(s) {
    if (s === "cssFloat")
        return "float";
    return s.replace(uppercasePattern, '-$1').toLowerCase().replace(msPattern, '-ms-');
}
function inlineStyleToCssDeclaration(style) {
    var res = "";
    for (var key in style) {
        var v = style[key];
        if (v === undefined)
            continue;
        res += hyphenateStyle(key) + ":" + (v === "" ? '""' : v) + ";";
    }
    res = res.slice(0, -1);
    return res;
}
function styleDef(style, pseudo, nameHint) {
    return styleDefEx(null, style, pseudo, nameHint);
}
exports.styleDef = styleDef;
function flattenStyle(style) {
    if (!isArray(style))
        return style;
    var res = {};
    for (var i_3 = 0; i_3 < style.length; i_3++) {
        assign(res, style[i_3]);
    }
    return res;
}
function styleDefEx(parent, style, pseudo, nameHint) {
    if (nameHint) {
        if (allNameHints[nameHint]) {
            var counter = 1;
            while (allNameHints[nameHint + counter])
                counter++;
        }
        allNameHints[nameHint] = true;
    }
    else {
        nameHint = "b-" + globalCounter++;
    }
    var extractedInlStyle = null;
    style = flattenStyle(style);
    if (style["pointerEvents"]) {
        extractedInlStyle = Object.create(null);
        extractedInlStyle["pointerEvents"] = style["pointerEvents"];
    }
    if (ieVersion() === 9) {
        if (style["userSelect"]) {
            if (extractedInlStyle == null)
                extractedInlStyle = Object.create(null);
            extractedInlStyle["userSelect"] = style["userSelect"];
            style["userSelect"] = undefined;
        }
    }
    shimStyle(style);
    var processedPseudo = null;
    if (pseudo) {
        processedPseudo = Object.create(null);
        for (var key in pseudo) {
            var ps = flattenStyle(pseudo[key]);
            shimStyle(ps);
            processedPseudo[key] = inlineStyleToCssDeclaration(ps);
        }
    }
    allStyles[nameHint] = { name: nameHint, parent: parent, fullInlStyle: style, inlStyle: extractedInlStyle, cssStyle: inlineStyleToCssDeclaration(style), pseudo: processedPseudo };
    rebuildStyles = true;
    invalidate();
    return nameHint;
}
exports.styleDefEx = styleDefEx;
function updateSprite(spDef) {
    var stDef = allStyles[spDef.styleid];
    var style = { backgroundImage: "url(" + spDef.url + ")", width: spDef.width, height: spDef.height };
    if (spDef.left || spDef.top) {
        style.backgroundPosition = -spDef.left + "px " + -spDef.top + "px";
    }
    shimStyle(style);
    stDef.fullInlStyle = style;
    stDef.cssStyle = inlineStyleToCssDeclaration(style);
    rebuildStyles = true;
    invalidate();
}
function sprite(url, color, width, height, left, top) {
    var key = url + ":" + (color || "") + ":" + (width || 0) + ":" + (height || 0) + ":" + (left || 0) + ":" + (top || 0);
    var spDef = allSprites[key];
    if (spDef)
        return spDef.styleid;
    var styleid = styleDef({ width: 0, height: 0 });
    spDef = { styleid: styleid, url: url, width: width, height: height, left: left || 0, top: top || 0 };
    if (width == null || height == null || color != null) {
        var image = new Image();
        image.addEventListener("load", function () {
            if (spDef.width == null)
                spDef.width = image.width;
            if (spDef.height == null)
                spDef.height = image.height;
            if (color != null) {
                var canvas = document.createElement("canvas");
                canvas.width = spDef.width;
                canvas.height = spDef.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(image, -spDef.left, -spDef.top);
                var imgdata = ctx.getImageData(0, 0, spDef.width, spDef.height);
                var imgd = imgdata.data;
                var cred = parseInt(color.substr(1, 2), 16);
                var cgreen = parseInt(color.substr(3, 2), 16);
                var cblue = parseInt(color.substr(5, 2), 16);
                for (var i = 0; i < imgd.length; i += 4) {
                    if (imgd[i] === 0x80 && imgd[i + 1] === 0x80 && imgd[i + 2] === 0x80) {
                        imgd[i] = cred;
                        imgd[i + 1] = cgreen;
                        imgd[i + 2] = cblue;
                    }
                }
                ctx.putImageData(imgdata, 0, 0);
                spDef.url = canvas.toDataURL();
                spDef.left = 0;
                spDef.top = 0;
            }
            updateSprite(spDef);
        });
        image.src = url;
    }
    else {
        updateSprite(spDef);
    }
    allSprites[key] = spDef;
    return styleid;
}
exports.sprite = sprite;
function spriteb(width, height, left, top) {
    var url = "bundle.png";
    var key = url + "::" + width + ":" + height + ":" + left + ":" + top;
    var spDef = allSprites[key];
    if (spDef)
        return spDef.styleid;
    var styleid = styleDef({ width: 0, height: 0 });
    spDef = { styleid: styleid, url: url, width: width, height: height, left: left, top: top };
    updateSprite(spDef);
    allSprites[key] = spDef;
    return styleid;
}
exports.spriteb = spriteb;
// Bobril.svgExtensions
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = angleInDegrees * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.sin(angleInRadians)), y: centerY - (radius * Math.cos(angleInRadians))
    };
}
function svgDescribeArc(x, y, radius, startAngle, endAngle, startWithLine) {
    var absDeltaAngle = Math.abs(endAngle - startAngle);
    var close = false;
    if (absDeltaAngle > 360 - 0.01) {
        if (endAngle > startAngle)
            endAngle = startAngle - 359.9;
        else
            endAngle = startAngle + 359.9;
        if (radius === 0)
            return "";
        close = true;
    }
    else {
        if (radius === 0) {
            return [
                startWithLine ? "L" : "M", x, y
            ].join(" ");
        }
    }
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var arcSweep = (absDeltaAngle <= 180) ? "0" : "1";
    var largeArg = (endAngle > startAngle) ? "0" : "1";
    var d = [
        (startWithLine ? "L" : "M"), start.x, start.y, "A", radius, radius, 0, arcSweep, largeArg, end.x, end.y
    ].join(" ");
    if (close)
        d += "Z";
    return d;
}
function svgPie(x, y, radiusBig, radiusSmall, startAngle, endAngle) {
    var p = svgDescribeArc(x, y, radiusBig, startAngle, endAngle, false);
    var nextWithLine = true;
    if (p[p.length - 1] === "Z")
        nextWithLine = false;
    if (radiusSmall === 0) {
        if (!nextWithLine)
            return p;
    }
    return p + svgDescribeArc(x, y, radiusSmall, endAngle, startAngle, nextWithLine) + "Z";
}
exports.svgPie = svgPie;
function svgCircle(x, y, radius) {
    return svgDescribeArc(x, y, radius, 0, 360, false);
}
exports.svgCircle = svgCircle;
function svgRect(x, y, width, height) {
    return "M" + x + " " + y + "h" + width + "v" + height + "h" + (-width) + "Z";
}
exports.svgRect = svgRect;