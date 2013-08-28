jQuery(function ($){

  var Util = {
    Collection: function(settings) {
      var newCollection = function() {
        var collection = [];
        var url = settings.url;

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
        this.getApproved = function() {
          var result = [];
          result = collection.filter(function(element, index, array){
            return element.clips[0].approved && element.clips[1].approved && element.clips[2].approved && element.clips[3].approved;
          });
          return result;
        };
        this.getLast = function() {
          return collection[collection.length-1];
        }
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
      //Facebook login puts #_=_ to the url. So, remove it.
      if (window.location.href.indexOf("#_=_") > 0) { window.location = window.location.href.replace(/#.*/, ""); return;}

      //Create collections and models
      this.Remixes = Util.Collection({url: "/api/remixes"});
      this.publicRemixes = Util.Collection({url: "/api/public/remixes"});
      this.featuredRemixes = Util.Collection({url: "/api/public/remixes"});
      this.Clips = Util.Collection({url: "/api/clips"});
      this.Remix = Util.Model({url: "/api/remixes"});
      this.Clip = Util.Model({url: "/api/clips"});

      //local variables
      this.publicRemixes = new this.publicRemixes();
      this.featuredRemixes = new this.featuredRemixes();
      this.remixes = new this.Remixes();
      this.clips = new this.Clips();

      //User
      this.user = {};

      //For main
      this.selectedTab = "featured"; //featured, recent, or my
      this.remixesCursor = -1;
      this.pubRemixesCursor = -1;
      this.featuredRemixesCursor = -1;

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

      //Id of the page to where page redirects
      this.returnTo = "main";

      this.isLoginPage = ($('#loginPage').length > 0);

      //initiate
      if(this.isLoginPage) {
        this.cacheElements();
        this.bindEvents();
        this.fetchFeaturedMixes();
      } else {
        this.cacheElements();
        this.bindEvents();
        //TODO: loading screen
        this.fetchFeaturedMixes();
        //TODO: LazyLoading
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

      if(!App.isLoginPage){
        this.$createMixBtn = this.$main.find('#createMixBtn');
        this.$addVideoBtn = this.$main.find('#addVideoBtn');
        this.$featuredMixes = this.$main.find('#featuredMixes');
        this.$recentMixes = this.$main.find('#recentMixes');
        this.$myMixes = this.$main.find('#myMixes');
        this.$username = this.$main.find("#username"); //Temp

        //clip page
        this.$clip = $('#clip');
        this.$clipWrapper = this.$clip.find('#clipWrapper');
        this.$saveClip = this.$clip.find('#saveClip');
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
        this.$uploadClip = this.$clipLibrary.find('#uploadClip');
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
        this.$goToCreateMix = this.$uploadingClip.find('#goToCreateMix');
        this.$uploadMore = this.$uploadingClip.find('#uploadMore');
        this.$backToMix = this.$uploadingClip.find('#backToMix');
      }
    },
    bindEvents: function() {
      //main page
      this.$nextRemix.on('click', this.slideNext);
      this.$prevRemix.on('click', this.slidePrev);

      if(!App.isLoginPage) {
        this.$addVideoBtn.on('click', this.openNewClipPage);
        this.$featuredMixes.on('click', this.selectTab);
        this.$recentMixes.on('click', this.selectTab);
        this.$myMixes.on('click', this.selectTab);
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
        this.$uploadClip.on('click', this.openNewClipPage);

        //newClip page
        this.$upload.on('click', this.openFileChooser);
        this.$cancelNewClip.on('click', this.returnToPrev);
        this.$fileInput.on('change', this.startUploading);

        //uploadingClip page
        this.$cancelUploading.on('click', this.cancelUploading);
        this.$goToCreateMix.on('click', this.openCreateMixPage);
        this.$backToMix.on('click', this.openCreateMixPage);
        this.$uploadMore.on('click', this.uploadMore);
      }
    },

    // Loaders
    //Preload gifs for remixes
    preloadGifs: function(remixes) {
      var total = 0;
      var loaded = 0;
      for (var i=0; i < remixes.length; i++) {
        for(var j =0; j < remixes[i].clips.length; j++) {
          total++;
          $('<img src="'+ remixes[i].clips[j].gif +'">').hide().appendTo('body').one('load', function(){
            // console.log('Image: '+$(this).attr('src')+' is cached...');
            $(this).remove();
            loaded++;
            if(loaded == total) {
              //cb
              console.log("Preloaded all images");
            }
          });
        }
      }
    },
    fetchRecentMixes: function() {
      var options = {limit: 10};
      var rmx = this.publicRemixes;
      //If it's not initial fetch, fetch next remixes with date less than last fetched remixes
      if(rmx.get().length > 0) {
        options.date_lt =  rmx.getLast().created_at;
      }
      //fetch remixes
      rmx.fetchAndAppend(options, {
        success: function(remixes){
          //Get approved remixes from the collection
          var approved = rmx.getApproved();
          if(remixes.length > 0) {
            // If less then two remixes are approved, fetch more
            if(approved.length < 2) {
              console.log(approved);
              console.log("FetchRecentMixes: Not enough approved remixes are fetched (less than two), fetch more");
              App.fetchRecentMixes();
            } else {
              App.pubRemixesCursor = 0;
              App.preloadGifs(approved); 
              console.log("FetchRecentMixes: ");
              console.log(approved);
            }
          } else {
            //If there is no more items and tere is only one approved remix is fetched so far
            if(approved.length == 1){
              App.pubRemixesCursor = 0;
              App.preloadGifs(approved); 
              console.log("FetchRecentMixes: ");
              console.log(approved);
            } else {
              // No approved items at all
              console.log("FetchRecentMixes: "); 
              console.log(remixes); 
            }
          } 
        }
      });
    },
    fetchMyMixes: function() {
      //fetch remixes
      this.remixes.fetch({
        limit: 10
      }, {
        success: function(remixes){
          if (remixes.length > 0) {
            App.remixesCursor = 0;
            App.preloadGifs(remixes);
          }
          console.log("FetchMyMixes: ");
          console.log(remixes);
      }});
    },
    fetchFeaturedMixes: function() {
      var $mixSlider = this.$mixSlider;
      App.$prevRemix.hide();
      // App.$nextRemix.hide();
      //fetch remixes
      this.featuredRemixes.fetch({
        limit: 10,
        featured: true
      }, {
        success: function(remixes){
          for(var i=0; i < remixes.length && i < 2; i++) {
            if(i == 0) {
              App.featuredRemixesCursor = 0;
              $mix = App.$mixSlider.find('.mix:nth-child(2)');
            } else {
              $mix = App.$mixSlider.find('.mix:nth-child(3)');
            }
            App.loadRemix(remixes[i], $mix);
          }
          if(remixes.length > 1) App.$nextRemix.show();
          //Preload gifs and cache them
          App.preloadGifs(remixes);
          console.log("FetchFeaturedMixes: ");
          console.log(remixes);
      }});
    },
    fetchClips: function() {
      var $clipContainer = this.$clipContainer;
      //fetch clips
      this.clips.fetch({limit: 10}, {success: function(clips){
        App.loadClips(clips);
        console.log("FetchClips: ");
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
      var host = location.protocol+'//'+location.host;
      var remixUrl = encodeURIComponent(host+"/remixes/" + remix._id);
      var str = '<a class="share" href="https://www.facebook.com/sharer/sharer.php?u='+remixUrl+'" target="_blank">Share on Facebook</a>';
      var clips = remix.clips;
      $mix.find('.mixPanel1').data('clip',clips[0]);
      $mix.find('.mixPanel2').data('clip',clips[1]);
      $mix.find('.mixPanel3').data('clip',clips[2]);
      $mix.find('.mixPanel4').data('clip',clips[3]);
      $mix.find('.mixPanel1').css("background", "url('"+clips[0].gif+"') no-repeat");
      $mix.find('.mixPanel2').css("background", "url('"+clips[1].gif+"') no-repeat");
      $mix.find('.mixPanel3').css("background", "url('"+clips[2].gif+"') no-repeat");
      $mix.find('.mixPanel4').css("background", "url('"+clips[3].gif+"') no-repeat");      
      $mix.find('.titleRow').html(''+remix.title + str);
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
    openCreateMixPage: function() {
      App.clearMixPanel();
      $.mobile.changePage('#newMix');
    },
    openNewClipPage: function() {
      App.returnTo = $.mobile.activePage.attr('id');
      $.mobile.changePage('#newClip');
    },
    selectClip: function() {
      $.mobile.changePage('#clip');

      App.$saveClip.addClass('ui-disabled');
      App.$saveClip.find('.ui-btn-text').text('Save to My Clips');
      App.$clip.find('.info').html("Created by ...");
      App.$clipWrapper.data('clip', null);
      App.$clipWrapper.html(''); 

      var clip = $(this).data('clip');

      //Request for additional clip info
      $.ajax({
        type: "GET",
        url: '/api/clips/' + clip._id,
        data: {addInfo: true},
        beforeSend: function() {
          $.mobile.loading( 'show', {textVisible: true, theme: 'b'});
        },
        success: function(result) {
          console.log(result);
          App.$clip.find('.info').html("Video Created by " + result.clip.created_by.name);
          if(!result.alreadyHave) {
            App.$saveClip.removeClass('ui-disabled');
          } else {
            App.$saveClip.hide();
            App.$savedClip.show();
          }
        },
        complete: function() {
          App.$clipWrapper.data('clip', clip);
          App.$clipWrapper.html('<img class="clip" src="'+clip.gif+'"/>'); 
          $.mobile.loading( 'hide', {textVisible: true, theme: 'b'});
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
          App.$saveClip.addClass('ui-disabled');
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
          App.$clipWrapper.data('clip', null);
        },
        complete: function() {
          App.$saveClip.removeClass('ui-disabled');
          App.$saveClip.hide();
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
      var curName = "pubRemixesCursor";
      var remixes = App.publicRemixes;
      var items = remixes.getApproved();
      if(App.selectedTab == "my") {
        curName = "remixesCursor";
        remixes = App.remixes;
        items = remixes.get();
      } else if (App.selectedTab == "featured") {
        curName = "featuredRemixesCursor";
        remixes = App.featuredRemixes;
        items = remixes.get();
      }
      var cursor = App[curName];
      console.log("before next cursor: " + cursor);
      if(cursor < 0 || cursor >= items.length) return;
      if(cursor == 0) App.$prevRemix.show();

      if (cursor < items.length-1){
        App.$mixSlider.find('.mix:nth-child(2)').slideUp();
        App.$mixSlider.find('.mix:nth-child(3)').slideDown();
        App.$mixSlider.find('.mix').first().remove();
        App.$mixSlider.append(App.mixTemplate);
        cursor = cursor + 1;
        App[curName] = cursor;
      }
      if(cursor < items.length-1) {
        //load to next mix which is hidden
        App.loadRemix(items[cursor+1], App.$mixSlider.find('.mix:last'));
      } else if (cursor == items.length-1){
        //hide next button;
        App.$nextRemix.hide();
        //cursor is on the last index
        //Load More /TODO: show wheeling sign
        if(App.selectedTab == "my" || App.selectedTab == "featured"){
          App.fetchMoreMixes(remixes, cursor);
        } else {
          //fetch only approved mixes
          App.fetchMoreRecentMixes(remixes, cursor);
        }
      }
      console.log("after next cursor: " + App[curName]);
    },
    fetchMoreRecentMixes: function(remixes, cursor) {
      remixes.fetchAndAppend({
        limit: 10,
        date_lt: remixes.getLast().created_at
      },{
        success: function(result){
          if(result.length > 0) {
            var approved = [];
            approved = result.filter(function(element, index, array){
              return element.clips[0].approved && element.clips[1].approved && element.clips[2].approved && element.clips[3].approved;
            });
            if(approved.length == 0){
              console.log(approved);
              console.log("FetchMoreRecentMixes: All of them are not approved, fetch next");
              App.fetchMoreRecentMixes(remixes, cursor);
            } else {
              //Done
              console.log("FetchMoreRecentMixes: ");
              console.log(approved);
              App.preloadGifs(approved); 
              items = remixes.getApproved();
              App.loadRemix(items[cursor+1], App.$mixSlider.find('.mix:last'));
              App.$nextRemix.show();
            }
          } else {
            //Done
            console.log("FetchMoreRecentMixes: ");
            console.log(result);
          }
        }
      });
    },
    fetchMoreMixes: function(remixes, cursor) {
      var query = {
        limit: 5,
        date_lt: remixes.getLast().created_at
      };
      if(App.selectedTab == "featured") {
        console.log("FEATURED FETCH MORE");
        query.featured = true;
      }
      remixes.fetchAndAppend(query,{
        success: function(result){
          if(result.length > 0) {
            App.preloadGifs(result); 
            var items = remixes.get();
            App.loadRemix(items[cursor+1], App.$mixSlider.find('.mix:last'));
            App.$nextRemix.show();
          }
          console.log(result);
        }
      });
    },
    slidePrev: function() {
      var curName = "pubRemixesCursor";
      var remixes = App.publicRemixes;
      var items = remixes.getApproved();
      if(App.selectedTab == "my") {
        curName = "remixesCursor";
        remixes = App.remixes;
        items = remixes.get();
      } else if (App.selectedTab == "featured") {
        curName = "featuredRemixesCursor";
        remixes = App.featuredRemixes;
        items = remixes.get();
      }
      var cursor = App[curName];
      console.log("before prev cursor: " + cursor);
      if(cursor <= 0 || cursor >= items.length) return;
      if(cursor == items.length-1) App.$nextRemix.show();
      if (cursor > 0){
        App.$mixSlider.find('.mix:nth-child(1)').slideDown();
        App.$mixSlider.find('.mix:nth-child(2)').slideUp();
        // App.$mixSlider.find('.mix:nth-child(1)').show();
        // App.$mixSlider.find('.mix:nth-child(2)').hide();
        App.$mixSlider.find('.mix:last').remove();
        App.$mixSlider.prepend(App.mixTemplate);
        cursor = cursor - 1;
        App[curName] = cursor;
      }
      if(cursor > 0) {
        //load to prev mix which is hidden
        App.loadRemix(items[cursor - 1], App.$mixSlider.find('.mix:first'));
      } else if (cursor == 0){
        //hide prev;
        App.$prevRemix.hide();
      } 
      console.log("after next cursor: " + App[curName]);
    },
    selectTab: function() {
      //If this tab is not already selected
      if(!$(this).hasClass("selected")) {
        App.$featuredMixes.removeClass('selected');
        App.$recentMixes.removeClass('selected');
        App.$myMixes.removeClass('selected');
        $(this).addClass("selected");

        App.$mixSlider.find('.mixPanel').data('clip', null);
        App.$mixSlider.find('.mixPanel').css("background", "");
        App.$mixSlider.find('.mixPanel').removeClass('loaded');
        App.$mixSlider.find('.titleRow').html('');

        var tabName = "";
        var tabId = $(this).attr('id');
        var cursor = -1;
        var remixes = [];
        //set cursor and remixes collection
        if(tabId == 'featuredMixes') {
          App.selectedTab = "featured";
          cursor = App.featuredRemixesCursor;
          remixes = App.featuredRemixes.get();
        } else if(tabId == 'recentMixes') {
          App.selectedTab = "recent";
          cursor = App.pubRemixesCursor;
          remixes = App.publicRemixes.getApproved();
        } else if(tabId == 'myMixes') {
          App.selectedTab = "my";
          cursor = App.remixesCursor;
          remixes = App.remixes.get();
        }

        console.log(App.selectedTab);
        console.log(cursor);
        console.log(remixes);

        //Just return if there is no contents to show
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
        if(!title) title = "No Title Mix";
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
            App.remixesCursor = 0;
            $.mobile.changePage('#main');
            App.$myMixes.removeClass('ui-btn-active');
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
      $.mobile.changePage
    }, 

    // NewClip Page and Uploading Functionalites
    returnToPrev: function() {
      //when it returns to uploading complete page
      if(App.returnTo == "uploadingClip") {
        App.$afterUploading.find('.fromMain').show();
        App.$whileUploading.hide();
        App.$afterUploading.show();
      }
      $.mobile.changePage('#'+App.returnTo);
    },
    openFileChooser: function() {
       App.$fileInput.click();
    },
    startUploading: function(event) {
      App.selectedFile = event.target.files[0];
      if(App.selectedFile){
        $.mobile.changePage('#uploadingClip');
        App.$whileUploading.show();
        App.$afterUploading.hide();
        App.$afterUploading.find('.buttons').hide();

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

                  if(App.returnTo == "clipLibrary")  {
                    App.$afterUploading.find('.fromMix').show();
                  } else {
                    App.$afterUploading.find('.fromMain').show();
                  }
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
    uploadMore: function() {
      App.returnTo = $.mobile.activePage.attr('id');
      $.mobile.changePage('#newClip');
    }, 
    sample: function(){

    }
  };
  App.init();
});