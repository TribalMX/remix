/* RUN THIS WHEN THE DOCUMENT LOADS */
$(function() {
    resizePanel();
    $(window).resize(function() {
        resizePanel();
    });
    var oldLocation = location.href;
    setInterval(function() {
        if(location.href != oldLocation) {
            resizePanel();
        oldLocation = location.href
        }
    }, 100);
    $('.banner').on('click', gotoMain);
});
function gotoMain(){
    window.location.replace('/');
}
//Global object for slider css properties
var Slider = {
    left: 0,
    width: 0,
    resize: resizePanel
}

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
    Slider.width = $(window).width()-10;
    $('#mixSlider .mix').width($(window).width()-20); //-10px for right left -5px padding
    $('#mixSlider').height(mpsize*2+62+15);

    //set position for mixes in mix slide
    $('#main #mixSlider').find('.mix:nth-child(1)').css('left', -Slider.width);
    $('#main #mixSlider').find('.mix:nth-child(2)').css('left', 5);
    $('#main #mixSlider').find('.mix:nth-child(3)').css('left', Slider.width+10);

    $('.mixPanel').height(mpsize);
    $('.mixPanel').width(mpsize)
    $('.mixPanel a').center();
    $('#clipWrapper img').height(mpsize*2);
    $('#clipWrapper img').width(mpsize*2);
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