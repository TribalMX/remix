//Login page functionality
jQuery(function ($){
  var Main = {
    init: function() {
      this.remixes = [];
      this.cacheElements();
      this.bindEvents();
      if(Main.$mixSlider.length > 0) {
        this.fetchMixes();
      }
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
      this.$mixSlider = this.$main.find('#mixSlider');
      this.$prevRemix = this.$main.find('#prevRemix');
      this.$nextRemix = this.$main.find('#nextRemix');

      this.$login = $('#login');
      this.$loginForm = this.$login.find('#loginForm');

      this.$register = $('#register');
      this.$registerForm = this.$register.find('#registerForm');
      this.$checkboxes = this.$register.find('#checkboxes');
      this.$msgBox = this.$register.find('#msgBox');
      this.$registerBtn = this.$register.find('#registerBtn');
    },
    bindEvents: function() {
      //main
      this.$prevRemix.on('tap', this.prevRemix);
      this.$nextRemix.on('tap', this.nextRemix);

      //login
      this.$loginForm.on('submit', this.login);

      //registeration
      this.$registerForm.on('keyup', 'input', this.validateInput);
      this.$checkboxes.on('change', 'input', this.validateInput);
      this.$registerForm.on('submit', this.register);
      this.$registerBtn.on('tap', this.submitRegisterForm);
    },
    validateInput: function() {
      var isAllNoneEmpty = true;
      var isAllChecked = true;

      //Check if all input feilds are not empty
      inputs = Main.$registerForm.find('input');
      $.each(inputs, function(i,value){
        if(!$(value).hasClass('ic') && !$(value).val()) {
          isAllNoneEmpty = false;
        } 
      });
      //Check if all checkboxes are checked
      checkBoxes = Main.$checkboxes.find('input[type=checkbox]');
      $.each(checkBoxes, function(i,value){
        if(!$(value).attr('checked')) {
          isAllChecked = false;
        } 
      }); 
      //Enable register button if all fields are fields are valid
      if(isAllChecked && isAllNoneEmpty) {
        Main.$registerBtn.removeClass('ui-disabled');
      } else {
        if(!Main.$registerBtn.hasClass('ui-disabled')) {
          Main.$registerBtn.addClass('ui-disabled');
        }
      }
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
    register: function(event) {
      event.preventDefault();
      $.ajax({
        type: 'POST',
        url: '/users',
        data: $(this).serialize(),
        beforeSend: function() {
          $.mobile.loading( 'show', {textVisible: true, theme: 'b'});
        },
        timeout: 5000,
        error: function(xhr, ajaxOptions, thrownError) {
          if(ajaxOptions=="timeout"){
            alert("Request timeout: try again");
          } else if(xhr.responseText){
            var json = JSON.parse(xhr.responseText);
            var firstItem = true;
            var result = $.map(json.errors, function(value, i) {
              var br = '<br>';
              if(firstItem) {
                br = '';
                firstItem = false;
              }
              return $(br + '<span style="color: red">'+value.type+' with value '+value.value+'</span>');
            });
            Main.$msgBox.html(result);
          }
        },
        success: function(result) {
          //Clear Form
          Main.$registerForm.find('input').val('');
          Main.$checkboxes.find('input[type=checkbox]').attr("checked",false).checkboxradio("refresh");
          Main.$registerBtn.addClass('ui-disabled');
          if(result.username && result.email) {
            $.mobile.changePage('#registered');
          }
        }, 
        complete: function() {
          $.mobile.loading( 'hide', {textVisible: true, theme: 'b'});
        }
      });
    },
    submitRegisterForm: function() {
      //Validate email and password before submitting form
      var isValidEmail = false;
      var isValidPassword = false;
      var isPasswordMatch = false;
      var isHuman = false;

      // Check Email
      var email = Main.$registerForm.find('input[name=email]').val();
      var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      isValidEmail = re.test(email);

      // Check Password
      var password = Main.$registerForm.find('input[name=password]').val();
      var confirm = Main.$registerForm.find('input[name=confirm]').val();
      isPasswordMatch = (password === confirm);
      isValidPassword = (password.length > 5);

      // Check Human
       if(!Main.$registerForm.find('input[name=email-confirmation]').val()) {
        isHuman = true;
       }

      if(isValidEmail && isValidPassword && isPasswordMatch && isHuman) {
        Main.$msgBox.html('<br>');
        Main.$registerForm.submit();
      } else if(!isValidEmail){
        Main.$msgBox.html('<span style="color: red">Email address is not a valid email address</span>');
      } else if(!isValidPassword) {
        Main.$msgBox.html('<span style="color: red">Password must be at least 6 characters</span>');
      } else if(!isPasswordMatch) {
        Main.$msgBox.html('<span style="color: red">Password does not match</span>');
      }
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
          Main.curMix = Main.$mixSlider.find('.mix').first();
          Main.curMix.show();
        },
        complete: function() {
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