"use strict";!function(t,n){if("function"==typeof define&&define.amd)define([],n);else if("undefined"!=typeof exports)n();else{var s={exports:{}};n(),t.StampsLayer=s.exports}}(this,function(){!function(){function t(t,n,s){var e=t.inherit("octopus.carousel.StampsLayer",function(){}),i=e.prototype;n(window),n(document);return i.init=function(){},i.serve=function(t){this._carousel=t;var s=this._carousel.$node,e=this._carousel.$contents,i=this;if(this.$stampContainer=s.find(".otp-stamp-list>ol"),this.$stampContainer.length<=0&&(this.$stampContainer=n('<div class="otp-stamp-list"><ol></ol></div>').appendTo(s).find("ol")),0===this.$stampContainer.find(".otp-stamp").length){for(var a=0,o=e.length;o>a;a++)n('<li><span class="rounded"></span></li>').appendTo(this.$stampContainer).data("otp-index",a).addClass("otp-stamp");this.$stamps=this.$stampContainer.find(".otp-stamp")}else this.$stamps=this.$stampContainer.find(".otp-stamp").each(function(t){n(this).data("otp-index",t)});this.$stampContainer.on("click",".otp-stamp",function(){i._carousel.interact(),i._carousel.setCurrentIndex(n(this).data("otp-index"),!0)}),n(i._carousel).on("index",function(t){for(var n=0,s=i.$stamps.length;s>n;n++){var e=i.$stamps.eq(n);t.newIndex===e.data("otp-index")?e.addClass("otp-current"):e.removeClass("otp-current")}})},i.layout=function(){},i.destroy=function(){},e}t(hance,$)}()});