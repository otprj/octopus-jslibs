'use strict';

(function () {
    function definition(hance, $) {
        var Scheme = hance.inherit('octopus.carousel.AdaptiveHaulier', function () {}),
            proto = Scheme.prototype;
        Scheme.options = {
            tweenDuration: 0.8,
            tweenEase: Cubic.easeInOut,
            parkEase: Cubic.easeInOut,
            afterDragEase: Linear.easeNone
        };
        hance.properties(proto, [{
            name: 'actualIndex',
            getter: true,
            setter: false
        }, {
            name: 'currentIndex',
            getter: true,
            setter: false
        }]);
        proto.serve = function (carousel) {
            var $node = this.$node = carousel.$node,
                self = this;
            var options = this.options = $.extend({}, Scheme.options, carousel.options);
            this._carousel = carousel;

            this._animating = false;

            this.$viewport = this.$node.find('.otp-viewport');
            if (this.$viewport.css('position') !== 'absolute') {
                this.$viewport.css({ position: 'relative' });
            }
            this.$overview = this.$viewport.find('.otp-overview');
            if (this.$overview.css('position') !== 'absolute') {
                this.$overview.css({ position: 'absolute' });
            }
            this.$contents = this.$node.find('.otp-content');
            if (this.$contents.css('position') !== 'absolute') {
                this.$contents.css({ position: 'absolute' });
            }

            this._disabledContents = [];
            this._actualIndex = 0;
            this.$contents.each(function (index) {
                self._disabledContents.push(this);
                $(this).data('otp-index', index).css({
                    visibility: 'hidden'
                });
            });

            this._tweenedObj = {
                index: 0
            };
            this._tween = null;
            this._tweenEnded = true;
            this.layout();
        };
        proto.startDrag = function (x, y) {
            this._dragging = true;
            this.cancelTween();
            this._carousel.pauseAutoRun();
            this._dragStartIndex = this._actualIndex;
        };
        proto.drag = function (dx, dy) {
            var viewWidth = this.$viewport.width(),
                index = this._dragStartIndex - dx / viewWidth;
            if (!this._carousel.options.enableLoop) {
                index = Math.max(-0.3, Math.min(index, this._carousel.getContentCount() - 0.7));
            }
            this.tweenTo(index, 0);
        };
        proto.cancelDrag = function () {
            if (this._dragStartIndex % 1 !== 0) {
                var index = Math.round(this._dragStartIndex);
                this.setCurrentIndex(index, true, index > this._dragStartIndex ? 1 : -1);
            }
            this._dragging = false;
            this._carousel.resumeAutoRun();
        };
        proto.stopDrag = function () {
            this._dragging = false;
        };
        proto.setCurrentIndex = function (targetIndex, animate, direction, afterDrag) {
            //console.log('target index: ', targetIndex, this._actualIndex);
            var contentCount = this._carousel.getContentCount();
            if (direction === 0) {
                //console.log('============current index: ', this._actualIndex, '   targetIndex: ', targetIndex)
                var ti = (targetIndex % contentCount + contentCount) % contentCount,
                    ai = (this._actualIndex % contentCount + contentCount) % contentCount;
                if (ti < ai && ai - ti > contentCount / 2) {
                    targetIndex = this._actualIndex + contentCount - (ai - ti);
                } else if (ti > ai && ti - ai > contentCount / 2) {
                    targetIndex = this._actualIndex - contentCount + (ti - ai);
                } else {
                    targetIndex = (targetIndex % contentCount + contentCount) % contentCount + Math.floor(this._actualIndex / contentCount) * contentCount;
                }
            } else {
                targetIndex = (targetIndex % contentCount + contentCount) % contentCount + Math.floor(this._actualIndex / contentCount) * contentCount;
                if (direction > 0 && targetIndex < this._actualIndex) {
                    targetIndex += contentCount;
                } else if (direction < 0 && targetIndex > this._actualIndex) {
                    targetIndex -= contentCount;
                }
            }
            if (animate === false) {
                this.tweenTo(targetIndex, 0);
            } else {
                var ease = afterDrag ? this.options.afterDragEase : this.options.tweenEase;
                this.tweenTo(targetIndex, undefined, ease);
            }
        };
        proto.getActualIndex = function () {
            var contentCount = this._carousel.getContentCount(),
                index = (this._actualIndex % contentCount + contentCount) % contentCount;
            return isNaN(index) ? 0 : index;
        };
        proto.tweenTo = function (targetIndex, duration, ease) {
            this.cancelTween();
            var contentCount = this._carousel.getContentCount(),
                viewWidth = this.$viewport.width(),
                totalWidth = contentCount * viewWidth,
                self = this;
            if (duration === undefined) {
                duration = this.getTweenDuration((this._actualIndex - targetIndex) * viewWidth);
            }
            if (ease === undefined) {
                ease = Linear.easeNone;
            }
            this._animating = true;
            this._carousel.pauseAutoRun();
            this._tween = TweenLite.to(this._tweenedObj, duration, {
                index: targetIndex,
                ease: ease,
                onUpdate: function onUpdate() {
                    self._actualIndex = self._tweenedObj.index;
                    var index = (self._actualIndex % contentCount + contentCount) % contentCount,
                        $prevContent = self.$contents.eq(Math.floor(index)),
                        $nextContent = self.$contents.eq((Math.floor(index) + 1) % contentCount);
                    self.setContentStyles($prevContent, {
                        x: Math.floor((Math.floor(index) - index) * viewWidth),
                        visibility: 'visible'
                    });
                    self.setContentStyles($nextContent, {
                        x: Math.floor((Math.floor(index) - index + 1) * viewWidth),
                        visibility: 'visible'
                    });
                    if (!self._carousel.options.enableLoop) {
                        if (self._actualIndex > contentCount - 1) {
                            $nextContent.css({
                                visibility: 'hidden'
                            });
                        }
                        if (self._actualIndex < 0) {
                            $prevContent.css({
                                visibility: 'hidden'
                            });
                        }
                    }
                    for (var i = 0, il = self.$contents.length; i < il; i++) {
                        var content = self.$contents[i],
                            disabledIndex = self._disabledContents.indexOf(content),
                            alreadyDisabled = disabledIndex >= 0;
                        if (content !== $prevContent[0] && content !== $nextContent[0]) {
                            if (!alreadyDisabled) {
                                self._disabledContents.push(content);
                                //$(content).css({left:viewWidth, visibility:'hide'});
                                self.setContentStyles($(content), {
                                    x: viewWidth,
                                    visibility: 'hidden'
                                });
                            }
                        } else {
                            if (alreadyDisabled) {
                                self._disabledContents.splice(disabledIndex, 1);
                            }
                        }
                    }
                    $(self._carousel).trigger('progress', {
                        actualIndex: self._actualIndex
                    });
                },
                onComplete: function onComplete() {
                    self._animating = false;
                    self._carousel.resumeAutoRun();
                    //console.log('============tween complate')
                }
            });
        };
        proto.setContentStyles = function ($content, styles) {
            var x = styles.x || 0,
                y = styles.y || 0;
            styles.x = styles.y = undefined;

            //if (Modernizr.csstransforms3d) {
            //    styles.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0px)';
            // } else if (Modernizr.csstransforms) {
            //     styles.transform = 'translate(' + x + 'px, ' + y + 'px)';
            // } else {
            styles.left = x;
            styles.top = y;
            // }
            $content.css(styles);
        };
        proto.cancelTween = function () {
            if (this._tween && this._tween.progress() < 1) {
                this._tween.kill();
            }
            this._tween = null;
            this._animating = false;
            //var contentCount = this._carousel.getContentCount();
            //this._carousel._actualIndex = (Math.floorthis._actualIndex % contentCount + contentCount ) % contentCount;
        };
        proto.isAnimating = function () {
            return this._animating;
        };
        proto.getIndex = function (x) {
            var contentCount = this._carousel.getContentCount(),
                viewWidth = this.$viewport.width(),
                totalWidth = contentCount * viewWidth;
            var x = (this._offset.x % totalWidth + totalWidth) % totalWidth,
                index = Math.ceil(x / viewWidth);
            return index;
        };
        proto.getTweenDuration = function (dx) {
            var duration = this.options.tweenDuration;
            if (typeof duration === 'function') {
                duration = duration(dx);
            } else {
                if (this.$viewport.width() > 0) {
                    duration = Math.max(0.3, Math.min(Math.abs(dx) / this.$viewport.width() * duration, duration * 1.5));
                }
            }
            if (duration <= 0) {
                duration = this.options.tweenDuration;
            }
            return duration;
        };
        proto.layout = function () {
            if (this._tween) {
                this._tween.kill();
            }
            if (this._carousel.getCurrentIndex() !== undefined) {
                this.setCurrentIndex(this._carousel.getCurrentIndex(), false, 1);
            }
        };
        return Scheme;
    }

    // if (typeof define === 'function') {
    //     define(['hance', 'jquery', 'crown/utils/browser', 'modernizr', 'greensock/TweenMax'], definition);
    // } else if (typeof module !== 'undefined' && module.exports) {
    //     module.exports = definition(require('hance'), require('jquery'), require('./utils/browser'));
    // } else {
    definition(hance, $);
    // }
})();