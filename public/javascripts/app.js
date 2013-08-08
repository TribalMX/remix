jQuery(function ($){

  var Util = {
    Collection: function(settings) {
      var newCollection = function() {
        var collection = [];
        var url = settings.url;
        for (var key in settings.method) {
          this[key] = settings.method[key]; 
        }
        this.fetch = function(query, options) {
          $.ajax({
            url: url,
            type: "GET",
            data: {
              limit: options.limit,
              date_lt: options.date_lt,
              data_gt: options.date_gt

            },
            success: function(models){
              collection = models;
              options.success(models);
            }
          });
        };
        this.get = function() {
          return collection;
        };
      };
      return newCollection;
    },
    Model: function(settings) {
      var newModel = function() {
        var model = {};
        var url = settings.url; 
        this.save = function(detail, options){
          $.ajax({
            url: url,
            type: "POST",
            data: detail,
            success: function(model) {
              model = model;
              options.success(model);
            }
          });
        };
        this.get = function(id, options){
          //ajax get request
        };
      };
      return newModel;
    }
  };

  var App = {
    init: function() {

      //Create collections and models
      this.Remixes = Util.Collection({url: "/api/remixes"});
      this.publicRemixes = Util.Collection({url: "/api/public/remixes"});
      this.Clips = Util.Collection({url: "/api/clips"});
      this.Remix = Util.Model({url: "/api/remixes"});
      this.Clip = Util.Model({url: "/api/clips"});

      //local variables
      this.publicRemixes = new this.publicRemixes();
      this.remixes = new this.Remixes();
      this.clips = new this.Clips();

      this.mixpanel = {
        selectedPanel: null,
        panel1: null,
        panel2: null,
        panel3: null,
        panel4: null
      };
      this.myMixTab = false;
      this.remixesCursor = -1;
      this.pubRemixesCursor = -1;


      this.cacheElements();
      this.bindEvents();
      this.loadRecentMixes();
      this.loadMyMixes();
      this.loadClips();
    },
    cacheElements: function() {
      //main page
      this.$main = $('#home1');
      this.$prevRemix = this.$main.find('#prevRemix');
      this.$nextRemix = this.$main.find('#nextRemix');
      this.$mixSlider = this.$main.find('#mixSlider');
      this.$newMixBtn = this.$main.find('#newMixBtn');
      this.$newClipBtn = this.$main.find('#newClipBtn');
      this.$newClip = this.$main.find('#newClip');

      //newMix page
      this.$newMix = $('#newMix');
      this.$mixTitle =this.$newMix.find('#mixTitle');
      this.$panel1 = this.$newMix.find('#panel1');
      this.$panel2 = this.$newMix.find('#panel2');
      this.$panel3 = this.$newMix.find('#panel3');
      this.$panel4 = this.$newMix.find('#panel4');
      this.$createMix = this.$newMix.find('#createMix');
      this.$cancelCreateMix = this.$newMix.find('#cancelCreateMix');

      //clipLibrary page
      this.$clipLibrary = $('#clipLibrary');
      this.$clipContainer = this.$clipLibrary.find('#clipContainer');
      this.$moreClipsBtn = this.$clipLibrary.find('#moreClipsButton');
      this.$closeLibrary = this.$clipLibrary.find('#closeLibrary');

      //newClip page
      this.$newClip = $('#newClip');
      this.$fileInput = this.$newClip.find('#fileInput');
      this.$upload = this.$newClip.find('#upload');
      this.$cancelNewClip = this.$newClip.find('#cancelNewClip'); 

      //uploadingClip page
      this.$uploadingClip = $('#uploadingClip');
      this.$progressbar = this.$uploadingClip.find('#progressbar');
      this.$backHome = this.$uploadingClip.find('#backHome');
    },
    bindEvents: function() {
      //main page
      // this.$newMixBtn.on('click', this.initMixPanel);
      this.$nextRemix.on('click', this.slideNext);
      this.$prevRemix.on('click', this.slidePrev);

      //newMix page
      this.$newMix.on('click', '.addClip', this.selectPanel);
      this.$createMix.on('click', this.createMix);
      this.$cancelCreateMix.on('click', this.cancelMixing);

      //clipLibrary page
      this.$clipLibrary.on('click', '.clip', this.addToMixPanel);

      //newClip page

      //uploadingClip page

    },
    loadRecentMixes: function() {
      var $mixSlider = this.$mixSlider;
      App.$prevRemix.hide();
      //fetch remixes
      this.publicRemixes.fetch({

      }, {
        success: function(remixes){
          for(var i=0; i < remixes.length && i < 2; i++) {
            if(i == 0) {
              $mix = App.$mixSlider.find('.mix:nth-child(2)');
            } else {
              $mix = App.$mixSlider.find('.mix:nth-child(3)');
            }
            App.loadRemix(remixes[i], $mix);
          }
          App.pubRemixesCursor = 0;
          if(remixes.length == 1) App.$nextRemix.hide();
          console.log("public Remixes");
          console.log(remixes);
      }});
    },
    loadMyMixes: function() {
      var $mixSlider = this.$mixSlider;
      App.$prevRemix.hide();
      //fetch remixes
      this.remixes.fetch({

      }, {
        success: function(remixes){
          for(var i=0; i < remixes.length && i < 2; i++) {
            if(i == 0) {
              $mix = App.$mixSlider.find('.mix:nth-child(2)');
            } else {
              $mix = App.$mixSlider.find('.mix:nth-child(3)');
            }
            App.loadRemix(remixes[i], $mix);
          }
          App.pubRemixesCursor = 0;
          if(remixes.length == 1) App.$nextRemix.hide();
          console.log("My Remixes");
          console.log(remixes);
      }});
    },
    loadClips: function() {
      var $clipContainer = this.$clipContainer;

      //fetch clips
      this.clips.fetch(null, {success: function(clips){
        $clipContainer.html('');
        for( var i =0; i < clips.length; i++) {
          var gifUrl = clips[i].gif;
          var $clip = $('<a class="clip" href="#newMix"><img src="'+ gifUrl +'" /></a>'); 
          $clip.data("obj", clips[i]);
          $clip.appendTo($clipContainer);
        }
        console.log("my Clips");
        console.log(clips);
      }});
    },
    loadRemix: function(remix, $mix) {
      var clips = remix.clips;
      $mix.find('.mixPanel1').data('clip',clips[0]);
      $mix.find('.mixPanel2').data('clip',clips[1]);
      $mix.find('.mixPanel3').data('clip',clips[2]);
      $mix.find('.mixPanel4').data('clip',clips[3]);
      $mix.find('.mixPanel1').css("background", "url('"+clips[0].gif+"') no-repeat");
      $mix.find('.mixPanel2').css("background", "url('"+clips[1].gif+"') no-repeat");
      $mix.find('.mixPanel3').css("background", "url('"+clips[2].gif+"') no-repeat");
      $mix.find('.mixPanel4').css("background", "url('"+clips[3].gif+"') no-repeat");
      $mix.addClass('loaded');
    },

    // Main Page Functionalities

    slideNext: function() {
      var str = '<div class="mix" style="display: none">'
        + '    <div class="row1">'
        + '        <div class="mixPanel mixPanel1"></div>'
        + '        <div class="mixPanel mixPanel2"></div>'
        + '    </div>'
        + '    <div class="row2">'
        + '        <div class="mixPanel mixPanel3"></div>'
        + '        <div class="mixPanel mixPanel4"></div>'
        + '    </div>'
        + '</div>';
      var cursor = App.pubRemixesCursor;
      console.log("before next cursor: " + cursor);
      var remixes = App.publicRemixes.get();
      if(cursor < 0 || cursor >= remixes.length) return;
      if(cursor == 0) App.$prevRemix.show();
      if (cursor < remixes.length-1){
        App.$mixSlider.append(str);
        // App.$mixSlider.find('.mix:nth-child(2)').slideUp();
        // App.$mixSlider.find('.mix:nth-child(3)').slideDown();
        App.$mixSlider.find('.mix:nth-child(2)').hide();
        App.$mixSlider.find('.mix:nth-child(3)').show();
        App.$mixSlider.find('.mix:nth-child(1)').remove();
        App.pubRemixesCursor = ++cursor;
      }
      if(cursor < remixes.length-1) {
        //load last hidden item
        App.loadRemix(remixes[cursor + 1], App.$mixSlider.find('.mix:nth-child(3)'));
      } else if (cursor == remixes.length-1){
        //last item is not loaded
        //cursor is on the last index
        //
        //Load More
        //hide next button here;
        App.$nextRemix.hide();
        // alert("Need to Load more");
      }
      console.log("after next cursor: " + App.pubRemixesCursor);

    }, 
    slidePrev: function() {
      var str = '<div class="mix" style="display: none">'
        + '    <div class="row1">'
        + '        <div class="mixPanel mixPanel1"></div>'
        + '        <div class="mixPanel mixPanel2"></div>'
        + '    </div>'
        + '    <div class="row2">'
        + '        <div class="mixPanel mixPanel3"></div>'
        + '        <div class="mixPanel mixPanel4"></div>'
        + '    </div>'
        + '</div>';
      var cursor = App.pubRemixesCursor;
      console.log("before prev cursor: " + cursor);
      var remixes = App.publicRemixes.get();
      if(cursor <= 0 || cursor >= remixes.length) return;
      if(cursor == remixes.length-1) App.$nextRemix.show();
      if (cursor > 0){
        // App.$mixSlider.find('.mix:nth-child(1)').slideDown();
        // App.$mixSlider.find('.mix:nth-child(2)').slideUp();
        App.$mixSlider.find('.mix:nth-child(1)').show();
        App.$mixSlider.find('.mix:nth-child(2)').hide();
        App.$mixSlider.find('.mix:nth-child(3)').remove();
        App.$mixSlider.prepend(str);
        App.pubRemixesCursor = --cursor;
      }
      if(cursor > 0) {
        //load first hidden item
        App.loadRemix(remixes[cursor - 1], App.$mixSlider.find('.mix:nth-child(1)'));
      } else if (cursor == 0){
        //first item is not loaded
        //cursor is on the first(0) index
        //
        //Load latest (Recent)
        //hide prev button here;
        App.$prevRemix.hide();
        // alert("Need to Load more");
      }
      console.log("after next cursor: " + App.pubRemixesCursor);
    },

    //Mixing Functionalities

    selectPanel: function() {
      App.mixpanel['selectedPanel'] = $(this).closest('.mixPanel').attr('id');
    },
    addToMixPanel: function() {
      var clip = $(this).data("obj");
      var panelId = App.mixpanel['selectedPanel'];
      App.mixpanel[panelId] = clip;
      App['$'+ panelId].css("background", "url('"+clip.gif+"') no-repeat");
      console.log(App.mixpanel);
    },
    createMix: function () {
      var clips = [App.mixpanel['panel1'], App.mixpanel['panel2'], App.mixpanel['panel3'], App.mixpanel['panel4']];
      var title = App.$mixTitle.val();
      if(clips[0] && clips[1] && clips[2] && clips[3]) {
        if(!title) title = "Remix";
        var remix = new App.Remix(); 
        remix.save({title: title, clips: clips}, {
          success: function(remix) {
            App.clearMixPanel();
            console.log(remix); 
          }
        }); 
      }
    },
    clearMixPanel: function() {
      this.mixpanel = {
        selectedPanel: "", // panel id
        panel1: null, // clip object
        panel2: null,
        panel3: null,
        panel4: null
      };
      App.$mixTitle.val('');
      App.$panel1.css("background", "");
      App.$panel2.css("background", "");
      App.$panel3.css("background", "");
      App.$panel4.css("background", "");
      console.log(this.mixpanel);
    }, 
    cancelMixing: function() {
      App.clearMixPanel()
    }

  };
  App.init();
});