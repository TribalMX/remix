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
    },
    bindEvents: function() {
      this.$approveClips.on('click', Main.openClipsPage);
      this.$logoutBtn.on('click', Main.logout);
    },
    openClipsPage: function() {
      ClipsPage.loadClips();
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
  Login.init();
  Main.init();
  ClipsPage.init();
});