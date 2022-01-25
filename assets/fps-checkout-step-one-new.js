(function($){
  $(document).on('page:load page:change', function() {
    var $phoneField;
    var $pincodeField;
    var $pincodeValue;
    var domainName = 'https://otp.fabricpandit.com';
    var errorClass = 'field--error-plus-dynamic';
    var errorFieldClass = 'field--error';
    var errorMessageSelector = '.field__message--error-plus-dynamic';
    var isEnablePincodeValidation = 1;
    var isEnablePreventZeroBeginning = 1;
    var isValidPinCode = 0;
    var isValidPhoneNumber = 0;

    /* Added the hidden field to manage the continue shopping button availability */
    var addHiddenFields = function(){
      var hiddenPincodeVal = isEnablePincodeValidation ? 0 : 1; 
      $('<input>').attr({
        type: 'hidden',
        id: 'isvalid-phonenumber',
        name: 'isvalid-phonenumber',
        value: 0
      }).appendTo("div[data-step='contact_information'] form");
      $('<input>').attr({
        type: 'hidden',
        id: 'isvalid-pincode',
        name: 'isvalid-pincode',
        value: hiddenPincodeVal
      }).appendTo("div[data-step='contact_information'] form");        
    }        

    /* Change the from fields positions */
    var changeFormFieldPosition = function(){
      $('[data-address-field="phone"]').insertAfter($('[data-address-field="last_name"]'));
      $('[data-address-field="phone"]').removeClass("field--half");
      $('[data-address-field="country"]').insertAfter($('[data-address-field="province"]')).removeClass("field--third");
      $('[data-address-field="city"], [data-address-field="country"], [data-address-field="province"]').addClass("field--third");
      $('[data-address-field="city"] input').attr('readonly','readonly');
      $('[data-address-field="province"] select, [data-address-field="country"] select').css("pointer-events","none");
      $('[data-address-field="zip"]').insertBefore($('[data-address-field="address1"]')).removeClass('field--third');
    };

    var changeFieldsInSection = function(){
      /* Common CSS some on checkout page to*/
      $(".section--shipping-address .checkbox-wrapper").css("display", "none");
      /* Rearrange form fields */
      if($('.logged-in-customer-information').length){
        if(!$('[data-section="customer-information"] .fieldset').length){
          $('[data-address-field="first_name"]').insertAfter($('#checkout_shipping_address_id').parent().parent());
          $('[data-address-field="last_name"]').insertAfter($('[data-address-field="first_name"]'));
          $('[data-address-field="phone"]').insertAfter($('[data-address-field="last_name"]'))
        }
      }else{        
        $("[data-step='contact_information'] .step__footer").css("margin-top", "0");
        $('[data-section="customer-information"] .fieldset').append('<div class="address-fields custom-address-fields" data-address-fields=""></div>');
        $('.custom-address-fields').prepend($('[data-shopify-pay-email-flow="false"]'));
        $('.custom-address-fields').prepend($('[data-autocomplete-field="phone"]'));      
        $('.custom-address-fields').prepend($('[data-autocomplete-field="last_name"]'));
        $('.custom-address-fields').prepend($('[data-autocomplete-field="first_name"]'));
        $('[data-address-field="first_name"]').insertBefore($('[data-shopify-pay-email-flow="false"]'));
        $('[data-address-field="last_name"]').insertAfter($('[data-address-field="first_name"]'));
        $('[data-address-field="phone"]').insertAfter($('[data-shopify-pay-email-flow="false"]'))
      }
      /* To change the active field firstname instead of email by default */
      $('#checkout_email').removeAttr("data-autofocus");
      $('#checkout_shipping_address_first_name').attr('data-autofocus', 'true');
    };
    $('.section--contact-information .layout-flex__item span, .section--contact-information .layout-flex__item a').hide();

    /*To prevent zero at beginning of phone number*/
    var preventZeroBeginning = function(phoneField){
      var getNumberVal = phoneField.val();
      getNumberVal = getNumberVal.replace(/^(0*)/,"");
      phoneField.val(getNumberVal);
    };
    /* Check service availability functionality */
    var pincodeServiceAvailability = function(pincodeField,pincodeValue){
      // When user check pin-code then reports an event to Google Analytics servers.
      var isSuccess = false;
      $(window).ready(function() {
        $('head script[async][src*="analytics"]').on('load', function() {          
          ga('send', 'event', 'checkout', 'checkout_pincheck');
        });
      });
      $.ajax({
        method: 'POST',
        url: domainName + '/api/configuration/checkoutShippingZipCode',
        async: false,
        data: {
          zipcode: pincodeValue
        },
        dataType: 'json',
        success: function success(response) {
          var resp = response.status ? true : false;
          if (resp) {
            // Pincode is available for delivery then reports an event to Google Analytics servers.
            if(checkoutTotalPrice){
              $(window).ready(function() {
                $('head script[async][src*="analytics"]').on('load', function() {    
                  ga('send', 'event', 'checkout', 'checkout_pincheck_ok', pincodeValue, checkoutTotalPrice);
                });
              });              	
            }
            $("#checkout_shipping_address_city").val(response.zipdata.city);
            $('#checkout_shipping_address_province').val(response.zipdata.state);            
            $("#isvalid-pincode").val("1").triggerHandler('change');
            if( $('.service-avi-error').length ){
              $(".service-avi-error").remove();
            }
            $('[data-address-field="zip"]').removeClass(errorFieldClass);
            isSuccess = true;
          }else{
            // Pincode is not available for delivery then reports an event to Google Analytics servers.
            if(checkoutTotalPrice){
              ga('send', 'event', 'checkout', 'checkout_pincheck_notok', pincodeValue, checkoutTotalPrice);
            }
            $("#checkout_shipping_address_city").val('');
            $("#checkout_shipping_address_province").prop("selectedIndex", 0);
            if( $('.service-avi-error').length ){
              $(".service-avi-error").remove();
            }
            pincodeField.removeClass(errorClass);
            pincodeField.closest('#checkout_shipping_address_zip').nextAll(errorMessageSelector).remove();
            // Pincode is not available for delivery then reports an event to Google Analytics servers.                 
            if (response.type == 'array') {
              pincodeField.closest('#checkout_shipping_address_zip').after("<p class='field__message field__message--error-plus-dynamic service-avi-error' style='color:#ff6d6d;'>"+ response.message +"</p>");
            } else {
              pincodeField.closest('#checkout_shipping_address_zip').after("<p class='field__message field__message--error-plus-dynamic service-avi-error' style='color:#ff6d6d;'>"+ response.message +"</p>");
            }
            $('[data-address-field="zip"]').addClass(errorFieldClass);
            $("#error-for-zip").css({"display": "none"});
            $("#isvalid-pincode").val("0").triggerHandler('change');
            isSuccess = false;
          }
        },
        error: function error(xhr, status, _error2) {
          console.log(xhr.responseText);
          isSuccess = false;
        }
      });
      return isSuccess;
    }
    /* Validate phone number with 10 digit allow*/
    var validatePhoneNumber = function(phoneField) {
      //To validate the user enter value on field
      if(phoneField.val().length == 0){
        return true;
      }
      var errorMessage = "Enter a valid 10 digit mobile number";
      var numbers = phoneField.val().match(/^(\d *){10}$/);
      if (numbers) {
        // Phone number is valid. Remove errors and continue.
        phoneField.removeClass(errorClass);
        phoneField.closest('#checkout_shipping_address_phone').nextAll(errorMessageSelector).remove();
        $("#isvalid-phonenumber").val("1").triggerHandler('change');
        //$("#error-for-phone").css({"display": "block"});
        $('[data-address-field="phone"]').removeClass(errorFieldClass);
        return true;
      } else {              
        // show error wrong input.
        if (!phoneField.hasClass(errorClass)) {
          phoneField.addClass(errorClass);
          $('[data-address-field="phone"]').addClass(errorFieldClass);
          $("#error-for-phone").css({"display": "none"});
          //phoneField.parent().parent().addClass(errorFieldClass);
          phoneField.closest('#checkout_shipping_address_phone').after("<p class='field__message field__message--error-plus-dynamic' style='color:#ff6d6d;'>"+ errorMessage +"</p>");
        }
        $("#isvalid-phonenumber").val("0").triggerHandler('change');
        return false;
      }
    };
    /* Validate pincode with 6 digit allow and call service availability */
    var validatePincodeNumber = function(pincodeField) {
      //To validate the user enter value on field
      if(pincodeField.val().length == 0){
        return true;
      }
      let errorMessage = "Enter a valid 6 digit pincode";
      let numbers = pincodeField.val().match(/^\d{6}$/);
      if (numbers) {
        let pincodeValue = pincodeField.val();
        if(!pincodeServiceAvailability(pincodeField,pincodeValue)){
          return false;
        }
        if(validatePhoneNumber($phoneField)){
          $("#isvalid-phonenumber").val("1").triggerHandler('change');
        }
        // Phone number is valid. Remove errors and continue.
        pincodeField.removeClass(errorClass);
        pincodeField.closest('#checkout_shipping_address_zip').nextAll(errorMessageSelector).remove();
        $("#isvalid-pincode").val("1").triggerHandler('change');
        $('[data-address-field="zip"]').removeClass(errorFieldClass);
        return true;

      } else {       
        // show error wrong input.
        if (!pincodeField.hasClass(errorClass)) {
          pincodeField.addClass(errorClass);
          pincodeField.closest('#checkout_shipping_address_zip').after("<p class='field__message field__message--error-plus-dynamic' style='color:#ff6d6d;'>"+ errorMessage +"</p>");
          if( $('.service-avi-error').length ){
            $(".service-avi-error").remove();
          }
          $('[data-address-field="zip"]').addClass(errorFieldClass);
          $("#error-for-zip").css({"display": "none"});
        }
        $("#isvalid-pincode").val("0").triggerHandler('change');
        $("#checkout_shipping_address_city").val('');
        $("#checkout_shipping_address_province").prop("selectedIndex", 0);
        //To remove error message if field is empty
        if(pincodeField.val().length == 0){
          pincodeField.closest('#checkout_shipping_address_zip').nextAll(errorMessageSelector).remove();
        }
        return false;
      }
    };
    /* Update the Continue Button Availability */
    var checkContinueButtonStatus = function(){
      isValidPinCode = $('#isvalid-pincode').val();
      isValidPhoneNumber = $('#isvalid-phonenumber').val();
      if(isValidPinCode == 1 && isValidPhoneNumber == 1){
        $("#continue_button").removeAttr("disabled", "disabled");
      }else{
        $("#continue_button").attr("disabled","disabled");
      }   
    }
    /* Prevent autofill valid functionality */
    var checkAllInAutoFillForm = function(){
      if(isEnablePincodeValidation){
        var isZipcodeValue = $('#checkout_shipping_address_zip').val();
        if(isZipcodeValue){
          validatePincodeNumber($pincodeField);
          $('[data-address-field="city"] label').css("opacity", "1");
        }
      }
      var isPhoneValue = $('#checkout_shipping_address_phone').val();
      if(isPhoneValue){
        validatePhoneNumber($phoneField);
      }
    }
    /* Change the Address placehoder text */
    var updateAddressPlaceholderText = function(){
      if( $('#checkout_shipping_address_address1').length ){
        $('[data-address-field="address1"] label').text('Address (House No, Building, Street)');
        $('#checkout_shipping_address_address1').attr("placeholder", "Address (House No, Building, Street)");
      }
      if( $('#checkout_shipping_address_address2').length ){
        $('[data-address-field="address2"] label').text('(Area, Landmark)');
        $('#checkout_shipping_address_address2').attr("placeholder", "(Area, Landmark)");
      }
    }
    /* Hide the shipping step on checkout */
    var hideShippingStep = function(){
      $('.breadcrumb__item .breadcrumb__text:contains(Shipping)').parent().hide();
      $('.breadcrumb__item .breadcrumb__link:contains(Shipping)').parent().hide();
      if ($('.step[data-step="contact_information"]').length > 0) {
        $('.step__footer__previous-link').hide();
        $('.step__footer__continue-btn .btn__content').html('Continue to payment method');
      }
      if ($('.step[data-step="shipping_method"]').length > 0) {
        $(".section--shipping-method [data-shipping-method] input").first().prop("checked", true);
        $('.step__footer__continue-btn').first().click();
      }
      if ($('.step[data-step="payment_method"]').length > 0) {
        $('.review-block:last-child').hide();
        $('.step__footer__previous-link-content').html("Return to customer information");
        $('.step__footer__previous-link').attr("href", "/checkout?step=contact_information");
      }
    }
    /* To change the payment options icons and text */
    var changePaymentStepInfo = function(){
      $('[data-select-gateway="39500251191"] label').text("Cards & Netbanking");
      $('.payment-method-wrapper ul[data-brand-icons-for-gateway="62761697455"]').append('<li class="payment-icon custom-payment_icon" style="width:38px; height: 24px; margin-right: 4px;"><img src="//cdn.shopify.com/s/files/1/0270/8435/7687/files/UPI.svg?v=1633070210" alt="UPI"/></li>');
      $('.payment-method-wrapper ul[data-brand-icons-for-gateway="62761697455"]').append('<li class="payment-icon custom-payment_icon" style="width:38px; height: 24px; margin-right: 4px;"><img src="//cdn.shopify.com/s/files/1/0270/8435/7687/files/GooglePay.svg?v=1633066018" alt="GPay"/></li>');
      $('.payment-method-wrapper ul[data-brand-icons-for-gateway="62761697455"]').append('<li class="payment-icon custom-payment_icon" style="width:38px; height: 24px; margin-right: 4px;"><img src="//cdn.shopify.com/s/files/1/0270/8435/7687/files/phonepe.svg?v=1633070273" alt="PhonePay"/></li>');
      $('[data-select-gateway="62761697455"] label').text("UPI, Gpay, Phonpe, Wallets");
    }
    /* To get the payment step HTML*/
    var getPaymentStepInfo = function(){
      var domainName = Shopify.Checkout.dynamicCheckoutPaymentInstrumentsConfig.paymentInstruments.checkoutConfig.domain;
      var storeId = Shopify.Checkout.dynamicCheckoutPaymentInstrumentsConfig.paymentInstruments.checkoutConfig.shopId;
      var checkoutToken = Shopify.Checkout.token;
      if(domainName && storeId && checkoutToken){
        var storeUrl = 'https://'+domainName+'/'+storeId+'/checkouts/'+checkoutToken+'?step=payment_method';
        var paymentHtml = '<div class="section section--payment-method custom-payment-section" data-payment-method=""></div> '
        $.ajax({
          method: 'GET',
          url: storeUrl,
          async: false,	
          dataType: 'html',
          success: function success(response) {
            if (response) {
              var respHtml = $(response).find('.section--payment-method').html();
              var btnHtml = $(response).find('[data-step="payment_method"] .step__footer').html();
              $('.contact_payment-method').append(respHtml, btnHtml);
              $('.payment-msg').hide();
              changePaymentStepInfo();
            }
          },
          error: function error(xhr, status, _error2) {
            console.log(xhr);
          }
        });
      }            
    }
    var addFullNameField = function(){
      // Hide First Name and Last Name
      $('[data-address-field="first_name"], [data-address-field="last_name"]').hide();
      // Added the Full Name field in the form
      $('.custom-address-fields').append('<div class="field field--required field--show-floating-label" data-address-field="full_name"><div class="field__input-wrapper"><label class="field__label field__label--visible"for="checkout_shipping_address_full_name">Full name</label><input placeholder="Full name" autocomplete="shipping given-name" autocorrect="off" data-backup="full_name" class="field__input" aria-required="true" size="30" type="text" value="" name="checkout[shipping_address][full_name]" id="checkout_shipping_address_full_name" data-autofocus="true"></div><p class="field__message field__message--error" id="error-for-full_name">Enter a full name</p></div>');
      $('[data-address-field="full_name"]').insertBefore($('[data-address-field="first_name"]'));
    }
    /* To add the meters text on cart line items */
    var cartLineItemsTextChanges = function(){
      var cartSummarySection = $('.order-summary__section--product-list');
      if(cartSummarySection.length){
        var lineItems = $("[data-order-summary-section='line-items']").children('tr');        
        lineItems.each(function(index,item){
          if($(item).attr('data-product-type').toLowerCase() == 'fabric'){
            $(item).find(".product-thumbnail__quantity")
            .css({"font-size":"0.80em","width":"80px","left":"0"})
            .text(($(item).find(".product__quantity").text()) + ' meter(s)');  
          }
        });
      }
    }
    cartLineItemsTextChanges();
    hideShippingStep();

    if (Shopify.Checkout.step === 'contact_information') {
      // Start localstorage data script
      const formIdentifier = $('.step form'); // Identifier used to identify the form
      let form = document.querySelector('.step form'); // select form
      let formElements = form.elements; // get the elements in the form
      const getFormData = () => {
        let data = { [formIdentifier]: {} };
        for (const element of formElements) {
          if (element.value.length > 0) {
            data[formIdentifier][element.name] = element.value;
          }
        }
        return data;
      };
      $('.step[data-step="contact_information"] .step__footer__continue-btn').click(function(){
        data = getFormData();
        localStorage.setItem('Contact_form_data', JSON.stringify(data[formIdentifier]));
      });
      // This function populates the form with data from localStorage         
      const populateForm = () => {
        if (localStorage.getItem('Contact_form_data') !== null) {
          const savedData = JSON.parse(localStorage.getItem('Contact_form_data')); // get and parse the saved data from localStorage
          for (const element of formElements) {
            if (element.name in savedData) {
              if (element.name === "checkout[email]" || element.name === "checkout[shipping_address][first_name]" || element.name === "checkout[shipping_address][last_name]" || element.name === "checkout[shipping_address][address1]" || element.name === "checkout[shipping_address][city]" || element.name === "checkout[shipping_address][country]" || element.name === "checkout[shipping_address][province]" || element.name === "checkout[shipping_address][zip]" || element.name === "checkout[shipping_address][phone]") {
                element.value = savedData[element.name];
              }
            }
          }
          const message = "Form has been refilled with saved data!";
        }
      };
      populateForm();   
      if(checkoutTotalPrice){       
        setTimeout(function(){ 
          ga('send', 'event', 'checkout_contactInformation', 'pageview_contactInformation', '', checkoutTotalPrice);
        }, 500);       
      }
      // GA events for breadcrumb clicks
      if($('.breadcrumb .breadcrumb__item').length){
        $('.breadcrumb .breadcrumb__item').on('click', function(event) {
          var linkLable = '';
          if($(this).find('.breadcrumb__text').length){
            var linkLable = $.trim($(this).find('.breadcrumb__text').text().toLowerCase());
          }
          if($(this).find('.breadcrumb__link').length){
            var linkLable = $.trim($(this).find('.breadcrumb__link').text().toLowerCase());
          }          
          if(linkLable && linkLable === "cart"){
            ga('send', 'event', 'checkout_contactInformation', 'contactInformation_backToCart');
            ga('send', 'event', 'checkout_breadcrumbs', 'checkout_breadcrumbs_backToCart');
          }
          if(linkLable && linkLable === "shipping"){
            ga('send', 'event', 'checkout_contactInformation', 'contactInformation_goToShipping');
            ga('send', 'event', 'checkout_breadcrumbs', 'checkout_breadcrumbs_goToShipping');
          }
          if(linkLable && linkLable === "payment"){
            ga('send', 'event', 'checkout_contactInformation', 'contactInformation_goToPayment');
            ga('send', 'event', 'checkout_breadcrumbs', 'checkout_breadcrumbs_goToPayment');
          }
        });        
      }
      // GA events for all field focus
      $("#checkout_email").focus(function(){
        ga('send', 'event', 'checkout_contactInformation', 'contactInformation_email');
      });
      $("#checkout_shipping_address_first_name").focus(function(){
        ga('send', 'event', 'checkout_contactInformation', 'contactInformation_firstname');
      });
      $("#checkout_shipping_address_last_name").focus(function(){
        ga('send', 'event', 'checkout_contactInformation', 'contactInformation_lastname');
      });
      $("#checkout_shipping_address_phone").focus(function(){
        ga('send', 'event', 'checkout_contactInformation', 'contactInformation_phone');
      });
      $("#checkout_shipping_address_zip").focus(function(){
        ga('send', 'event', 'checkout_contactInformation', 'contactInformation_pin');
      });
      $("#checkout_shipping_address_address1").focus(function(){
        ga('send', 'event', 'checkout_contactInformation', 'contactInformation_address');
      });
      $("#checkout_shipping_address_city").focus(function(){
        ga('send', 'event', 'checkout_contactInformation', 'contactInformation_city');
      });
      $("#checkout_shipping_address_country").focus(function(){
        ga('send', 'event', 'checkout_contactInformation', 'contactInformation_country');
      });
      $("#checkout_shipping_address_province").focus(function(){
        ga('send', 'event', 'checkout_contactInformation', 'contactInformation_state');        
      });
      // GA events for discount code
      $('.order-summary__section--discount button[name="button"]').on('click', function(event) {
        ga('send', 'event', 'checkout_contactInformation', 'contactInformation_discountCode');
        ga('send', 'event', 'checkout_discountCode', 'discountCode_apply','contact information - checkout');        
      });
      var $phoneField = $('[name="checkout[shipping_address][phone]"]:not([aria-hidden="true"])');      
      var $pincodeField = $('[name="checkout[shipping_address][zip]"]:not([aria-hidden="true"])');
      // Prevent user from entering 0 as first digit on phone number
      if(isEnablePreventZeroBeginning){
        $phoneField.keyup(function(){
          preventZeroBeginning($(this));
        });      
        $phoneField.on('blur input', function() {
          preventZeroBeginning($(this));        
        });
        $('#checkout_email').on('blur input', function() {
          preventZeroBeginning($phoneField);       
        });
      }
      if(isEnablePincodeValidation){
        $pincodeField.keyup(function(){
          validatePincodeNumber($(this));
        }); 
        $pincodeField.on('blur input', function() {
          validatePincodeNumber($(this));        
        });
      }
      changeFormFieldPosition();
      changeFieldsInSection();
      updateAddressPlaceholderText();
      checkAllInAutoFillForm();  
      // For detect the saved address change event
      $('#checkout_shipping_address_id').on('change', function(event) {       
        setTimeout(function(){ 
          if(isEnablePreventZeroBeginning){
            preventZeroBeginning($phoneField);
          }
          changeFormFieldPosition();
          checkAllInAutoFillForm();
          changeFieldsInSection();
          updateAddressPlaceholderText();          
        }, 100);
      });
      // Handle form submit by validating button click.
      $('[data-step] form [type="submit"]').on('click', function(event) {
        // GA events for submit button each step
        if('div[data-step="contact_information"] #continue_button'){
          ga('send', 'event', 'checkout_contactInformation', 'contactInformation_sumit');
        }
        var isvalidatePincodeNumber, isvalidatePhoneNumber = 0;
        if(isEnablePincodeValidation){
          if (validatePincodeNumber($pincodeField) || $pincodeField.val().length == 0) {
            isvalidatePincodeNumber = 1;
            $('[data-address-field="city"]').addClass('field--show-floating-label');
          }
          if (validatePhoneNumber($phoneField) || $phoneField.val().length == 0) {
            isvalidatePhoneNumber = 1;
          }
          if(isvalidatePincodeNumber && isvalidatePhoneNumber){
            $('[data-step] form').trigger('submit');
          }else{
            event.preventDefault();            
          }          
        }else{
          if (validatePhoneNumber($phoneField)) {
            $('[data-step] form').trigger('submit');
          }else{
            event.preventDefault();
          }
        }
      });
      $(".step__footer__previous-link").css({"display": "none"});
      $("#continue_button").append( '<span class="checkout-white-arrow" style="width: 0;height: 0;border-top: 5px solid transparent;border-left: 5px solid #fff;border-bottom: 5px solid transparent;display: inline-block;vertical-align: inherit;margin-left: 8px;"></span>' );
      // Remove the error when user on pincode field
      $pincodeField.focusin(function(){
        $pincodeField.removeClass(errorClass);
        $('[data-address-field="zip"]').removeClass(errorFieldClass);
        $pincodeField.closest('#checkout_shipping_address_zip').nextAll(errorMessageSelector).remove();
      });
      // Remove the error when user on phone number field
      $phoneField.focusin(function(){
        $phoneField.removeClass(errorClass);
        $('[data-address-field="phone"]').removeClass(errorFieldClass);
        $phoneField.closest('#checkout_shipping_address_phone').nextAll(errorMessageSelector).remove();
      });
      setTimeout(function(){
        getPaymentStepInfo();
      }, 1000);
      // Hide Keep me up to date on news and offers Line
      $('.fieldset-description').hide();
      $('.field.field--email_or_phone label').text('Email');
      $('.field.field--email_or_phone input').attr('placeholder', "Email");
      $('.field.field--email_or_phone.field--error p').text('Enter an email address');
    }
    
    if($('.breadcrumb.breadcrumb--center').length){
      var items = $('.breadcrumb.breadcrumb--center').find('li');
      if(items.length){
        var skippedItem = 3;
        if (Shopify.Checkout.step === 'contact_information'){
          skippedItem = 1;
        } else if(Shopify.Checkout.step === 'shipping_method') {
          skippedItem = 2;
        }
        if(items.length == 3){ skippedItem = skippedItem - 1; } // When user clicked on Buy NOW, breadcrumb link is differ.
        items.each(function(i){
          if(i > skippedItem) $(items[i]).find('.breadcrumb__link').attr("href", "#").css({"color": "#737373", "cursor": "auto"});
        });          
      }
    }

    if (Shopify.Checkout.step === 'shipping_method') {
      // GA events for step load
      if(checkoutTotalPrice){       
        setTimeout(function(){ 
          ga('send', 'event', 'checkout_shippingInformation', 'pageview_shippingInformation', '', checkoutTotalPrice);
        }, 200);       
      }
      // GA events for breadcrumb clicks
      if($('.breadcrumb .breadcrumb__item').length){
        $('.breadcrumb .breadcrumb__item').on('click', function(event) {
          var linkLable = '';
          if($(this).find('.breadcrumb__text').length){
            var linkLable = $.trim($(this).find('.breadcrumb__text').text().toLowerCase());
          }
          if($(this).find('.breadcrumb__link').length){
            var linkLable = $.trim($(this).find('.breadcrumb__link').text().toLowerCase());
          }          
          if(linkLable && linkLable === "cart"){
            ga('send', 'event', 'checkout_shippingInformation', 'shippingInformation_backToCart');
            ga('send', 'event', 'checkout_breadcrumbs', 'checkout_breadcrumbs_backToCart');
          }
          if(linkLable && linkLable === "information"){
            ga('send', 'event', 'checkout_shippingInformation', 'shippingInformation_goToContact');
            ga('send', 'event', 'checkout_breadcrumbs', 'checkout_breadcrumbs_goToContact');
          }
          if(linkLable && linkLable === "payment"){
            ga('send', 'event', 'checkout_shippingInformation', 'shippingInformation_goToPayment');
            ga('send', 'event', 'checkout_breadcrumbs', 'checkout_breadcrumbs_goToPayment');
          }
        });        
      }
      // GA events for submit button each step
      $('[data-step] form [type="submit"]').on('click', function(event) {
        // GA events for submit button each step
        if('div[data-step="shipping_method"] #continue_button'){
          ga('send', 'event', 'checkout_shippingInformation', 'shippingInformation_submit');
        }
      });
      // GA events for discount code
      $('.order-summary__section--discount button[name="button"]').on('click', function(event) {
        ga('send', 'event', 'checkout_shippingInformation', 'shippingInformation_discountCode');
        ga('send', 'event', 'checkout_discountCode', 'discountCode_apply','shipping information - checkout');       
      });
      /* Set overlay on the checkout when shipping is hide */
      var overlayHtml = '<div class="full-page-overlay shipping__overlay"> <div class="full-page-overlay__wrap"> <div class="full-page-overlay__content"> <a class="logo logo--center" href="https://fabricpandit.com/"><img alt="fabric-pandit" class="logo__image logo__image--medium" src="https://cdn.shopify.com/s/files/1/0270/8435/7687/files/Untitled_design_1_1f0ed18d-fb07-4dd6-ba0c-1875c1f8f378.png?v=1633613117"></a> <p class="full-page-overlay__text">We\'re processing...</p> </div> </div> </div>';
      $(overlayHtml).insertAfter( "header.main__header" );
      $(".step__footer__previous-link").css({"display": "none"});
      $("#continue_button").append( '<span class="checkout-white-arrow" style="width: 0;height: 0;border-top: 5px solid transparent;border-left: 5px solid #fff;border-bottom: 5px solid transparent;display: inline-block;vertical-align: inherit;margin-left: 8px;"></span>' );
      $('.section--shipping-method input').on('change', function() {        
        var shippingMethodId = $(this).attr('id');        
        var isCod = shippingMethodId.search("cash_on_delivery");
        if(isCod > 1){
          $("#continue_button .btn__content").text("Continue");
          ga('send', 'event', 'checkout_shippingInformation', 'shippingInformation_COD');
        }else{
          $("#continue_button .btn__content").text("Continue to payment");
          ga('send', 'event', 'checkout_shippingInformation', 'shippingInformation_freeshipping');
        }	
      });
      //To remove the top detail section block
      $(".step__sections .section").filter(function() {        
        return $('div', this).hasClass('review-block');
      }).hide();
      $(".section.section--shipping-method").css({"padding-top": "0"});
    }

    if (Shopify.Checkout.step === 'payment_method') {
      // GA events for breadcrumb clicks
      if(shippingMethod){
        if($('.breadcrumb .breadcrumb__item').length){
          $('.breadcrumb .breadcrumb__item').on('click', function(event) {
            var linkLable = '';
            if($(this).find('.breadcrumb__text').length){
              var linkLable = $.trim($(this).find('.breadcrumb__text').text().toLowerCase());
            }
            if($(this).find('.breadcrumb__link').length){
              var linkLable = $.trim($(this).find('.breadcrumb__link').text().toLowerCase());
            }          
            if(linkLable && linkLable === "cart"){
              ga('send', 'event', 'checkout_paymentInformation', 'paymentInformation_backToCart', shippingMethod);
              ga('send', 'event', 'checkout_breadcrumbs', 'checkout_breadcrumbs_backToCart');
            }
            if(linkLable && linkLable === "information"){
              ga('send', 'event', 'checkout_paymentInformation', 'paymentInformation_goToContact', shippingMethod);
              ga('send', 'event', 'checkout_breadcrumbs', 'checkout_breadcrumbs_goToContact');
            }
            if(linkLable && linkLable === "shipping"){
              ga('send', 'event', 'checkout_paymentInformation', 'paymentInformation_goToShipping', shippingMethod);
              ga('send', 'event', 'checkout_breadcrumbs', 'checkout_breadcrumbs_goToShipping');
            }
          });        
        }
      }
      if(checkoutTotalPrice){
        // GA events for step load
        setTimeout(function(){ 
          ga('send', 'event', 'checkout_paymentInformation', 'pageview_paymentInformation', '', checkoutTotalPrice);
        }, 200);        
        // GA events for submit button each step
        $('[data-step] form [type="submit"]').on('click', function(event) {
          // GA events for submit button each step
          if('div[data-step="shipping_method"] #continue_button'){
            ga('send', 'event', 'checkout_paymentInformation', 'paymentInformation_submit', 'Free Shipping', checkoutTotalPrice );
          }
        });
      }
      changePaymentStepInfo();
      $(".step__footer__previous-link").css({"display": "none"});
      $("#continue_button").prepend('<span style="vertical-align: middle;margin-right: 8px;"><svg height="14px" version="1.1" viewBox="0 0 20 20" width="14px" xmlns="http://www.w3.org/2000/svg" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" xmlns:xlink="http://www.w3.org/1999/xlink"><title></title><desc></desc><defs></defs><g fill="none" fill-rule="evenodd" id="Page-1" stroke="none" stroke-width="1"><g fill="#ffffff" id="Core" transform="translate(-44.000000, -86.000000)"><g id="check-circle" transform="translate(44.000000, 86.000000)"><path d="M10,0 C4.5,0 0,4.5 0,10 C0,15.5 4.5,20 10,20 C15.5,20 20,15.5 20,10 C20,4.5 15.5,0 10,0 L10,0 Z M8,15 L3,10 L4.4,8.6 L8,12.2 L15.6,4.6 L17,6 L8,15 L8,15 Z" id="Shape"></path></g></g></g></svg></span>');
      $('.main__content').addClass('payment_address-box');
      //To remove the top detail section block
      $(".step__sections .section").filter(function() {        
        return $('div', this).hasClass('review-block');
      }).hide();
      $(".section.section--payment-method").css({"padding-top": "0"});
      $(".section.section--reductions.hidden-on-desktop").css({"display": "none"}); 
      
      $(function() { 
        $('html, body').animate({
          scrollTop: $('.step[data-step="payment_method"]').offset().top}, 1000);
      });
    }
    
    
    /*if($('div[data-step="payment_method"]').length > 0){
      //console.log("Jay shri Ram");
      $(document).on("click", "#continue_button", function(e){
          e.preventDefault();
          var paymentAmount = meta.checkout.payment_due;
          $.ajax({
            method: 'POST',
            url: domainName + '/api/setu/payment',
            data: {
              amount: paymentAmount
            },
            success: function success(response) {
              console.log(response);
              if(response.status == 200){
              	window.location.href = response.payment_url;
              }
            },
            error: function error(xhr, status, _error) {
              console.log(xhr.responseText);
            }
          });
      });
    }*/
  });
})(Checkout.$);