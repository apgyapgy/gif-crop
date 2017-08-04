/* 事件绑定 */
var addEvent = document.addEventListener ?
        function (element, type, fn) {
            element.addEventListener(type, fn, false);
        } :

        function (element, type, fn) {
            element.attachEvent("on" + type, fn);
        },

    /* 事件解除绑定 */
    removeEvent = document.removeEventListener ?
        function (element, type, fn) {
            element.removeEventListener(type, fn, false);
        } :

        function (element, type, fn) {
            element.detachEvent("on" + type, fn);
        },

    /* 文本框水印/占位符 */
    watermarkFun = function (element, text) {
        if (!(this instanceof watermarkFun))
            return new watermarkFun(element, text);

        //if (!text) {
        //    var place = document.createElement("span");//提示信息标记
        //    element.parentNode.insertBefore(place, element);//插入到表单元素之前的位置
        //    place.className = "w-label";
        //    place.innerHTML = text;
        //    place.style.height = place.style.lineHeight = element.offsetHeight + "px";//设置高度、行高以居中
        //}

        var place = document.getElementById("watermark");

        function hideIfHasValue() {
            if (element.value && place.className.indexOf("w-hide") == -1)
                place.className += " w-hide";
        }

        function onFocus() {
            hideIfHasValue()
            if (!element.value && place.className.indexOf("w-active") == -1)
                place.className += " w-active";
        }

        function onBlur() {
            if (!element.value) {
                place.className = place.className.replace(" w-active", "").replace(" w-hide", "");
            }
        }

        function onClick() {
            hideIfHasValue();
            try {
                element.focus && element.focus();
            } catch (ex) { }
        }

        // 注册各个事件
        hideIfHasValue();
        addEvent(element, "focus", onFocus);
        addEvent(element, "blur", onBlur);
        addEvent(element, "keyup", hideIfHasValue); /*水印消失有延迟，导致粘贴的文字和水印有重合，未解决*/
        addEvent(place, "click", onClick);

        // 取消watermark
        this.unload = function () {
            removeEvent(element, "focus", onFocus);
            removeEvent(element, "blur", onBlur);
            removeEvent(element, "keyup", hideIfHasValue);
            removeEvent(place, "click", onClick);
            element.parentNode.removeChild(place);
        };
    },

    /* 对于不支持html5 placeholder特性的浏览器应用watermark */
    placeHolderForm = function (form) {
        var ph, elems = form.elements,
            html5support = "placeholder" in document.createElement("input");

        if (!html5support) {
            for (var i = 0, l = elems.length; i < l; i++) {
                ph = elems[i].getAttribute("placeholder");
                if (ph) watermark(elems[i], ph);
            }
        }
    };