var containerWidth = 453, containerHeight = 363; //左右图片容器的尺寸
var extArr = ["gif"];
var unGifExt = ["jpg", "jpeg", "png", "bmp"];
var instance, x1, y1, width, height;
var rand = getRand();
var url, isUploadBase64;
var args,gifId,extensionId;
$(document).ready(function () {
    if ($('#url').val()) {
        if (isURL((url))) {
        }
    }//downloadRemoteImage(_burl);

    //添加水印
    watermarkFun(document.getElementById("url"));

    $('.make-btn').click(make_btn_clk);

    $(".download-btn").click(function () {
        if (parseInt($("#w").val()) && parseInt($("#h").val())) {
            $("#download_form").submit();
        } else {
            alert("先在图片上划一个选区再单击确认剪裁的按钮！");
        }
    });
    //开始
	args = getUrlArgs()
	gifId = args.gif_id
	extensionId = args.extension_id
	//console.log(gifId, extensionId)
	sendExtensionMessage(extensionId, 'getCachedGif', {gifId: gifId}, function(res){
		window.sessionStorage['upimg'] = res;
		res = res.replace(/^data:image\/[a-z]+;base64,/, "");
		isUploadBase64 = true;
		downloadRemoteImage(res);
   		return true;
	});
    //点击 裁切并保存 按钮
    $.ajaxSetup({cache: false});
    $(document).on("submit", "#download_form", function (e) {
        e.preventDefault();
        $.ajax({
            type: "POST",
            url: $(this).attr("action"),
            data: $(this).serialize(),
            success: function (e) {
            	$.ajax({
            		type:'GET',
            		url:"http://106.75.12.84/gifCrop/crop/imageToBase64?fileName="+e.message.fileName,
            		success:function(re){
                        removeSpinner($('.download-btn-inner'));
                        $('.download-btn').show();
                        enableBtn();
				        sendExtensionMessage(extensionId, 'sendEditedGif', {gifData: re}, function(res){
				           console.log("send back success")
				        });
            		},
            		error:function(re){
            			console.log("err",re);
            		}
            	});
                //console.log("http://106.75.12.84/gifCrop/uploads/"+e.message.fileName);
            },
            beforeSend: function () {
                disableBtn();
                $('.download-btn').hide();
                addSpinner($('.download-btn-inner'));
                $('.spinner').css("margin-top", 1);//loading 图标居中
            }/*,
            complete: function () {
                removeSpinner($('.download-btn-inner'));
                $('.download-btn').show();
                enableBtn();
            }*/
        })
    });
    //http://106.75.12.84/gifCrop/crop/imageToBase64?fileName=default.gif
    $('#uploadFile').click(function () {
        document.querySelector('#files').click();
        //showUploadTxt();
        //resetWatermark();
    });

    $('#files').change(function () {
        //console.log('files change');
        var files = $('input[name="files"]').prop('files');//获取到文件列表
        //console.log('files:' + files);
        if (files.length > 0) {
            var fileName = files[0].name;
            var fileSizw = files[0].size;
            var fileType = files[0].type;
            var fileExt = fileName.substring(fileName.lastIndexOf('.') + 1);
            if (extArr.indexOf(fileExt) == -1) {
                showInfoTip('只能上传 gif 图片');
                return false;
            }
            uploadFile();
        }
    });

    $('#url').focus(function (e) {
        showUploadTxt(); //输入框失去焦点时，右侧上传按钮恢复正常状态
    });

    // 用户上传文件点击
    $('.watermark-upload-icon').on('click', function () {
        _hmt.push(['_trackEvent', '用户点击本地上传按钮次数', 'click', '用户上传文件次数']);
    });
    // 裁剪到指定大小并点击保存的次数
    $('.download-btn-inner').on('click', function () {
        var _wh = '';
        _wh = $('#previewImgInfo').text()
        _hmt.push(['_trackEvent', '裁剪大小——' + _wh, 'click', '裁剪到指定大小并点击保存的次数']);
    });
});
///
function make_btn_clk() {
    url = $('#url').val();
    //console.log('url :' + url);

    if (url) {
        if (!isURL((url))) {
            url = url.replace(/^data:image\/[a-z]+;base64,/, "");
            var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
            if (!base64regex.test(url)) { //是否是 base64 字符串
                isUploadBase64 = false;
                showInfoTip('请输入正确的网页图片地址或 Base64 图片字符');
                //console.log('网页地址错误 : ' + url);
                return false;
            }
            isUploadBase64 = true;
        }
        else {
            //非 .gif 结尾的 gif 图片 : http://mmbiz.qpic.cn/mmbiz_gif/bnQ3rzibDOKMibaUy8VE8hrg9YWEn2Gvs05GX4rVpTYYMz287AOaoqTj5ibGaofTq4UA39C0xtuIae88KF435fg0A/0?wx_fmt=gif&wxfrom=5&wx_lazy=1
            //非 .gif 结尾的非 gif 图片 : http://mmbiz.qpic.cn/mmbiz_jpg/bnQ3rzibDOKMibaUy8VE8hrg9YWEn2Gvs0haMCvNhCtQUgiaoQsAGicQ3vmnU2DXliajW9XnwdhKykRI1nPVJYrJaIQ/640?wx_fmt=jpeg&wxfrom=5&wx_lazy=1
            var fileExt = url.substring(url.lastIndexOf('.') + 1);
            if (unGifExt.indexOf(fileExt) != -1) {
                showInfoTip('只能输入 gif 网页图片地址');
                //console.log('非图片网页 : ' + url);
                return false;
            }
        }
        downloadRemoteImage();
    }
    else {
        showInfoTip('请输入图片地址');
    }
}
function getUrlArgs(url) {
    var a, args, i, len, part, parts, s;
    if (!url) {
    	url = window.location.href;
    }
    s = url.split("?")[1];
    if (!s) {
	    //加载默认图片
	    loadImage('../uploads/default.gif', true);
       	return {};
    }
    parts = s.split('&');
    args = {};
    for (i = 0, len = parts.length; i < len; i++) {
       a = parts[i];
       part = a.split('=');
       args[part[0]] = part[1];
    }
    return args;
}
//
function sendExtensionMessage(extensionId, event, data, callback) {
 	if (!extensionId) {
   		//console.warn("sending extension message failed -- can't find extension id");
   		//加载默认图片
	    loadImage('../uploads/default.gif', true);
   		return false;
 	}
 	var msg = {event: event};
 	for (k in data) {
   		msg[k] = data[k];
 	}
 	//console.log("try sending extension message to #{extensionId}",msg);
 	var _d = {
 		event:event
 	};
 	for(var _key in data){
 		_d[_key] = data[_key];
 	}
 	chrome.runtime.sendMessage(extensionId, _d, function(res){
 		//console.log("res.gifData：",res.gifData);
	    //var gifBase64Data = res.gifData
	    if (res && res.success) {
     		//console.log("sending extension message success");
     		callback(res.gifData);
   		}
   		else {
   			//加载默认图片
	    	loadImage('../uploads/default.gif', true);
     		//console.warn("sending extension message failed -- not handled on extension side");
   		}
   		return true;
	});
}
function downloadRemoteImage(_base64Url) {
	if(_base64Url){
		var _data = {
			'url':_base64Url
		}
	}else{
		var _data = {
			'url':url
		}
	}
    $.ajax({
        type: "POST",
        url: "../crop/downloadRemoteImage",
        //url: "crop/downloadRemoteImage?url=" + $('#url').val(),
        //data: JSON.stringify({ 'url': url  }),
//      data: {'url': url}, //定义全局 url ,因为上传 base64 图片时，make_btn_clk 中会过滤掉头部信息 : data:image/gif;base64  , 此时 base64 会很长，要放在 post 里面
        data:_data,
        type: 'post',
        cache: false,
        //dataType: "json",
        //contentType: 'application/json',
        success: function (data) {//console.log("success");
            if (data.status) {
                fileSaveCallback(data, true);
            }else {
                removeSpinner($('.make-btn'));
                showInfoTip(data.message);
                //前端图片预加载成功后， server 判断发现非 gif 图片后 ：重新加载默认图片
                loadImage('uploads/default.gif', true);
                $('#srcFileName').val('default.gif');
            }
            _hmt.push(['_trackEvent', '点击开始制作正常读取的次数', 'ajax', 'URL正常读取']);
        },
        error: function (status, err) {//console.log("error");
            showInfoTip('上传失败，请刷新页面重试');
            $('.make-btn').addClass('make-btn-warn');
            _hmt.push(['_trackEvent', '点击开始制作错误读取的次数', 'ajax', 'URL读取失败——"链接不正确"']);
        },
        beforeSend: function () {
            disableBtn();
            addSpinner($('.make-btn'));
            hideInfoTip();
            if(_base64Url){
            	loadImage(window.sessionStorage["upimg"]);
            }else{
            	loadImage($('#url').val());
            }
        },
        complete: function () {
            enableBtn();
        }
    });
}

//回车提交
window.addEventListener('keydown', keydownCallback);

function keydownCallback(event) {
    if (event.keyCode === 13) {
        if ($('#url').val() && $('#url').is(":focus")) {
            make_btn_clk();
            //('.make-btn').trigger("click");
        }
    }
    else if (event.keyCode === 86) { // 键盘 ctrl + v : 解决 水印消失有延迟，导致粘贴的文字和水印有重合
        $('#watermark').addClass('w-hide');
        //console.log('Ctrl + V, pasting');
    }
}

function uploadFile() {
    var pic = $("#files").get(0).files[0];
    var formData = new FormData();
    formData.append("file", pic);
    //sendFile(pic);
    /**
     * 必须false才会避开jQuery对 formdata 的默认处理
     * XMLHttpRequest会对 formdata 进行正确的处理
     */
    $.ajax({
        type: "POST",
        url: "../crop/uploadImg",
        data: formData,　　//这里上传的数据使用了formData 对象
        processData: false,
        //必须false才会自动加上正确的Content-Type
        contentType: false,
        cache: false,
        /*dataType: "json",*/
        success: function (data) {
            //console.log(data);
            if (data.status) {//console.log("uploadFile aaa");
                fileSaveCallback(data, true);
            }else {//console.log("uploadFile bbb");
                removeSpinner($('.make-btn'));
                showInfoTip(data.message);
                //server 返回错误后，重新加载默认图片
                loadImage('uploads/default.gif', true);
                $('#srcFileName').val('default.gif');
            }
        },
        error: function (status, err) {
            showInfoTip('上传失败，请刷新页面重试');
            //$('.make-btn-txt').show();
            $('.make-btn').addClass('make-btn-warn');
        },
        beforeSend: function () {
            disableBtn();
            addSpinner($('.make-btn'));
            hideInfoTip();
            previewLocalImage();
        },
        complete: function () {
            //removeSpinner($('.make-btn'));
            enableBtn();
        }
        /* xhr: function () {
         var xhr = $.ajaxSettings.xhr();
         if (onprogress && xhr.upload) {
         xhr.upload.addEventListener("progress", onprogress, false);
         return xhr;
         }
         }*/
    });
}

//imgIsLoaded 图片是否在 server 返回前已预加载
function fileSaveCallback(data, imgIsLoaded) {
    //console.log('UploadedData : ' + JSON.stringify(data));
    //console.log('fileName : ' + data.message.fileSavePath);

    if (!data) {
        showInfoTip('上传失败，请刷新页面重试');
    }
    if (!data.status) {
        showInfoTip(data.message);
    }

    //要放这个位置，前面的代码速度较慢
    //$('.make-btn-txt').hide();
    //$('.make-btn').addClass('make-btn-success');

    //上传成功后清理数据
    $("#files").val('');
    $('#srcFileName').val(data.message.fileName);
    //resetWatermark();

    if (!imgIsLoaded){
    	//console.log(data.message.fileSavePath);
        loadImage(data.message.fileSavePath);
    }
}

function previewLocalImage() {
    var $file = $("#files");
    var fileObj = $file[0];
    var windowURL = window.URL || window.webkitURL;
    var dataURL;
    //var $img = $("#preview");

    if (fileObj && fileObj.files && fileObj.files[0]) {
        dataURL = windowURL.createObjectURL(fileObj.files[0]);
        //$img.attr('src',dataURL);
    } else {
        dataURL = $file.val();
        //var imgObj = document.getElementById("preview");
        // 两个坑:
        // 1、在设置filter属性时，元素必须已经存在在DOM树中，动态创建的Node，也需要在设置属性前加入到DOM中，先设置属性在加入，无效；
        // 2、src属性需要像下面的方式添加，上面的两种方式添加，无效；
        //imgObj.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale)";
        //imgObj.filters.item("DXImageTransform.Microsoft.AlphaImageLoader").src = dataURL;
    }
    loadImage(dataURL, false, true);
}

// 生成随机文件名
function getRand() {
    return parseInt(Math.random() * (999999 - 100000 + 1) + 100000);
}

// 验证图片地址
function checkUrl() {
    // 由于可能有动态生成的图片， 所以此处只验证了地址长度
    if ($('#url').val().length > 5) {
        return true;
    } else {
        alert('请输入有效的图片地址');
        return false;
    }
}

// 取得文件后缀
function getExt(url) {
    if (url.indexOf(".")) {
        var pos = url.lastIndexOf(".") + 1;
        var result = url.substr(pos, url.length);
        return result;
    } else {
        return 'gif';
    }
}

// 载入结果图片
function loadOutputImage(url) {
    var img = new Image(); //创建一个Image对象，实现图片的预下载
    img.onload = function () {
        img.onload = null;
        loadOutputImageCallback(img);
    }
    img.src = url;
}

// 载入结果图片
function loadOutputImageCallback(img) {
    $(img).attr('id', 'source').hide();
    $("#output").html('').removeClass("loading").append($(img));
    $(img).fadeIn("slow");
}

function loadImage(url, isInit, isResetWatermark) {
    //console.log('loadImage - 开始');
    //$("#source-outter").html('请稍候...图片正在下载...').addClass("loadinga");
    //addSpinner($('#source-outter'));
    var img = new Image(); //创建一个Image对象，实现图片的预下载
    //console.log(url);
    img.onload = function () {
        if (typeof instance != 'undefined') {
            instance.cancelSelection();
        }
        $('#srcImgInfo').html(this.width + "*" + this.height); //原图尺寸 提示
        var realSize = [this.width, this.height];
        var zoomSize = getImgZoomSize(this.width, this.height); //获得大图缩减后的尺寸
        if (zoomSize) {
            this.width = zoomSize[0];
            this.height = zoomSize[1];
        }
        //console.log('realSize : ' + realSize); //真实尺寸
        //console.log('zoomSize : ' + zoomSize);

        img.onload = null;
        loadImageCallback(img, realSize, zoomSize);

        //前端图片显示成功后，立即隐藏 loading ，实际上服务端还没返回
        removeSpinner($('.make-btn')); // gif 制作按钮loading 消失
        if (!isInit) {//初始化图片时无需显示成功状态
            $('.make-btn').addClass('make-btn-success');
            if (isResetWatermark) resetWatermark(); //本地上传图片成功后，恢复 url 输入框的水印
        }
    }
    img.onerror = function () {
        removeSpinner($('.download-btn-inner'));
        showInfoTip('无法识别图片来源');
        this.onerror = null;
        //removeSpinner($('#source-outter'));
        //console.log('loadImage - 图片不存在');
    }
    img.src = url;
}

var realSize_static, zoomSize_static;
function loadImageCallback(img, realSize, zoomSize) {
    $(img).attr('id', 'source').hide();
    //removeSpinner($('#source-outter'));
    $("#source-outter").html('').append($(img));
    //$("#source-outter").html('').removeClass("loading").append($(img));
    $(img).fadeIn("slow");
    $('#preview-inner').html('<img style="display:none;" src="' + $('img#source').attr('src') + '" />');
    //x1 = $('#preview-x').val();
    //y1 = $('#preview-y').val();

    realSize_static = realSize;
    zoomSize_static = zoomSize;
    instance = $('img#source').imgAreaSelect({
        instance: true,
        onInit: init,
        onSelectEnd: onSelectEnd,
        onSelectChange: onSelectChange,
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 10,
        keys: true,
        minHeight: 10,
        minWidth: 10,
        handles: true,
        persistent: true,
        fadeSpeed: 200
        /* ,imageWidth:608,
         imageHeight:461*/
    });
    if (zoomSize) {
        instance.setOptions({imageWidth: realSize[0], imageHeight: realSize[1]});
    }
    setSelection(realSize, zoomSize);
}

function onSelectChange(img, selection) {
    if (selection.width > 0 && selection.height > 0) {
        $('.download-btn').removeClass('inactive');
        //$('#cut').attr('disabled', false);
    } else {
        $('.download-btn').addClass('inactive');
        //$('#cut').attr('disabled', true);
    }
    onSelectEnd(img, selection);
}

// 同步预览
function onSelectEnd(img, selection) {
    if (!selection.width || !selection.height) return;
    preview(img, selection);
    setSelectionValue(selection); //设置隐藏域的值，以提交给 server
}

// 预览图片
function preview(img, selection) {
    // 如果大图缩放: 预览图也需要缩放显示
    // 注意 selection 返回原始图片的属性！，如 selection.width : 对应大图的截取区域宽，而不是 firebug 显示的数字 ！
    //console.log('preview - selection- width:'+selection.width);

    //裁剪尺寸 的提示
    $('#previewImgInfo').html(parseInt(selection.width) + "*" + parseInt(selection.height));
    var rateWidth = 1, rateHeight = 1;
    if (zoomSize_static) {
        $('#preview-inner img').css({"width": zoomSize_static[0], "height": zoomSize_static[1]});

        var rateWidth = zoomSize_static[0] / realSize_static[0];
        var rateHeight = zoomSize_static[1] / realSize_static[1];

        $('#preview-inner').css({
            width: Math.round(selection.width * rateWidth),
            height: Math.round(selection.height * rateHeight)
        });

        $('#preview-inner img').css({
            marginLeft: -Math.round(selection.x1 / realSize_static[0] * zoomSize_static[0]),
            marginTop: -Math.round(selection.y1 / realSize_static[1] * zoomSize_static[1])
            //这个也可以
            //marginLeft: -Math.round(rateWidth * selection.x1),
            //marginTop: -Math.round(rateHeight * selection.y1)
        }).show();

    }
    else {
        $('#preview-inner').css({
            width: Math.round(selection.width),
            height: Math.round(selection.height)
        });

        $('#preview-inner img').css({
            marginLeft: -Math.round(selection.x1),
            marginTop: -Math.round(selection.y1)
        }).show();
    }

    //预览图水平垂直居中
    var marginLeft = (containerWidth - parseInt(selection.width * rateWidth)) / 2;
    var marginTop = (containerHeight - parseInt(selection.height * rateHeight)) / 2;
    $('.img-preview-align-center').css({
        "margin-left": marginLeft,
        "margin-top": marginTop
    });
}

// 初始化
function init(img, selection) {
    if (!selection.width || !selection.height) return;
    preview(img, selection);
    setSelectionValue(selection);
    if (selection.width > 0 && selection.height > 0) {
        $('.download-btn').removeClass('inactive');
        //$('#cut').attr('disabled', false);
    } else {
        $('.download-btn').addClass('inactive');
        //$('#cut').attr('disabled', true);
    }
}

//设置隐藏域值，以提交给 server
function setSelectionValue(selection) {
    $("#x").val(parseInt(selection.x1));
    $("#y").val(parseInt(selection.y1));
    $("#x2").val(parseInt(selection.x2));
    $("#y2").val(parseInt(selection.y2));
    $("#w").val(parseInt(selection.width));
    $("#h").val(parseInt(selection.height));

    /* $('#labelX').val(selection.x);
     $('#labelY').val(selection.y);
     $('#labelX2').val(selection.x2);
     $('#labelY2').val(selection.y2);
     $('#labelW').val(selection.w);
     $('#labelH').val(selection.h);*/
}

// 修改选定框尺寸
function setSelection(realSize, zoomSize) {
    x1 = 0; //parseInt($('#preview-x').val());
    y1 = 0; //parseInt($('#preview-y').val());
    width = 50; //parseInt($('#preview-width').val());
    height = 50; //parseInt($('#preview-height').val());

    if (zoomSize) realSize = zoomSize;
    var preview_width = Math.floor(realSize[0] - realSize[0] / 8);
    var preview_height = Math.floor(realSize[1] - realSize[1] / 8);
    var x1 = Math.floor(realSize[0] / 8);
    var y1 = Math.floor(realSize[1] / 8);
    var x2 = preview_width;
    var y2 = preview_height;

    //instance.setSelection(x1, y1, x1 + width, y1 + height, true);
    instance.setSelection(x1, y1, x2, y2, true);
    instance.update();
    init($('img#source'), instance.getSelection());
}

// 选择尺寸
function changeRadio(tw, th) {
    if (tw <= (document.getElementById("i_w").value) && th <= (document.getElementById("i_h").value)) {
        //document.getElementById("preview-width").value=obj.value;
        $('#preview-width').val(tw);
        $('#preview-height').val(th);
        setSelection();
    } else {
        alert("选择尺寸超出图片本身大小！");
    }
}

function onprogress(evt) {
    var loaded = evt.loaded;                  //已经上传大小情况
    var tot = evt.total;                      //附件总大小
    var per = Math.floor(100 * loaded / tot);      //已经上传的百分比
    //$("#son").html(per + "%");
    //$("#son").css("width", per + "%");

    $(".make-btn").val(per + "%");
    //$(".make-btn").css("width", per + "%");

    setTimeout(function () {
        if (per == 100) {
            $(".make-btn").val('制作gif');
            enableBtn();
        }
    }, 500);
}

//图片等比缩放
function imgZoom(id) {
    var width, height;
    /* var maxWidth = $(id).width(), maxHeight = $(id).height(); // 容器的宽度和高度*/
    var maxWidth = 453, maxHeight = 363;

    $(id + ' img').each(function (index, img) {
        var imgWidth = $(this).width(),
            imgHeight = $(this).height();

        if (imgWidth > maxWidth || imgHeight > maxHeight) {
            var rateWidth = imgWidth / maxWidth;
            var rateHeight = imgHeight / maxHeight;

            if (rateWidth > rateHeight) {
                width = maxWidth;
                height = Math.round(imgHeight / rateWidth);
            } else {
                width = Math.round(imgWidth / rateHeight);
                height = maxHeight;
            }
            $(this).css({"width": width, "height": height});
            //$(this).css({ "left": Math.round((maxWidth - param.width) / 2), "top": Math.round((maxHeight - param.height) / 2) });
        }

        // 如果图片自身宽度大于容器的宽度的话 那么高度等比例缩放
        /*if (imgWidth > maxWidth) {
         var height = imgHeight * maxWidth / imgWidth;
         $(this).css({ "width": maxWidth, "height": height });
         }*/
    });
}

//返回缩放后的图片尺寸
function getImgZoomSize(imgWidth, imgHeight) {
    var width, height;

    if (imgWidth > containerWidth || imgHeight > containerHeight) {
        var rateWidth = imgWidth / containerWidth;
        var rateHeight = imgHeight / containerHeight;

        if (rateWidth > rateHeight) {
            width = containerWidth;
            height = Math.round(imgHeight / rateWidth);
        } else {
            width = Math.round(imgWidth / rateHeight);
            height = containerHeight;
        }
        return [width, height];
    }
    return null;
}

//恢复水印
function resetWatermark() {
    $('#url').val('');
    var place = document.getElementById("watermark");
    place.className = place.className.replace(" w-active", "").replace(" w-hide", "");
}

function enableBtn() {
    $('.make-btn').removeClass("inactive");            //制作 gif 按钮
    $('.download-btn-inner').removeClass("inactive");         //确定下载 按钮
    $('.watermark-upload-icon').removeClass("inactive"); //上传按钮
}

function disableBtn() {
    $('.make-btn').addClass('inactive'); //禁用超链接   //制作 gif 按钮
    $('.download-btn-inner').addClass('inactive');             //确定下载 按钮
    $('.watermark-upload-icon').addClass("inactive");     //上传按钮
}

function showInfoTip(info) {
    $(".watermark-outer").shake({
        times: 2,
        distance: 4,
        speed: 70
    });
    $(".err-info-outer").css("visibility", "visible");
    $(".err-info").html(info);

    $('.make-btn-txt').hide();
    hideBtnTip();
    $('.make-btn').addClass('make-btn-warn');
    /*$("#error").css("visibility", "visible");
     $("#error").fadeTo(30, .45); //变暗
     $("#error").fadeIn(500);
     $("#error").html(info);*/
}

function showUploadTxt() {
    $(".err-info-outer").css("visibility", "hidden");
    $(".err-info").html('');
    hideBtnTip();
    $('.make-btn-txt').show();
}

function hideInfoTip() {
    $(".err-info-outer").css("visibility", "hidden");
    $(".err-info").html('');

    $('.make-btn-txt').hide();
    hideBtnTip();
    /*$("#error").css("visibility", "hidden");
     $("#error").fadeOut(500);
     $("#error").html('');*/
}

function hideBtnTip() {
    var btn = $('.make-btn');
    if (btn.hasClass("make-btn-success")) btn.removeClass("make-btn-success");
    if (btn.hasClass("make-btn-warn")) btn.removeClass("make-btn-warn");
}

function addSpinner(el, static_pos) {
    var spinner = el.children('.spinner');
    if (spinner.length && !spinner.hasClass('spinner-remove')) return null;
    !spinner.length && (spinner = $('<div class="spinner' + (static_pos ? ' spinner-absolute' : '') + '"/>').appendTo(el));
    animateSpinner(spinner, 'add');
}

function removeSpinner(el, complete) {
    var spinner = el.children('.spinner');
    spinner.length && animateSpinner(spinner, 'remove', complete);
}

function animateSpinner(el, animation, complete) {
    if (el.data('animating')) {
        el.removeClass(el.data('animating')).data('animating', null);
        el.data('animationTimeout') && clearTimeout(el.data('animationTimeout'));
    }
    el.addClass('spinner-' + animation).data('animating', 'spinner-' + animation);
    el.data('animationTimeout', setTimeout(function () {
        animation == 'remove' && el.remove();
        complete && complete();
    }, parseFloat(el.css('animation-duration')) * 10));
}

//支持 IP，域名（domain），ftp，二级域名，域名中的文件，域名加上端口
function isURL(str_url) {
    var reg = /^((http|https|ftp):\/\/)?(\w(\:\w)?@)?([0-9a-z_-]+\.)*?([a-z0-9-]+\.[a-z]{2,6}(\.[a-z]{2})?(\:[0-9]{2,6})?)((\/[^?#<>\/\\*":]*)+(\?[^#]*)?(#.*)?)?$/i;
    var re = new RegExp(reg);
    //console.log(re.test());
    if (re.test(str_url)) {
        return (true);
    } else {
        return (false);
    }
}

function getNaturalWidth(img) {
    var image = new Image()
    image.src = img.src
    var naturalWidth = image.width
    return naturalWidth
}

function getImgNaturalDimensions(img, callback) {
    var nWidth, nHeight
    if (img.naturalWidth) { // 现代浏览器
        nWidth = img.naturalWidth
        nHeight = img.naturalHeight
    } else { // IE6/7/8
        var imgae = new Image()
        image.src = img.src
        image.onload = function () {
            callback(image.width, image.height)
        }
    }
    return [nWidth, nHeight]
}
