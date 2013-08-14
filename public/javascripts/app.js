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
            data: query,
            success: function(models){
              collection = models;
              options.success(models);
            },
            beforeSend: options.beforeSend, 
            complete: options.complete
          });
        };
        this.fetchAndAppend = function (query, options) {
          $.ajax({
            url: url,
            type: "GET",
            data: query,
            success: function(models){
              collection = collection.concat(models);
              options.success(models);
            },
            beforeSend: options.beforeSend, 
            complete: options.complete
          });
        };
        this.get = function() {
          return collection;
        };
        this.unshift = function(model) {
          collection.unshift(model);
        }
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
            },
            beforeSend: options.beforeSend, 
            complete: options.complete
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

      //User
      this.user = {};

      //For main
      this.selectedTab = "recent"; //recent or my
      this.remixesCursor = -1;
      this.pubRemixesCursor = -1;

      //For new mix
      this.mixpanel = {
        selectedPanel: null,
        panel1: null,
        panel2: null,
        panel3: null,
        panel4: null
      };

      //For uploading
      this.selectedFile = null;
      this.uploader = null;

      this.isLoginPage = ($('#loginPage').length > 0);

      //initiate
      if(this.isLoginPage) {
        this.cacheElements();
        this.bindEvents();
        this.fetchRecentMixes();
      } else {
        this.cacheElements();
        this.bindEvents();
        this.fetchRecentMixes();
        this.fetchMyMixes();
        this.fetchClips();
      }
    },
    cacheElements: function() {
      //main page
      this.$main = $('#main');
      this.$prevRemix = this.$main.find('#prevRemix');
      this.$nextRemix = this.$main.find('#nextRemix');
      this.$mixSlider = this.$main.find('#mixSlider');
      this.$newMixBtn = this.$main.find('#newMixBtn');
      this.$newClipBtn = this.$main.find('#newClipBtn');
      this.$newClip = this.$main.find('#newClip');
      this.$recentMixes = this.$main.find('#recentMixes');
      this.$myMixes = this.$main.find('#myMixes');
      this.$username = this.$main.find("#username"); //Temp

      if(!App.isLoginPage){
        //clip page
        this.$clip = $('#clip');
        this.$clipWrapper = this.$clip.find('#clipWrapper');
        this.$saveClip = this.$clip.find('#saveClip');
        this.$savingClip = this.$clip.find('#savingClip');
        this.$savedClip = this.$clip.find('#savedClip');
        this.$backFromClip = this.$clip.find('#backFromClip');

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
        this.$moreClipsBtn = this.$clipLibrary.find('#moreClipsBtn');
        this.$closeLibrary = this.$clipLibrary.find('#closeLibrary');

        //newClip page
        this.$newClip = $('#newClip');
        this.$fileInput = this.$newClip.find('#fileInput');
        this.$upload = this.$newClip.find('#upload');
        this.$cancelNewClip = this.$newClip.find('#cancelNewClip'); 

        //uploadingClip page
        this.$uploadingClip = $('#uploadingClip');
        this.$progressbar = this.$uploadingClip.find('#progressbar');
        this.$cancelUploading = this.$uploadingClip.find('#cancelUploading');
        this.$whileUploading = this.$uploadingClip.find('#whileUploading');
        this.$afterUploading = this.$uploadingClip.find('#afterUploading');
        this.$backHome = this.$uploadingClip.find('#backHome');
      }
    },
    bindEvents: function() {
      //main page
      this.$nextRemix.on('click', this.slideNext);
      this.$prevRemix.on('click', this.slidePrev);
      this.$recentMixes.on('click', this.selectRecentMixes);
      this.$myMixes.on('click', this.selectMyMixes);

      if(!App.isLoginPage) {
        this.$mixSlider.on('click', '.mixPanel', this.selectClip);

        //clip page
        this.$saveClip.on('click', this.saveClip);
        this.$backFromClip.on('click', this.backFromClip);

        //newMix page
        this.$newMix.on('click', '.addClip', this.selectPanel);
        this.$createMix.on('click', this.createMix);
        this.$cancelCreateMix.on('click', this.cancelMixing);

        //clipLibrary page
        this.$clipLibrary.on('click', '.clip', this.addToMixPanel);
        this.$clipLibrary.on('click', '.notReady', this.openClipLibrary)
        this.$moreClipsBtn.on('click', this.loadMoreClips);

        //newClip page
        this.$upload.on('click', this.openFileChooser);
        this.$fileInput.on('change', this.startUploading);

        //uploadingClip page
        this.$cancelUploading.on('click', this.cancelUploading);
        this.$backHome.on('click', this.backToHome);
      }
    },

    // Loaders
    fetchRecentMixes: function() {
      var $mixSlider = this.$mixSlider;
      App.$prevRemix.hide();
      // App.$nextRemix.hide();
      //fetch remixes
      this.publicRemixes.fetch({
        limit: 10
      }, {
        success: function(remixes){
          for(var i=0; i < remixes.length && i < 2; i++) {
            if(i == 0) {
              App.pubRemixesCursor = 0;
              $mix = App.$mixSlider.find('.mix:nth-child(2)');
            } else {
              $mix = App.$mixSlider.find('.mix:nth-child(3)');
            }
            App.loadRemix(remixes[i], $mix);
          }
          if(remixes.length > 1) App.$nextRemix.show();
          console.log("public Remixes");
          console.log(remixes);
      }});
    },
    fetchMyMixes: function() {
      var $mixSlider = this.$mixSlider;
      App.$prevRemix.hide();
      // App.$nextRemix.hide();
      //fetch remixes
      this.remixes.fetch({
        limit: 10
      }, {
        success: function(remixes){
          for(var i=0; i < remixes.length && i < 2; i++) {
            if(i == 0) {
              App.remixesCursor = 0;
              $mix = App.$mixSlider.find('.mix:nth-child(2)');
            } else {
              $mix = App.$mixSlider.find('.mix:nth-child(3)');
            }
            App.loadRemix(remixes[i], $mix);
          }
          if(remixes.length > 1) App.$nextRemix.show();
          console.log("My Remixes");
          console.log(remixes);
      }});
    },
    fetchClips: function() {
      var $clipContainer = this.$clipContainer;

      //fetch clips
      this.clips.fetch({limit: 10}, {success: function(clips){
        App.loadClips(clips);
        console.log("my Clips");
        console.log(clips);
      }});
    },
    loadClips: function(clips) {
      App.$clipContainer.html('');
      for( var i =0; i < clips.length; i++) {
        var gifUrl = clips[i].gif;
        var onerror = "this.src='/images/agifClip.gif';this.parentNode.className='notReady ui-link';this.parentNode.href='#'";               
        var $clip = $('<a class="clip"><img src="'+ gifUrl +'" onerror="'+onerror+'"/></a>');
        $clip.data("obj", clips[i]);
        $clip.appendTo(App.$clipContainer);
      }
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
    loadMoreClips: function() {
      var clips = App.clips.get();
      //Load More /TODO: show wheeling sign
      App.clips.fetchAndAppend({
        limit: 5,
        date_lt: clips[clips.length-1].created_at
      },{
        success: function(clips){
          if(clips.length > 0) {
            for( var i =0; i < clips.length; i++) {
              var gifUrl = clips[i].gif;
              var onerror = "this.src='/images/agifClip.gif';this.parentNode.className='notReady ui-link';this.parentNode.href='#'";
              var $clip = $('<a class="clip"><img src="'+ gifUrl +'" onerror="'+onerror+'"/></a>');
              $clip.data("obj", clips[i]);
              $clip.appendTo(App.$clipContainer);
            }
          }
          console.log(clips);
        }
      });
    }, 

    // Main Page Functionalities

    selectClip: function() {
      $.mobile.changePage('#clip');

      App.$clip.find('.info').html("Created by ...");
      App.$clipWrapper.data('clip', null);
      App.$clipWrapper.html(''); 


      var clip = $(this).data('clip');
      App.$clipWrapper.data('clip', clip);
      App.$clipWrapper.html('<img class="clip" src="'+clip.gif+'"/>'); 
      //Get creator info 
      $.ajax({
        url: '/api/users/' + clip.created_by,
        success: function(user) {
          App.$clip.find('.info').html("Created by " + user.name);
        },
        beforeSend: function() {
          $.mobile.loading( 'show', {textVisible: true, theme: 'b'});
        },
        complete: function(){
          $.mobile.loading( 'hide', {textVisible: true, theme: 'b'});
          console.log(App.$clipWrapper.data('clip'));
        }
      });
    },
    saveClip: function() {
      var clipData = App.$clipWrapper.data('clip');
      //create a clip and save
      var clip = new App.Clip();
      clip.save({
        videogami_vid: clipData.videogami_vid,
        gif: clipData.gif,
        created_by: clipData.created_by
      },{
        beforeSend: function() {
          App.$saveClip.hide();
          App.$savingClip.show();
        },
        success: function(clip) {
          //Add clip to the collection
          App.clips.unshift(clip);

          //prepend the clip to the library
          var gifUrl = clip.gif;
          var onerror = "this.src='/images/agifClip.gif';this.parentNode.className='notReady ui-link';this.parentNode.href='#'";
          var $clip = $('<a class="clip"><img src="'+ gifUrl +'" onerror="'+onerror+'"/></a>'); 
          $clip.data("obj", clip);
          $clip.prependTo(App.$clipContainer);

          //Clear data on the page
          App.$clip.find('.info').html("Created by ...");
          App.$clipWrapper.data('clip', null);
        },
        complete: function() {
          App.$savingClip.hide();
          App.$savedClip.show();
          console.log(clip);
        }
      }); 
    },
    backFromClip: function() {
      App.$savedClip.hide();
      App.$saveClip.show();
      App.$clipWrapper.html('');
      $.mobile.changePage('#main');
    },
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
      var curType = "pubRemixesCursor";
      var remixes = App.publicRemixes;
      if(App.selectedTab == "my") {
        curType = "remixesCursor";
        remixes = App.remixes;
      }
      var items = remixes.get();
      var cursor = App[curType];
      console.log("before next cursor: " + cursor);
      if(cursor < 0 || cursor >= items.length) return;
      if(cursor == 0) App.$prevRemix.show();

      if (cursor < items.length-1){
        App.$mixSlider.find('.mix:nth-child(2)').slideUp();
        App.$mixSlider.find('.mix:nth-child(3)').slideDown();
        // App.$mixSlider.find('.mix:nth-child(2)').hide();
        // App.$mixSlider.find('.mix:nth-child(3)').show();
        App.$mixSlider.find('.mix').first().remove();
        App.$mixSlider.append(str);
        cursor = cursor + 1;
        App[curType] = cursor;
      }
      if(cursor < items.length-1) {
        //load to next mix which is hidden
        App.loadRemix(items[cursor+1], App.$mixSlider.find('.mix:last'));
      } else if (cursor == items.length-1){
        //hide next button;
        App.$nextRemix.hide();
        //TODO
        //cursor is on the last index
        //
        //Load More /TODO: show wheeling sign
        remixes.fetchAndAppend({
          limit: 5,
          date_lt: items[items.length-1].created_at
        },{
          success: function(result){
            if(result.length > 0) {
              items = remixes.get();
              App.loadRemix(items[cursor+1], App.$mixSlider.find('.mix:last'));
              App.$nextRemix.show();
            }
            console.log(result);
          }
        });
      }
      console.log("after next cursor: " + App[curType]);

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
      var curType = "pubRemixesCursor";
      var remixes = App.publicRemixes;
      if(App.selectedTab == "my") {
        curType = "remixesCursor";
        remixes = App.remixes;
      }
      var items = remixes.get();
      var cursor = App[curType];
      console.log("before prev cursor: " + cursor);
      if(cursor <= 0 || cursor >= items.length) return;
      if(cursor == items.length-1) App.$nextRemix.show();
      if (cursor > 0){
        App.$mixSlider.find('.mix:nth-child(1)').slideDown();
        App.$mixSlider.find('.mix:nth-child(2)').slideUp();
        // App.$mixSlider.find('.mix:nth-child(1)').show();
        // App.$mixSlider.find('.mix:nth-child(2)').hide();
        App.$mixSlider.find('.mix:last').remove();
        App.$mixSlider.prepend(str);
        cursor = cursor - 1;
        App[curType] = cursor;
      }
      if(cursor > 0) {
        //load to prev mix which is hidden
        App.loadRemix(items[cursor - 1], App.$mixSlider.find('.mix:first'));
      } else if (cursor == 0){
        //hide prev;
        App.$prevRemix.hide();
        //TODO
        //cursor is on the first(0) index
        //Load latest (Recent)
      } 
      console.log("after next cursor: " + App[curType]);
    },
    selectRecentMixes: function() {
      if(App.selectedTab != "recent") {
        App.selectedTab = "recent";
        App.$mixSlider.find('.mixPanel').data('clip', null);
        App.$mixSlider.find('.mixPanel').css("background", "");
        App.$mixSlider.find('.mixPanel').removeClass('loaded');

        var cursor = App.pubRemixesCursor;
        var remixes = App.publicRemixes.get();
        if (remixes.length < 1 || cursor < 0) return;

        App.$prevRemix.hide();
        App.$nextRemix.hide();

        $prevMix = App.$mixSlider.find('.mix:nth-child(1)');
        $curMix = App.$mixSlider.find('.mix:nth-child(2)');
        $nextMix = App.$mixSlider.find('.mix:nth-child(3)');

        if(remixes.length == 1) {
          if(cursor == 0) App.loadRemix(remixes[cursor], $curMix);
        } else if (remixes.length > 1){
          if(cursor == 0) {
            App.loadRemix(remixes[cursor], $curMix);
            App.loadRemix(remixes[cursor + 1], $nextMix);
            App.$nextRemix.show();
          } else if(cursor == remixes.length -1) {
            App.loadRemix(remixes[cursor - 1], $prevMix);
            App.loadRemix(remixes[cursor], $curMix);
            App.$prevRemix.show()
          } else {
            App.loadRemix(remixes[cursor - 1], $prevMix);
            App.loadRemix(remixes[cursor], $curMix);
            App.loadRemix(remixes[cursor + 1], $nextMix);
            App.$prevRemix.show();
            App.$nextRemix.show();
          }
        }
        console.log(App.selectedTab);
      }
    },
    selectMyMixes: function() {
      if(App.selectedTab != "my") {
        App.selectedTab = "my";
        App.$mixSlider.find('.mixPanel').data('clip', null);
        App.$mixSlider.find('.mixPanel').css("background", "");
        App.$mixSlider.find('.mixPanel').removeClass('loaded');

        var cursor = App.remixesCursor;
        var remixes = App.remixes.get();

        console.log(App.selectedTab);
        console.log(cursor);
        console.log(remixes);
        //If my remixes is not loaded yet, load
        if(remixes.length < 1 || cursor < 0){
          return;
        }

        App.$prevRemix.hide();
        App.$nextRemix.hide();

        $prevMix = App.$mixSlider.find('.mix:nth-child(1)');
        $curMix = App.$mixSlider.find('.mix:nth-child(2)');
        $nextMix = App.$mixSlider.find('.mix:nth-child(3)');

        if(remixes.length == 1) {
          if(cursor == 0) App.loadRemix(remixes[cursor], $curMix);
        } else if (remixes.length > 1){
          if(cursor == 0) {
            App.loadRemix(remixes[cursor], $curMix);
            App.loadRemix(remixes[cursor + 1], $nextMix);
            App.$nextRemix.show();
          } else if(cursor == remixes.length -1) {
            App.loadRemix(remixes[cursor - 1], $prevMix);
            App.loadRemix(remixes[cursor], $curMix);
            App.$prevRemix.show()
          } else {
            App.loadRemix(remixes[cursor - 1], $prevMix);
            App.loadRemix(remixes[cursor], $curMix);
            App.loadRemix(remixes[cursor + 1], $nextMix);
            App.$prevRemix.show();
            App.$nextRemix.show();
          }
        }
      }
    },

    //Mixing, Clip Library Functionalities

    selectPanel: function() {
      App.mixpanel['selectedPanel'] = $(this).closest('.mixPanel').attr('id');
      App.openClipLibrary();
    },
    openClipLibrary: function() {
      $.mobile.changePage('#clipLibrary');
      
      //Reload notready clips
      App.$clipLibrary.find('.notReady').each(function(){
        var gifUrl = $(this).data('obj').gif;
        $(this).removeClass('notReady');
        $(this).addClass('clip');
        $(this).find('img').attr('src',gifUrl);
      });
    },
    addToMixPanel: function() {
      var clip = $(this).data("obj");
      var panelId = App.mixpanel['selectedPanel'];
      App.mixpanel[panelId] = clip;
      App['$'+ panelId].css("background", "url('"+clip.gif+"') no-repeat");
      console.log(App.mixpanel);
      $.mobile.changePage('#newMix');
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
            //Check if result and input matches
            for (var i =0; i < clips.length; i++ ){
              if (remix.clips[i] == clips[i]._id) remix.clips[i] = clips[i];
            }
            //Add remix to the collection
            App.remixes.unshift(remix);
            App.publicRemixes.unshift(remix);
            App.remixesCursor = 0;
            App.pubRemixesCursor = 0;
            $.mobile.changePage('#main');
            App.selectedTab = "";
            App.$myMixes.click();

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
    }, 

    // Uploading Functionalites

    openFileChooser: function() {
       App.$fileInput.click();
    },
    startUploading: function(event) {
      App.selectedFile = event.target.files[0];
      if(App.selectedFile){
        $.mobile.changePage('#uploadingClip');
        $("#whileUploading").show();
        $("#afterUploading").hide();

        //Progress bar //TODO: remove this and create new one
        var tolito = TolitoProgressBar('progressbar')
            .setOuterTheme('b')
            .setInnerTheme('e')
            .isMini(false)
            .setMax(100)
            .setStartFrom(0)
            .setInterval(50)
            .showCounter(true)
            .logOptions()
            .build();

        //From vdloader.js
        App.uploader = new Uploader({
          uploadURL: "/uploadApi",
          file: App.selectedFile,
          title: App.selectedFile.name,
          progress: function(update){
            if (update.percent) tolito.setValue(Math.round(update.percent));                
          },
          success: function(result){
            App.selectedFile = null;
            if(result.video) {
              //create a clip and save
              var clip = new App.Clip();
              clip.save({videogami_vid: result.video._id, gif: result.video.gifs.fast}, {
                success: function(clip) {
                  //Add clip to the collection
                  App.clips.unshift(clip);

                  //prepend the clip to the library
                  var gifUrl = clip.gif;
                  var onerror = "this.src='/images/agifClip.gif';this.parentNode.className='notReady ui-link';this.parentNode.href='#'";
                  var $clip = $('<a class="clip"><img src="'+ gifUrl +'" onerror="'+onerror+'"/></a>'); 
                  $clip.data("obj", clip);
                  $clip.prependTo(App.$clipContainer);

                  App.$whileUploading.hide();
                  App.$afterUploading.show();
                  console.log(clip);
                }
              });
            }
            console.log("########### upload done " + JSON.stringify(result, 0, 2));
          },
          failure: function(er){
            App.selectedFile = null;
            console.log(JSON.stringify(er, 0, 2))
          }
        });
      } 
    },
    cancelUploading: function() {
      App.selectedFile = null;
      App.uploader.cancel();
    },
    backToHome: function() {
      $.mobile.changePage('#main');
    },
    sample: function(){

    }
  };
  App.init();
});