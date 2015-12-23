'use strict';

(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports !== "undefined") {
        factory();
    } else {
        var mod = {
            exports: {}
        };
        factory();
        global.StampsLayer = mod.exports;
    }
})(this, function () {
    (function () {
        function definition(hance, $, browser) {
            var Scheme = hance.inherit('octopus.carousel.StampsLayer', function () {}),
                proto = Scheme.prototype,
                $window = $(window),
                $document = $(document);

            proto.init = function () {};

            proto.serve = function (carousel) {
                this._carousel = carousel;
                var $node = this._carousel.$node,
                    $contents = this._carousel.$contents,
                    self = this;
                this.$stampContainer = $node.find('.otp-stamp-list>ol');

                if (this.$stampContainer.length <= 0) {
                    this.$stampContainer = $('<div class="otp-stamp-list"><ol></ol></div>').appendTo($node).find('ol');
                }

                if (this.$stampContainer.find('.otp-stamp').length === 0) {
                    for (var i = 0, il = $contents.length; i < il; i++) {
                        $('<li><span class="rounded"></span></li>').appendTo(this.$stampContainer).data('otp-index', i).addClass('otp-stamp');
                    }

                    this.$stamps = this.$stampContainer.find('.otp-stamp');
                } else {
                    this.$stamps = this.$stampContainer.find('.otp-stamp').each(function (index) {
                        $(this).data('otp-index', index);
                    });
                }

                this.$stampContainer.on('click', '.otp-stamp', function () {
                    self._carousel.interact();

                    self._carousel.setCurrentIndex($(this).data('otp-index'), true);
                });
                $(self._carousel).on('index', function (e) {
                    for (var i = 0, il = self.$stamps.length; i < il; i++) {
                        var $stamp = self.$stamps.eq(i);

                        if (e.newIndex === $stamp.data('otp-index')) {
                            $stamp.addClass('otp-current');
                        } else {
                            $stamp.removeClass('otp-current');
                        }
                    }
                });
            };

            proto.layout = function () {};

            proto.destroy = function () {};

            return Scheme;
        }

        definition(hance, $);
    })();
});