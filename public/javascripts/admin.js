//Admin page functionality
jQuery(function ($){
  var Login = {
    init: function() {
      this.cacheElements();
      this.bindEvents();
    },
    cacheElements: function() {
      this.$login = $('#login');
      this.$username = this.$login.find('#username');
      this.$password = this.$login.find('#password');
      this.$loginBtn = this.$login.find('#loginBtn');
    },
    bindEvents: function() {
      this.$loginBtn.on('click', this.login);
    },
    login: function() {
      if(Login.$username.val() && Login.$password.val()){
        $.post( '/loginAdmin', {username: Login.$username.val(), password: Login.$password.val()}, function(data) {
          if(data.user){
            window.location.replace("/admin");
          } else {
            alert("Wrong Username or Password");
          }
        });
      }
    }
  };
  var Main = {
    init: function() {
      this.cacheElements();
      this.bindEvents(); 
    }, 
    cacheElements: function() {
      this.$main = $('#main');
      this.$logoutBtn = this.$main.find('#logoutBtn');
      this.$approveClips = this.$main.find('#approveClips');
      this.$remixes = this.$main.find('#remixes');
    },
    bindEvents: function() {
      this.$approveClips.on('click', Main.openClipsPage);
      this.$remixes.on('click', Main.openRemixesPage);
      this.$logoutBtn.on('click', Main.logout);
    },
    openClipsPage: function() {
      ClipsPage.loadClips();
    },
    openRemixesPage: function() {
      RemixesPage.fetchMixes();
    },
    logout: function() {
      $.get('/logout', function() {
        window.location.replace("/admin");
      });
    }
  };
  var ClipsPage = {
    init: function() {
      this.clips = [];
      this.cacheElements();
      this.bindEvents();
      if(location.hash=="#clipsPage") this.loadClips();
    },
    cacheElements: function() {
      this.$clipsPage = $('#clipsPage');
      this.$clipsContainer = this.$clipsPage.find('#clipsContainer');
      this.$approveAll = this.$clipsPage.find('#approveAll');
      this.$cancelApproval = this.$clipsPage.find('#cancelApproval');
      this.$removeUnprocessed = this.$clipsPage.find('#removeUnprocessed');
    },
    bindEvents: function() {
      this.$clipsContainer.on('click', '.clip', this.removeClip);
      this.$approveAll.on('click', this.aproveAllClips);
      this.$cancelApproval.on('click', this.cancelApproval);
      this.$removeUnprocessed.on('click', this.removeUnprocessed);
    },
    loadClips: function() {
      $.ajax({
        type: "GET",
        url: '/admin/clips/unapproved',
        beforeSend: function() {
          ClipsPage.$clipsContainer.html('');
          ClipsPage.clips = [];
          $.mobile.loading( 'show', {textVisible: true, theme: 'b'});
        },
        success: function(clips) {
          ClipsPage.clips = clips;
          $.each(ClipsPage.clips, function(i, clip){
            var onerror = "this.src='/images/agifClip.gif';this.parentNode.className='clip notReady ui-link';this.onload='';";
            var onload = "this.parentNode.className='clip ui-link';";
            var $clip = $('<a class="clip notReady"><img src="'+ clip.gif +'" onload="'+onload+'" onerror="'+onerror+'"/></a>');
            $clip.appendTo(ClipsPage.$clipsContainer);
          });
        },
        complete: function() {
          $.mobile.changePage('#clipsPage');
          $.mobile.loading( 'hide', {textVisible: true, theme: 'b'});
          console.log( ClipsPage.$clipsContainer.find('.notReady').length);
        }
      });
    },
    removeClip: function() {
      var index = ClipsPage.$clipsContainer.find('.clip').index(this);
      $(this).remove();
      ClipsPage.clips.splice(index, 1);
      console.log(ClipsPage.clips);
    },
    aproveAllClips: function() {
      var notReadyClips = ClipsPage.$clipsContainer.find('.notReady');
      if(notReadyClips.length > 0){
        alert("Please remove unprocessed clips to continue");
      } else {
        $.mobile.loading( 'show', {textVisible: true, theme: 'b'});
        var requests = [];
        $.each(ClipsPage.clips, function(i, clip){
          var ajax = $.ajax({
            type: "PUT",
            url: '/admin/clips/unapproved/' + clip._id,
            data: {'approved': true}
          });
          requests.push(ajax);
        });
        $.when.apply($, requests).then(function(){
          $.mobile.loading( 'hide', {textVisible: true, theme: 'b'});
          window.location.replace("/admin");
        });
      }
    },
    removeUnprocessed: function() {
      var notReadyClips = ClipsPage.$clipsContainer.find('.notReady');
      $.each(notReadyClips, function(i, clip){
        var index = ClipsPage.$clipsContainer.find('.clip').index(clip);
        ClipsPage.clips.splice(index, 1);
        $(clip).remove();
      });
    },
    cancelApproval: function() {
      window.location.replace("/admin");
    }
  };
  var RemixesPage = {
    init: function() {
      this.remixes = [];
      this.cacheElements();
      this.bindEvents();
      if(location.hash=="#remixesPage") this.fetchMixes();;

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

      this.selectedTab = "all";
    },
    cacheElements: function() {
      this.$remixesPage = $('#remixesPage');
      this.$mixSlider = this.$remixesPage.find('#mixSlider');
      this.$prevRemix = this.$remixesPage.find('#prevRemix');
      this.$nextRemix = this.$remixesPage.find('#nextRemix');
      this.$allMixes = this.$remixesPage.find('#allMixes');
      this.$featuredMixes = this.$remixesPage.find('#featuredMixes');
    },
    bindEvents: function() {
      this.$prevRemix.on('click', this.prevRemix);
      this.$nextRemix.on('click', this.nextRemix);
      this.$mixSlider.on('click', '.nFeatured', this.makeFetured);
      this.$mixSlider.on('click', '.featured', this.makeUnFetured);
      this.$allMixes.on('click', this.showAllMixes);
      this.$featuredMixes.on('click', this.showFeaturedMixes);
    },
    fetchMixes: function() {
      var data = {limit: 10};
      if(RemixesPage.selectedTab == "featured") { data.featured = true}
      $.ajax({
        type: "GET",
        url: "/api/public/remixes",
        data: data,
        beforeSend: function() {
         $.mobile.loading( 'show', {textVisible: true, theme: 'b'});
        },
        success: function(remixes) {
          RemixesPage.remixes = remixes;
          RemixesPage.$mixSlider.html('');
          for(var i = 0; i < remixes.length; i++) {
            $mix = $(RemixesPage.mixTemplate);
            RemixesPage.loadRemix(remixes[i], $mix);
            $mix.appendTo(RemixesPage.$mixSlider);
          }
          console.log(remixes);
        },
        complete: function() {
          RemixesPage.curMix = RemixesPage.$mixSlider.find('.mix').first();
          RemixesPage.curMix.show();
          RemixesPage.$prevRemix.hide();
          RemixesPage.$nextRemix.show();
          $.mobile.changePage('#remixesPage');
          $.mobile.loading( 'hide', {textVisible: true, theme: 'b'});
        },
      });
    },
    loadRemix: function(remix, $mix) {
      var clips = remix.clips;
      var fClass = remix.featured ? "featured" : "nFeatured";
      var fText = remix.featured ? "Featured" : "Mark as Featured";

      $mix.find('.mixPanel1').css("background", "url('"+clips[0].gif+"') no-repeat");
      $mix.find('.mixPanel2').css("background", "url('"+clips[1].gif+"') no-repeat");
      $mix.find('.mixPanel3').css("background", "url('"+clips[2].gif+"') no-repeat");
      $mix.find('.mixPanel4').css("background", "url('"+clips[3].gif+"') no-repeat");      
      $mix.find('.titleRow').html('<a class="title" href="/remixes/'+remix._id+'">'+remix.title+'</a> <a class="'+fClass+' fr" data-id="'+remix._id+'">'+fText+'</a><a class="updating fr" style="display: none">Updating...</a>');

    },
    nextRemix: function() {
      var curMix = RemixesPage.curMix; 
      var mixes = RemixesPage.$mixSlider.find('.mix');
      var curIndex = mixes.index(curMix[0]);
      if (curIndex == 0) RemixesPage.$prevRemix.show();
      if(curIndex < (mixes.length -1)) {
        RemixesPage.curMix = mixes.eq(curIndex+1);
        curMix.hide();
        RemixesPage.curMix.show();
      } else if (curIndex == (mixes.length-1)){
        var data = {
          limit: 5,
          date_lt: RemixesPage.remixes[RemixesPage.remixes.length-1].created_at
        };
        if(RemixesPage.selectedTab == "featured") { data.featured = true}
        $.ajax({
          type: "GET",
          url: "/api/public/remixes",
          data: data,
          beforeSend: function() {  
            $.mobile.loading( 'show', {textVisible: true, theme: 'b'});
            RemixesPage.$nextRemix.hide();
          },
          success: function(remixes) {
            if(remixes.length > 0) {
              console.log(remixes);
              RemixesPage.remixes = RemixesPage.remixes.concat(remixes);
              for(var i = 0; i < remixes.length; i++) {
                $mix = $(RemixesPage.mixTemplate);
                RemixesPage.loadRemix(remixes[i], $mix);
                $mix.appendTo(RemixesPage.$mixSlider);
              }
              mixes = RemixesPage.$mixSlider.find('.mix');
              RemixesPage.curMix = mixes.eq(curIndex+1);
              curMix.hide();
              RemixesPage.curMix.show();
              RemixesPage.$nextRemix.show();
            }
          }, 
          complete: function() {
            $.mobile.loading( 'hide', {textVisible: true, theme: 'b'}); 
          }
        });
      }
    },
    prevRemix: function() {
      var curMix = RemixesPage.curMix; 
      var mixes = RemixesPage.$mixSlider.find('.mix');
      var curIndex = mixes.index(curMix[0]);
      if (curIndex == (mixes.length-1)) RemixesPage.$nextRemix.show();
      if (curIndex == 1) RemixesPage.$prevRemix.hide();
      if(curIndex > 0) {
        RemixesPage.curMix = mixes.eq(curIndex-1);
        curMix.hide();
        RemixesPage.curMix.show();
      }
    },
    makeFetured: function() {
      $fBtn = $(this);
      //DO AJAX
      $.ajax({
        type: "PUT",
        url: '/admin/remixes/' + $fBtn.data("id"),
        data: {'featured': true}, 
        beforeSend: function() {
          $fBtn.hide();
          $fBtn.next().show();
        }, 
        success: function(result) {
          $fBtn.text('Featured');
          $fBtn.removeClass('nFeatured');
          $fBtn.addClass('featured');
        },
        complete: function() {
          $fBtn.show();
          $fBtn.next().hide();
        }
      });
    }, 
    makeUnFetured: function() {
      $fBtn = $(this);
      //DO AJAX
      $.ajax({
        type: "PUT",
        url: '/admin/remixes/' + $fBtn.data("id"),
        data: {'featured': false}, 
        beforeSend: function() {
          $fBtn.hide();
          $fBtn.next().show();
        }, 
        success: function(result) {
          $fBtn.text('Mark as Featured');
          $fBtn.addClass('nFeatured');
          $fBtn.removeClass('featured');
        },
        complete: function() {
          $fBtn.show();
          $fBtn.next().hide();
        }
      });
    },
    showAllMixes: function() {
      if($(this).hasClass("ui-btn-active")){
        //DO NOTHING
      } else {
        RemixesPage.selectedTab = "all";
        RemixesPage.fetchMixes();
      }
    }, 
    showFeaturedMixes: function() {
      if($(this).hasClass("ui-btn-active")){
        //DO NOTHING
      } else {
        RemixesPage.selectedTab = "featured";
        RemixesPage.fetchMixes();
      } 
    } 
  };
  Login.init();
  Main.init();
  ClipsPage.init();
  RemixesPage.init();
});