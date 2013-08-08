/* RUN THIS WHEN THE DOCUMENT LOADS */

$(function() {
	
	var rP = setInterval(resizePanel, 100)

	
	
});
// function runProgress() {
	// TolitoProgressBar('progressbar')
 //                    .setOuterTheme('b')
 //                    .setInnerTheme('e')
 //                    .isMini(false)
 //                    .setMax(1000)
 //                    .setStartFrom(0)
 //                    .setInterval(10)
 //                    .showCounter(true)
 //                    .logOptions()
 //                    .build();
 //                    .run();

 //    $(document)
 //            .on('complete', '#progressbar', function () {
 //                $("#whileUploading").hide()
 //                $("#afterUploading").show()
 //        });
// }



function resizePanel(){
	var o = getOrientation()
	var mpsize;
	if (o=='landscape'){
		var ww = $(window).width();
		var wh = $(window).height();
		mpsize = Math.min((ww-190)/2, (wh-50)/2)
	}else{
		var wh = $(window).height();
		var ww = $(window).width();
		mpsize = Math.min((wh-190)/2, (ww-50)/2)
	}
	$('.mixPanel').height(mpsize);
	$('.mixPanel').width(mpsize)
	$('.mixPanel a').center();
}

jQuery.fn.center = function () {
    
    this.css("position","absolute");
    this.css("top", ((this.parent().height() - this.outerHeight()) / 2) + this.parent().scrollTop() + "px");
    this.css("left", ((this.parent().width() - this.outerWidth()) / 2) + this.parent().scrollLeft() + "px");
    return this;
}
 function getOrientation(){
 	return Math.abs(window.orientation) == 90 ? 'landscape' : 'portrait';
 }