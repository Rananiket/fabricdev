(function(funcName, baseObj) {
  funcName = funcName || "docReady";
  baseObj = baseObj || window;
  var readyList = [];
  var readyFired = false;
  var readyEventHandlersInstalled = false;

  function ready() {
    if (!readyFired) {
      readyFired = true;
      for (var i = 0; i < readyList.length; i++) {
        readyList[i].fn.call(window, readyList[i].ctx);
      }
      readyList = [];
    }
  }
  function readyStateChange() {
    if ( document.readyState === "complete" ) {
      ready();
    }
  }
  baseObj[funcName] = function(callback, context) {
    if (typeof callback !== "function") {
      throw new TypeError("callback for docReady(fn) must be a function");
    }
    // if ready has already fired, then just schedule the callback
    // to fire asynchronously, but right away
    if (readyFired) {
      setTimeout(function() {callback(context);}, 1);
      return;
    } else {
      readyList.push({fn: callback, ctx: context});
    }
    if (document.readyState === "complete") {
      setTimeout(ready, 1);
    } else if (!readyEventHandlersInstalled) {
      if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", ready, false);
        window.addEventListener("load", ready, false);
      } else {
        // must be IE
        document.attachEvent("onreadystatechange", readyStateChange);
        window.attachEvent("onload", ready);
      }
      readyEventHandlersInstalled = true;
    }
  }
})("docReady", window);

docReady(function() {
  // Checkout.$
  $obj = Checkout.$ || undefined;
  var otpAppDomainName = 'https://otp.fabricpandit.com'; 
  var selectors = {
    body: 'body',
    paymentSectionMainContainer: "[data-step='payment_method']",
    paymentMethodSection: '.section--payment-method',
    paymentMethodSubForm: '[data-payment-subform]',
    paymentMethodGateway: "[data-select-gateway='39500251191']",	// 39500251191 => PayTM payment method ID
    paymentMethodGatewaySupportedBrand: '[data-brand-icons-for-gateway]',
    cartSummarySection: ".order-summary__section--product-list",
    cartLineItems: "[data-order-summary-section='line-items']",
    cartLineItemQtyTitle: ".product-thumbnail__quantity",
    cartLineItemQty: ".product__quantity"
  };

  async function appStatus(){
    const response = await fetch(otpAppDomainName + '/api/configuration/checkStatus',{method: "POST"});
    const resp = await response.text();
    const obj = JSON.parse(resp);
    return obj.status ? true : false;
  };
  var otpForCOD = {
    checkAppStatus: function(){
      appStatus().then(resp => {
        console.log(resp);
        if(resp) this.init(); // Change this condition as it check app status inverse
      });
    },
    init: function(){
      var _this = this; // so we can access the app object in other functions
      if(checkoutShippingObj && checkoutShippingObj.phone) {
        var phoneNumber = checkoutShippingObj.phone.replace(/\s/g,'') || undefined;
      }else{
        var phoneNumber = '';
      }
      const codPaymentSectionSelectors = {
        checkoutPaymentID: "input[name='checkout[payment_gateway]']", //:checked
        selectedCheckoutPaymentID: "input[name='checkout[payment_gateway]']:checked"
      };
      inputType = $obj(codPaymentSectionSelectors.checkoutPaymentID).prop('type');

      if(inputType == 'hidden'){
        var paymentMethodId = $obj(codPaymentSectionSelectors.checkoutPaymentID).val();        
      }
      else{
        var paymentMethodId = $obj(codPaymentSectionSelectors.selectedCheckoutPaymentID).val();
      }
      if(paymentMethodId !== undefined && (paymentMethodId == 39569621047)){
        this.replaceSectionContent();
        var isPhoneNumberChange = false;
        // To hide the complete order button when page load
        $obj("[data-step='payment_method'] #continue_button").attr("disabled","disabled");
        // To verify the number is not changed by customer.
        if(_this.checkCookie('checkout_otp_verified_number') && _this.getCookie('checkout_otp_verified_number') != phoneNumber){
          isPhoneNumberChange = true;
          _this.deleteCookie('checkout_otp_verified_number');
          _this.deleteCookie('is_checkout_otp_verified');
        }else{
          isPhoneNumberChange = false;	
        }
        // To verify the OTP already verified by customer.
        if(_this.checkCookie('is_checkout_otp_verified') && !isPhoneNumberChange){
          var otpValue = _this.getCookie('is_checkout_otp_verified');
          $obj("#mobile-otp").attr("readonly",true);          	
          $obj("#mobile-otp").val(otpValue);
          $obj('.otp-loader, .otp-fail-icon, .resend-otp').hide();
          $obj('.otp-verify-icon').show();
          $obj("[data-step='payment_method'] #continue_button").removeAttr("disabled","disabled");
        }else{
          this.sendOTP();
          // To verify OTP
          $obj("#mobile-otp").on("keyup",function(e) {        
            var maxLength = $obj(this).attr("maxlength");        
            if(maxLength == $obj(this).val().length) {
              e.preventDefault();
              var otpValue = $obj(this).val();
              _this.verifyOTP(otpValue);
            }
          });
        }
        // To Resend OTP
        $obj('.resend-otp').on('click', function(e) {	  
          _this.resendOTP();
        });
      }
      return;
    },
    replaceSectionContent: function(){
      var phoneNumber = checkoutShippingObj.phone.replace(/\s/g,'') || undefined;
      if(phoneNumber !== undefined){
        const otpSection = "div.blank-slate";
        $obj(otpSection).find('i.blank-slate__icon.icon--offsite').hide();
        let otpText = '<span style="display: block;text-align: left;padding: 15px;font-weight: 600;background-color: #fff8df;border: 1px solid #d1c9ab;border-radius: 5px;margin-bottom: 20px;"><span style="vertical-align: top;padding-right: 10px;"><svg version="1.1" id="Capa_1" height="18px" width="18px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512.001 512.001" style="enable-background:new 0 0 512.001 512.001;" xml:space="preserve"> <g> <g> <path d="M503.839,395.379l-195.7-338.962C297.257,37.569,277.766,26.315,256,26.315c-21.765,0-41.257,11.254-52.139,30.102 L8.162,395.378c-10.883,18.85-10.883,41.356,0,60.205c10.883,18.849,30.373,30.102,52.139,30.102h391.398 c21.765,0,41.256-11.254,52.14-30.101C514.722,436.734,514.722,414.228,503.839,395.379z M477.861,440.586 c-5.461,9.458-15.241,15.104-26.162,15.104H60.301c-10.922,0-20.702-5.646-26.162-15.104c-5.46-9.458-5.46-20.75,0-30.208 L229.84,71.416c5.46-9.458,15.24-15.104,26.161-15.104c10.92,0,20.701,5.646,26.161,15.104l195.7,338.962 C483.321,419.836,483.321,431.128,477.861,440.586z" fill="#c69500"/> </g> </g> <g> <g> <rect x="241.001" y="176.01" width="29.996" height="149.982" fill="#c69500"/> </g> </g> <g> <g> <path d="M256,355.99c-11.027,0-19.998,8.971-19.998,19.998s8.971,19.998,19.998,19.998c11.026,0,19.998-8.971,19.998-19.998 S267.027,355.99,256,355.99z" fill="#c69500"/> </g> </g> </svg></span>Please enter the OTP sent to '+phoneNumber+' via SMS</span>';
        let promptOTPTitle = 'Enter OTP:';
        let statusIcon = '<div style="position: absolute;right: -25px;top: 13px;"><span class="otp-loader" style="display: none;"><img src="https://otp.fabricpandit.com/images/loader.gif" style="width: 20px;"/></span><span class="otp-verify-icon" style="display: none;"><svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"viewBox="0 0 367.805 367.805" style="enable-background:new 0 0 367.805 367.805;" xml:space="preserve" width="20px" height="20px"><g><path style="fill:#3BB54A;" d="M183.903,0.001c101.566,0,183.902,82.336,183.902,183.902s-82.336,183.902-183.902,183.902 S0.001,285.469,0.001,183.903l0,0C-0.288,82.625,81.579,0.29,182.856,0.001C183.205,0,183.554,0,183.903,0.001z"/><polygon style="fill:#D4E1F4;" points="285.78,133.225 155.168,263.837 82.025,191.217 111.805,161.96 155.168,204.801 256.001,103.968 	"/></g></svg></span><span class="otp-fail-icon" style="display: none;"><svg height="20px" viewBox="0 0 512 512" width="20px" xmlns="http://www.w3.org/2000/svg"><path d="m256 0c-141.164062 0-256 114.835938-256 256s114.835938 256 256 256 256-114.835938 256-256-114.835938-256-256-256zm0 0" fill="#f44336"/><path d="m350.273438 320.105469c8.339843 8.34375 8.339843 21.824219 0 30.167969-4.160157 4.160156-9.621094 6.25-15.085938 6.25-5.460938 0-10.921875-2.089844-15.082031-6.25l-64.105469-64.109376-64.105469 64.109376c-4.160156 4.160156-9.621093 6.25-15.082031 6.25-5.464844 0-10.925781-2.089844-15.085938-6.25-8.339843-8.34375-8.339843-21.824219 0-30.167969l64.109376-64.105469-64.109376-64.105469c-8.339843-8.34375-8.339843-21.824219 0-30.167969 8.34375-8.339843 21.824219-8.339843 30.167969 0l64.105469 64.109376 64.105469-64.109376c8.34375-8.339843 21.824219-8.339843 30.167969 0 8.339843 8.34375 8.339843 21.824219 0 30.167969l-64.109376 64.105469zm0 0" fill="#fafafa"/></svg></span></div>';
        const otpInputBox = "<input type='text' inputmode='numeric' name='mobile-otp' id='mobile-otp' autocomplete='off' class='field__input' pattern='[0-9]*' maxlength='4' placeholder='OTP' />";
        let verifyButtonLink = '<span class="verify-otp" style="display:none;">Verify</span>';
        let resendButtonLink = '<span class="resend-otp" style="text-align: right;display: inline-block;padding: 10px 0;cursor: pointer;color: #c69500;font-weight: 600;">Resend OTP</span>';
        $obj(otpSection).find('p').html(otpText).removeClass('section__text').addClass('section__text');
        $obj(otpSection).append('<div class="otp-input-field" style="position: relative;"></div>');
        $obj(otpInputBox).appendTo(".otp-input-field");
        $obj(statusIcon).appendTo(".otp-input-field");
        $obj(otpSection).append('<p>' + verifyButtonLink + resendButtonLink + '</p>');
      }
    },
    sendOTP: function(){
      var phoneNumber = checkoutShippingObj.phone.replace(/\s/g,'') || undefined;
      var countryCode = checkoutShippingObj.country_code;
      if(phoneNumber !== undefined){
        $obj.ajax({
          method: 'POST',
          url: otpAppDomainName + '/api/configuration/checkoutSendOTP',          
          data: {
            phoneNumber: phoneNumber,
            countryCode: countryCode
          },
          dataType: 'json',
          success: function success(response) {            
            var jsonData = JSON.parse(response.message);
            resp = response.status && jsonData.type == "success" ? true : false;
            if(resp){
              //console.log("OTP Send");
            }else{
              //console.log("OTP Failed");
            }            
          },
          error: function error(xhr, status, _error2) {
            console.log(xhr.responseText);
          }
        });
      }      
      return;	 
    },   
    resendOTP : function(){
      var phoneNumber = checkoutShippingObj.phone.replace(/\s/g,'') || undefined;
      var countryCode = checkoutShippingObj.country_code;
      //ga('send', 'event', 'product', 'otpverification_resendotp', phoneNumber);
      if(phoneNumber !== undefined){
        $obj.ajax({
          method: 'POST',
          url: otpAppDomainName + '/api/configuration/checkoutResendOTP',          
          data: {
            phoneNumber: phoneNumber,
            countryCode: countryCode
          },
          dataType: 'json',
          beforeSend: function() {
            $obj('.otp-loader').show();
            $obj('.otp-verify-icon, .otp-fail-icon').hide();
          },
          success: function success(response) {                        
            var jsonData = JSON.parse(response.message);
            resp = response.status && jsonData.type == "success" ? true : false;
            if(resp){
              $obj('.otp-loader, .otp-fail-icon').hide();
              $obj('.otp-verify-icon').show();
            }else{
              $obj('.otp-loader, .otp-verify-icon').hide();
              $obj('.otp-fail-icon').show();
            }            
          },
          error: function error(xhr, status, _error2) {
            console.log(xhr.responseText);
            $obj('.otp-loader, .otp-verify-icon').hide();
            $obj('.otp-fail-icon').show();
          }
        });
      }      
      return;
    },    
    verifyOTP : function(otp){
      var _thisAjax = this;
      var phoneNumber = checkoutShippingObj.phone.replace(/\s/g,'') || undefined;
      var countryCode = checkoutShippingObj.country_code;
      var cookieExpireMinutes = 10;
      //ga('send', 'event', 'product', 'otpverification_verifyotp', phoneNumber);
      if(phoneNumber !== undefined){
        $obj.ajax({
          method: 'POST',
          url: otpAppDomainName + '/api/configuration/checkoutVerifyOTP',          
          data: {
            phoneNumber: phoneNumber,
            countryCode: countryCode,
            otp: otp
          },
          dataType: 'json',
          beforeSend: function() {
            $obj('.otp-loader').show();
            $obj('.otp-verify-icon, .otp-fail-icon').hide();
          },
          success: function success(response) {            
            var jsonData = JSON.parse(response.message);
            resp = response.status && jsonData.type == "success" ? true : false;
            if(resp){
              $obj('.otp-loader, .otp-fail-icon, .resend-otp').hide();
              $obj('.otp-verify-icon').show();
              $obj("[data-step='payment_method'] #continue_button").removeAttr("disabled","disabled");
              $obj("#mobile-otp").attr("readonly",true);
              _thisAjax.setCookie('is_checkout_otp_verified',otp,cookieExpireMinutes);
              _thisAjax.setCookie('checkout_otp_verified_number',phoneNumber,cookieExpireMinutes);
            }else{
              $obj('.otp-loader, .otp-verify-icon').hide();
              $obj('.otp-fail-icon').show();
            }            
          },
          error: function error(xhr, status, _error2) {
            console.log(xhr.responseText);
            $obj('.otp-loader, .otp-verify-icon').hide();
            $obj('.otp-fail-icon').show();
          }
        });
      }      
      return;
    },
    setCookie : function(ckname, ckvalue, minutes){
      var d = new Date();
      d.setTime(d.getTime() + minutes * 60 * 1000);
      var expires = "expires=" + d.toUTCString();
      document.cookie = ckname + "=" + ckvalue + ";" + expires + ";path=/";
    },
    getCookie : function(ckname){
      var name = ckname + "=";
      var decodedCookie = decodeURIComponent(document.cookie);
      var ca = decodedCookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    },
    checkCookie : function(ckname){
      var isSetCookie =  this.getCookie(ckname);
      if (isSetCookie !== "") {
        return true;
      }
      return false;
    },
    deleteCookie : function(ckname){
      document.cookie = ckname + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    },
  };otpForCOD.checkAppStatus();
});

