//Login page functionality
jQuery(function ($){
  var Main = {
    init: function() {
      this.remixes = [];
      this.cacheElements();
      this.bindEvents();
      this.fetchMixes();
      this.mixTemplate = '<div class="mix" style="display: none">'
                + '    <div class="row1">'
                + '        <div class="mixPanel mixPanel1"></div>'
                + '        <div class="mixPanel mixPanel2"></div>'
                + '    </div>'
                + '    <div class="row2">'
                + '        <div class="mixPanel mixPanel3"></div>'
                + '        <div class="mixPanel mixPanel4"></div>'
                + '    </div>'
                + '    <div class="titleRow"></div>'
                + '</div>';
      this.curMix = null;
    },
    cacheElements: function() {
      this.$main = $('#main');
      this.$loginForm = this.$main.find('#loginForm');
      this.$mixSlider = this.$main.find('#mixSlider');
      this.$prevRemix = this.$main.find('#prevRemix');
      this.$nextRemix = this.$main.find('#nextRemix');
    },
    bindEvents: function() {
      this.$loginForm.on('submit', this.login);
      this.$prevRemix.on('click', this.prevRemix);
      this.$nextRemix.on('click', this.nextRemix);
    },
    login: function(event) {
      event.preventDefault();
      $.ajax({
        type: 'POST',
        url: '/login',
        data: $(this).serialize(),
        success: function(result) {
          if(result.user){
            window.location.replace('/');
          } else {
            alert("wrong Password");
          }
        }
      });
    },
    fetchMixes: function() {
      $.ajax({
        type: "GET",
        url: "/api/public/remixes",
        data: {limit: 10, featured: true},
        beforeSend: function() {
         $.mobile.loading( 'show', {textVisible: true, theme: 'b'});
        },
        success: function(remixes) {
          if(remixes.length > 0){
            Main.remixes = remixes;
            Main.$mixSlider.html('');
            for(var i = 0; i < remixes.length; i++) {
              $mix = $(Main.mixTemplate);
              Main.loadRemix(remixes[i], $mix);
              $mix.appendTo(Main.$mixSlider);
            }
            Main.$prevRemix.hide();
            Main.$nextRemix.show();
          } else {
            $mix = $(Main.mixTemplate);
            $mix.appendTo(Main.$mixSlider);
            Main.$prevRemix.hide();
            Main.$nextRemix.hide();
          }
          console.log('FetchMixes: ');
          console.log(remixes);
        },
        complete: function() {
          Main.curMix = Main.$mixSlider.find('.mix').first();
          Main.curMix.show();
          $.mobile.loading( 'hide', {textVisible: true, theme: 'b'});
        },
      });
    },
    loadRemix: function(remix, $mix) {
      var clips = remix.clips;
      $mix.find('.mixPanel1').css("background", "url('"+clips[0].gif+"') no-repeat");
      $mix.find('.mixPanel2').css("background", "url('"+clips[1].gif+"') no-repeat");
      $mix.find('.mixPanel3').css("background", "url('"+clips[2].gif+"') no-repeat");
      $mix.find('.mixPanel4').css("background", "url('"+clips[3].gif+"') no-repeat");      
      $mix.find('.titleRow').html(''+remix.title);

    },
    nextRemix: function() {
      var curMix = Main.curMix; 
      var mixes = Main.$mixSlider.find('.mix');
      var curIndex = mixes.index(curMix[0]);
      if (curIndex == 0) Main.$prevRemix.show();
      if(curIndex < (mixes.length -1)) {
        Main.curMix = mixes.eq(curIndex+1);
        curMix.hide();
        Main.curMix.show();
      } else if (curIndex == (mixes.length-1)){
        var data = {
          limit: 5,
          date_lt: Main.remixes[Main.remixes.length-1].created_at,
          featured: true
        };
        $.ajax({
          type: "GET",
          url: "/api/public/remixes",
          data: data,
          beforeSend: function() {  
            $.mobile.loading( 'show', {textVisible: true, theme: 'b'});
            Main.$nextRemix.hide();
          },
          success: function(remixes) {
            if(remixes.length > 0) {
              console.log(remixes);
              Main.remixes = Main.remixes.concat(remixes);
              for(var i = 0; i < remixes.length; i++) {
                $mix = $(Main.mixTemplate);
                Main.loadRemix(remixes[i], $mix);
                $mix.appendTo(Main.$mixSlider);
              }
              mixes = Main.$mixSlider.find('.mix');
              Main.curMix = mixes.eq(curIndex+1);
              curMix.hide();
              Main.curMix.show();
              Main.$nextRemix.show();
            }
          }, 
          complete: function() {
            $.mobile.loading( 'hide', {textVisible: true, theme: 'b'}); 
          }
        });
      }
    },
    prevRemix: function() {
      var curMix = Main.curMix; 
      var mixes = Main.$mixSlider.find('.mix');
      var curIndex = mixes.index(curMix[0]);
      if (curIndex == (mixes.length-1)) Main.$nextRemix.show();
      if (curIndex == 1) Main.$prevRemix.hide();
      if(curIndex > 0) {
        Main.curMix = mixes.eq(curIndex-1);
        curMix.hide();
        Main.curMix.show();
      }
    },
  };
  Main.init();
});