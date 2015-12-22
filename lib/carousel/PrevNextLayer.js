'use strict';

(function () {
    function definition(hance, $) {
        var Scheme = hance.inherit('octopus.carousel.PrevNextLayer', function () {}),
            proto = Scheme.prototype,
            $window = $(window),
            $document = $(document);
        proto.init = function () {};
        proto.serve = function (carousel) {
            //decorate
            this._carousel = carousel;
            this.$node = this._carousel.$node;
            this.$prevButton = this.$node.find('.prev-button');
            this.$nextButton = this.$node.find('.next-button');
            if (this.$prevButton.length <= 0) {
                this.$prevButton = $('<div class="otp-button navi-button prev-button"><span></span></div>').appendTo(this.$node);
            }
            if (this.$nextButton.length <= 0) {
                this.$nextButton = $('<div class="otp-button navi-button next-button"><span></span></div>').appendTo(this.$node);
            }
            var self = this;
            this.$prevButton.on('click', function () {
                if (!(!self._carousel.options.enableLoop && self._carousel.getCurrentIndex() === 0)) {
                    self._carousel.interact();
                    self._carousel.prev();
                }
            });
            this.$nextButton.on('click', function () {
                if (!(!self._carousel.options.enableLoop && self._carousel.getCurrentIndex() === self._carousel.getContentCount() - 1)) {
                    self._carousel.interact();
                    self._carousel.next();
                }
            });
            if (!this._carousel.options.enableLoop) {
                $(this._carousel).on('index', function (e) {
                    self.$prevButton.toggleClass('otp-disabled', e.newIndex === 0);
                    self.$nextButton.toggleClass('otp-disabled', e.newIndex === self._carousel.getContentCount() - 1);
                });
            }
        };
        proto.layout = function () {};
        proto.destroy = function () {};
        return Scheme;
    }

    // if (typeof define === 'function') {
    //     define(['hance', 'jquery'], definition);
    // } else if (typeof module !== 'undefined' && module.exports) {
    //     module.exports = definition(require('hance'), require('jquery'));
    // } else {
    definition(hance, $);
    // }
})();