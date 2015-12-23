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
        global.Carousel = mod.exports;
    }
})(this, function () {
    (function () {
        function definition($) {
            var Scheme = hance.inherit('octopus.carousel.Carousel', function () {}),
                proto = Scheme.prototype,
                $window = $(window),
                $document = $(document);
            Scheme.options = {
                enableLoop: true,
                enableTouch: true,
                tweenDuration: 0.6,
                avoidChasse: true,
                actived: true,
                HaulierClass: AdaptiveHaulier,
                haulier: null
            };
            Scheme.cssClassName = 'otp-carousel';
            Scheme.dataId = '__otp_carousel';
            var AdaptiveHaulier = hance.fetch('octopus.carousel.AdaptiveHaulier');

            Scheme.sync = function () {
                $('.' + Scheme.cssClassName).each(function () {
                    if (!Scheme.get(this) && !$(this).attr('otp-state')) {
                        new Scheme(this);
                    }
                });
            };

            Scheme.all = function () {
                var instances = [];
                $('.' + Scheme.cssClassName).each(function () {
                    var instance = Scheme.get(this);

                    if (instance) {
                        instances.push(instance);
                    }
                });
                return instances;
            };

            Scheme.clean = function () {
                $('.' + Scheme.cssClassName).each(function () {
                    var instance = Scheme.get(this);

                    if (instance && instance.useless()) {
                        instance.destroy();
                    }
                });
            };

            Scheme.get = function (node) {
                return $(node).data(Scheme.dataId);
            };

            hance.properties(proto, [{
                name: 'currentIndex',
                getter: true,
                setter: false
            }, {
                name: 'dimension',
                getter: true,
                setter: false
            }, {
                name: 'contentCount',
                getter: true,
                setter: false
            }, {
                name: 'interacted',
                getter: true,
                setter: false
            }]);

            proto.init = function ($node, options) {
                this.$node = $node.addClass('otp-carousel');

                if ($node.length === 0) {
                    throw new Error('Element can not be empty!');
                }

                if ($node.attr("otp-state") === 'built') {
                    return;
                }

                $node.data(Scheme.dataId, this);
                var options = this.options = $.extend({}, Scheme.options, $node.data(), options);
                this._haulier = new AdaptiveHaulier();

                this._haulier.serve(this);

                this._dragging = false;
                this.$viewport = this.$node.find('.otp-viewport');
                this.$overview = this.$viewport.find('.otp-overview');
                this.$contents = this.$node.find('.otp-content');
                this._contentCount = this.$contents.length;
                this.cache = {};
                this.refreshCache();
                this.$contents.each(function (index) {
                    $(this).data('otp-index', index);
                });
                this._currentIndex = 0;
                this.setCurrentIndex(0, false, 1, false, true);
                this.layout();

                if (options.actived) {
                    this.active();
                }
            };

            proto.active = function () {
                this.addEventHandlers();
                this.resumeAutoRun();
            };

            proto.interact = function () {
                if (!this._interacted) {
                    $(this).trigger('interacted');
                    this._interacted = true;
                }
            };

            proto.abort = function () {
                this.stopAutoRun();
                this.removeEventHandlers();
            };

            proto.startAutoRun = function (interval) {
                var self = this;
                clearInterval(this._autoRunIntervalId);

                if (interval === undefined) {
                    interval = this.options.interval || 5;
                }

                this._autoRunIntervalId = setInterval(function () {
                    if (!self._dragging && !self._haulier.isAnimating()) {
                        self.next(true);
                    }
                }, interval * 1000);
                this.options.interval = interval;
            };

            proto.pauseAutoRun = function () {
                if (this._autoRunIntervalId) {
                    clearInterval(this._autoRunIntervalId);
                }
            };

            proto.stopAutoRun = function () {
                this.pauseAutoRun();
                this.options.interval = 0;
            };

            proto.resumeAutoRun = function () {
                if (this.options.interval > 0) {
                    this.startAutoRun();
                }
            };

            proto.addEventHandlers = function () {
                var self = this;

                if (this.options.enableTouch && Modernizr.touch) {
                    this.$viewport.on('touchstart.carousel', function (e) {
                        self._startTouchX = e.originalEvent ? e.originalEvent.touches[0].pageX : e.touches[0].pageX;
                        self._startTouchY = e.originalEvent ? e.originalEvent.touches[0].pageY : e.touches[0].pageY;
                        self._touchTimer = Number(new Date());
                        self._dragging = undefined;

                        self._haulier.startDrag(self._startTouchX, self._startTouchY);

                        var distanceX = 0,
                            distanceY = 0,
                            viewWidth = self.cache.viewport.width,
                            contentCount = self.$contents.length;
                        self.$viewport.on('touchmove.carousel', function (e) {
                            var touch = e.originalEvent ? e.originalEvent.touches[0] : e.touches[0];
                            distanceX = touch.pageX - self._startTouchX;
                            distanceY = touch.pageY - self._startTouchY;
                            distanceX = Math.min(Math.max(distanceX, -viewWidth), viewWidth);

                            if (self._dragging === undefined && Math.abs(Math.abs(distanceX) - Math.abs(distanceY)) > 3) {
                                self._dragging = Math.abs(distanceX) > Math.abs(distanceY);
                            }

                            self._currentTouchX = touch.pageX;
                            self._currentTouchY = touch.pageY;

                            if (self._dragging === undefined) {
                                e.preventDefault();
                                return e.stopPropagation();
                            } else if (!self._dragging) {
                                console.log('============cancel drag');

                                self._haulier.cancelDrag();

                                self.$viewport.off('touchmove.carousel touchend.carousel');
                            } else {
                                self.interact();

                                if (!self.options.enableLoop && (self._currentIndex === 0 && distanceX > 0 || self._currentIndex === contentCount - 1 && distanceX < 0)) {
                                    distanceX *= 0.4;
                                }

                                self._haulier.drag(distanceX, distanceY);

                                e.preventDefault();
                                return e.stopPropagation();
                            }
                        }).on('touchend.carousel', function (e) {
                            console.log('=============touch end', distanceX);

                            if (self._dragging) {
                                self._dragging = false;

                                if (Math.abs(distanceX) > viewWidth * 0.2 || Math.abs(distanceX) > viewWidth * 0.1 && Number(new Date()) - self._touchTimer < 250) {
                                    if (distanceX > 0) {
                                        if (self._currentIndex === 0 && !self.options.enableLoop) {
                                            self.park();
                                        } else {
                                            self.prev(true, true);
                                        }
                                    } else {
                                        if (self._currentIndex >= contentCount - 1 && !self.options.enableLoop) {
                                            self.park();
                                        } else {
                                            self.next(true, true);
                                        }
                                    }
                                } else {
                                    self.park();
                                }

                                self.$viewport.off('touchmove.carousel touchend.carousel');

                                self._haulier.stopDrag();

                                return e.stopPropagation();
                            } else {
                                self.park();
                            }

                            self.$viewport.off('touchmove.carousel touchend.carousel');
                        });
                    });
                }
            };

            proto.removeEventHandlers = function () {
                if (this.options.enableTouch) {
                    this.$viewport.off(".carousel");
                }
            };

            proto.next = function (animate, afterDrag) {
                if (!this.options.enableLoop && this._currentIndex >= this._contentCount - 1) {
                    this.setCurrentIndex(0, animate, -1, afterDrag);
                } else {
                    this.setCurrentIndex(this._currentIndex + 1, animate, 1, afterDrag);
                }
            };

            proto.prev = function (animate, afterDrag) {
                if (!this.options.enableLoop && this._currentIndex <= 0) {
                    this.setCurrentIndex(this._contentCount - 1, animate, 1, afterDrag);
                } else {
                    this.setCurrentIndex(this._currentIndex - 1, animate, -1, afterDrag);
                }
            };

            proto.park = function () {
                var index = (this._haulier.getActualIndex() % this._contentCount + this._contentCount) % this._contentCount;

                this._currentIndex = Math.round(index) % this._contentCount;

                this._haulier.setCurrentIndex(this._currentIndex, true, 0, true);
            };

            proto.setCurrentIndex = function (index, animate, direction, afterDrag, force) {
                if (this._currentIndex === index && !force || this._dragging) {
                    return false;
                }

                if (this._haulier.isAnimating() && this.options.avoidChasse) {
                    return false;
                }

                var contentCount = this.$contents.length;

                if (!this.options.enableLoop && (index >= contentCount || index < 0)) {
                    index = Math.max(0, Math.min(contentCount - 1, index));
                }

                this._haulier.setCurrentIndex(index, animate, direction, afterDrag, force);

                index = (index % contentCount + contentCount) % contentCount;
                var event = $.Event("index");
                event.oldIndex = this._currentIndex;
                event.newIndex = index;
                this._currentIndex = index;
                $(this).trigger(event, {
                    oldIndex: this._currentIndex,
                    newIndex: index
                });
                return true;
            };

            proto.layout = function (wind, docd, resing) {
                this._haulier.layout(wind, docd, resing);

                this.refreshCache();
            };

            proto.refresh = function () {
                this.refreshCache();
            };

            proto.refreshCache = function () {
                this.cache.viewport = {
                    width: this.$viewport.width(),
                    height: this.$viewport.height()
                };
                this.cache.overview = {
                    width: this.$overview.width(),
                    height: this.$overview.height()
                };
            };

            proto.destroy = function () {
                this.removeEventHandlers();
                this.$node.remove().data(Scheme.dataId, null);
                this.$node = null;
            };

            return Scheme;
        }

        definition($);
    })();
});