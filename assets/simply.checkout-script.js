/**
 * @license
 * Copyright 2017 Lucent Innovation. All Rights Reserved.
 * you can use this code as required.
 * Try to give credit to Lucent Innovation Team and Shopify who inspire us to write such code
 * You can ask Lucent Innovation for any help on website lucentinnovation.com or email shopify@lucentinnovation.com
 * =============================================================================
 */

window.simply = window.simply || {};
window.cn = function(o){return"undefined"==typeof o||null==o||""==o.toString().trim()};
window.cb = function(o){if(o == 'true'){return true}else{return false}};

simply.goCheckout = function(){
  window.location.href = '/checkout';
};

simply.clickEvent = function(){
  $(".content-box__row[data-select-gateway = '62761697455'] input").click(function(){
    debugger;
    if(codAppied){
      simply.showLoading();
     
      var data = $("input[name='checkout[payment_gateway]']:checked").map(function () {
        return this.value;
      }).get();
      localStorage['checked'] = JSON.stringify(data);
      
      
	    $.get('/cart/clear',function(){
    		simply.removeCod();
      	}).fail(function(){  
        	simply.hideLoading();
      	});

    }
  });
  cod_input.click(function(){
   
    debugger;
    if(codAppied){
    }
    else{
      simply.showLoading();
      
      var data = $("input[name='checkout[payment_gateway]']:checked").map(function () {
        return this.value;
      }).get();
      localStorage['checked'] = JSON.stringify(data);
      
      
      $.get('/cart/clear',function(){
        simply.addCod();
      }).fail(function(){ 
        simply.hideLoading();
      });
    }
  });
};


simply.ajaxCart =  function(form,callback){
  var data = form.serialize();
  console.log('data:'+data);
  var params = {
    type: 'POST',
    url: '/cart/add.js',
    data: data,
    dataType: 'json',
    success: function(line_item) { 
      //console.log(line_item);
       //simply.hideLoading();
      callback();
    },
    error: function(XMLHttpRequest, textStatus) {
      var error=  JSON.parse((XMLHttpRequest.responseText)).description;
      var error_popup = $("<div id='quick_error'></div>");
      error_popup.html("");
      error_popup.append("<h6>"+error+"</h6>");
      console.log(error_popup);
      button.text(button.attr("data-text"));
    }
  };
  jQuery.ajax(params);
};

simply.showLoading = function(){
  $("body").addClass('overflow_hidden');
  $("html").addClass('overflow_hidden');
  $(".loading_me").fadeIn();
};

simply.hideLoading = function(){
  $("body").removeClass('overflow_hidden');
  $("html").removeClass('overflow_hidden');
  $(".loading_me").hide();
};

simply.cartProcess = function(add){
  if(cart_data.length > 0){
    var item = cart_data.pop();
    var form = $("<form>");
    var id = $("<input type='hidden' value='"+item.id+"' name='id'>");
    var qty = $("<input type='hidden' value='"+item.quantity+"' name='quantity'>");
    var prop = item.properties;
    var prop_input;
    if(add){
      prop_input =  $("<input type='hidden' value='cod' name='properties[cod]'>");
      form.append(prop_input);
    }
    for(var key in prop){
      if(key != 'cod'){
        prop_input =  $("<input type='hidden' value='"+prop[key]+"' name='properties["+key+"]'>");
        form.append(prop_input);
      }
    }

    form.append(id);
    form.append(qty);
  
    if(!cn(add)){
      simply.ajaxCart(form,simply.addCod);
    }
    else{ 
      simply.ajaxCart(form,simply.removeCod);
    }
   
  }
  else{
    if (Shopify.Checkout.step == "payment_method") {
      window.location.href = '/checkout';
    }
    else{
      window.location.href = '/checkout?step=shipping_method';
    }
  }
};

simply.addCod = function(){
  simply.cartProcess("true");
};

simply.removeCod = function(){
  simply.cartProcess();
};


simply.init = function(){
  simply.clickEvent();
};

$(document).ready(function(){
  simply.init();
  $(document).on('page:load page:change', function () {

  });
});
