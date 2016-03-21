'use strict';

(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.faction = mod.exports;
  }
})(this, function (exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();

  var FactionPrototype = Object.create(HTMLElement.prototype);
  var motionLibUrl = '//code.createjs.com/createjs-2015.11.26.min.js';

  FactionPrototype.createdCallback = function () {
    this._loadCount = 0;
    this._appliedScale = null;
    this._bitmaps = {};
    this._sprites = {};
  };

  FactionPrototype.readAttributes = function () {
    this.base = this.getAttribute('base');
    this.kind = this.getAttribute('kind') || 'image';
    this.width = this.getAttribute('width');
    this.height = this.getAttribute('height');
    var stay = this.getAttribute('stay');

    if (stay != null) {
      if (stay === '' || stay === 'true') {
        stay = 0;
      } else {
        stay = parseInt(stay);
      }

      this._stayPosition = stay;
    }
  };

  FactionPrototype.attributeChangedCallback = function (name, oldVal, newVal) {
    if (this._loadCount <= 0) return;
    var $this = $(this);

    switch (name) {
      case 'base':
        $(this).empty();
        this.base = newVal;
        this.load();
        break;

      case 'kind':
        $(this).empty();
        this._oldKind = this.kind;
        this.kind = newVal;
        this.load();
        break;

      case 'stay':
        this._stayPosition = newVal;

        if (newVal != null) {
          if (newVal === '' || newVal === 'true') {
            newVal = 0;
          } else {
            newVal = parseInt(newVal);
          }

          this._stayPosition = newVal;
        }

        this.stop(this._stayPosition);

      case 'width':
        switch (this.kind) {
          case 'image':
            $this.find('img').attr('width', this.width);
            break;

          case 'background':
            if (this.height) {
              $this.css({
                'background-size': this.width + 'px ' + this.height + 'px'
              });
            } else {
              $this.css({
                'background-size': this.width + 'px'
              });
            }

            break;
        }

      case 'height':
        switch (this.kind) {
          case 'image':
            $(this).find('img').attr('height', this.height);
            break;

          case 'background':
            if (this.width) {
              $(this).css({
                'background-size': this.width + 'px ' + this.height + 'px'
              });
            } else {
              $(this).css({
                'background-size': 'auto ' + this.height + 'px'
              });
            }

            break;
        }

        break;
    }
  };

  var pixelRatio = parseInt(window.devicePixelRatio || 1),
      motionLibPromise;

  function getSuitableImageScale(node, data) {
    var ratio = pixelRatio,
        css = getComputedStyle(node),
        width = parseFloat(css.width),
        height = parseFloat(css.height);

    for (var i = 0, il = data.scales.length; i < il; i++) {
      var currScale = data.scales[i],
          currWidth = Math.ceil(currScale * data.width / pixelRatio / 100);

      if (i < il - 1) {
        var nextScale = data.scales[i + 1],
            nextWidth = Math.ceil(nextScale * data.width / pixelRatio / 100);

        if (nextWidth < width) {
          return currScale;
        }
      } else {
        return currScale;
      }
    }
  }

  function getMotionStageScale(node, mcfg) {
    var ratio = pixelRatio,
        $node = $(node),
        width = $node.width(),
        height = $node.height(),
        rwidth = ratio * width * mcfg.scale,
        rheight = ratio * height * mcfg.scale;
    return Math.max(rwidth / mcfg.stage.width, rheight / mcfg.stage.height);
  }

  function getScript(src) {
    var script = document.createElement('script'),
        deferred = $.Deferred();
    script.async = "async";
    script.addEventListener('load', function () {
      deferred.resolve();
    }, false);
    script.src = src;
    document.getElementsByTagName("head")[0].appendChild(script);
    return deferred;
  }

  function getMotionSupportLibs() {
    if (motionLibPromise) {
      return motionLibPromise;
    }

    if (window.createjs) {
      if (!motionLibPromise) {
        var deferred = $.Deferred();
        deferred.resolve();
        createjs.LoadItem.LOAD_TIMEOUT_DEFAULT = 800000;
        motionLibPromise = deferred.promise();
      }

      return motionLibPromise;
    }

    motionLibPromise = getScript(motionLibUrl);
    return motionLibPromise;
  }

  FactionPrototype.play = function (spos, epos) {
    switch (this.kind) {
      case 'motion':
        if (pos !== undefined) {
          this.scene.gotoAndPlay(spos);
        } else {
          this.scene.play();
        }

        break;

      default:
        console.warn('Not supported play function in this kind:', this.kind);
    }
  };

  FactionPrototype.stop = function (pos) {
    switch (this.kind) {
      case 'motion':
        this.scene.gotoAndStop(pos);
        break;

      default:
        console.warn('Not supported stop function in this kind:', this.kind);
    }
  };

  FactionPrototype.load = function (policy) {
    this.readAttributes();
    var deferred = $.Deferred(),
        $faction = $(this);

    if (policy && !policy($faction)) {
      deferred.resolve();
      return deferred.promise();
    }

    ;
    var loadCount = ++this._loadCount,
        self = this;
    var factionData = window.metadata.factions && this.base ? window.metadata.factions[this.base] || {} : {};
    factionData.image.scales.sort(function (a, b) {
      return a > b ? -1 : 1;
    });

    switch (this.kind) {
      case 'image':
        {
          var scale = getSuitableImageScale(this, factionData.image);

          if (this._appliedScale >= scale && this.kind == this._oldKind) {
            deferred.resolve();
            return deferred.promise();
          }

          this._appliedScale = scale;
          $faction.children().attr('otp-state', 'retired');
          var $img = $('<img class="otp-canvas">'),
              src = this.base + '/' + factionData.name + '@' + scale + 'p.' + factionData.image.extension;
          $img.on('load', function () {
            $faction.find('[otp-state=retired]').remove();
            deferred.resolve();
          }).on('error', function () {
            deferred.resolve();
          }).attr({
            width: this.width,
            height: this.height,
            src: src
          });
          $faction.prepend($img);
          break;
        }

      case 'background':
        {
          var scale = getSuitableImageScale(this, factionData.image);

          if (this._appliedScale >= scale && this.kind == this._oldKind) {
            deferred.resolve();
            return deferred.promise();
          }

          var $img = $('<img>'),
              src = this.base + '/' + factionData.name + '@' + scale + 'p.' + factionData.image.extension;
          $img.on('load', function () {
            deferred.resolve();
          }).on('error', function () {
            deferred.resolve();
          }).attr({
            src: src
          });

          if (this.width) {
            if (this.height) {
              $faction.css({
                'background-size': this.width + 'px ' + this.height + 'px'
              });
            } else {
              $faction.css({
                'background-size': this.width + 'px'
              });
            }
          }

          $faction.css({
            'background-image': 'url(' + src + ')'
          });
          this._appliedScale = scale;
          break;
        }

      case 'motion':
        {
          if (this._appliedScale >= scale && this.kind == this._oldKind) {
            deferred.resolve();
            return deferred.promise();
          }

          var motion = factionData.motion;

          if (motion) {
            var scale = getMotionStageScale(this, motion),
                $canvas = $faction.find('canvas[otp-motion-canvas]');

            if ($canvas.length > 0) {
              $canvas.attr({
                width: Math.round(motion.stage.width * scale / 100),
                height: Math.round(motion.stage.height * scale / 100),
                'otp-stage-width': motion.stage.width,
                'otp-stage-height': motion.stage.height
              });
              self.stage.scaleX = self.stage.scaleY = scale / 100;
              self.loadUpdatedMotionImages(factionData, scale).then(function (mftItems) {
                for (var i = 0, il = mftItems.length; i < il; i++) {
                  var mftItem = mftItems[i],
                      cfg = factionData.motion.images[mftItem.id],
                      evt = new createjs.Event('changed');

                  if (factionData.motion.atlases) {
                    var atlas = factionData.motion.atlases[mftItem.id];

                    if (atlas) {
                      var sprite = self._sprites[mftItem.id],
                          scale = cfg.ewidth / mftItem.img.width,
                          result = {
                        images: {},
                        frames: self.getScaledFramesBounds(atlas.frames, 1 / scale)
                      };
                      result.images.push(mftItem.img);
                      sprite.spriteSheet = new createjs.SpriteSheet(result);
                      evt.set({
                        scale: scale
                      });
                      sprite.dispatchEvent(evt);
                    }
                  } else {
                    var bitmap = self._bitmaps[mftItem.id],
                        scale = cfg.ewidth / mftItem.img.width;
                    bitmap.image = mftItem.img;
                    evt.set({
                      scale: scale
                    });
                    bitmap.dispatchEvent(evt);
                  }
                }
              });
            } else {
              if (!self._motionLoading) {
                $faction.children().attr('otp-state', 'retired');
                this.loadMotion(factionData, scale).then(function () {
                  $faction.find('[otp-state=retired]').remove();
                  var $canvas = $('<canvas otp-motion-canvas>').attr({
                    width: Math.round(motion.stage.width * scale / 100),
                    height: Math.round(motion.stage.height * scale / 100),
                    'otp-stage-width': motion.stage.width,
                    'otp-stage-height': motion.stage.height
                  }).appendTo($faction);
                  self.stage = new createjs.Stage($canvas[0]);
                  self.scene = new motion.library[factionData.name]();
                  self.stage.addChild(self.scene);
                  self.stage.scaleX = self.stage.scaleY = scale / 100;
                  self.stage.update();
                  createjs.Ticker.addEventListener("tick", self.stage);
                  deferred.resolve();
                });
              }
            }
          } else {
            throw "No motion data found!";
          }

          this._appliedScale = scale;
          break;
        }

      default:
        {
          console.error("Not support faction kind: ", this.kind);
          break;
        }
    }

    return deferred.promise();
  };

  FactionPrototype.loadMotionLibs = function (factionData) {
    if (!this._motionLibsPromise) {
      this._motionLibsPromise = $.when(getMotionSupportLibs(), getScript(this.base + '/motion/' + factionData.name + '.js'));
    }

    return this._motionLibsPromise;
  };

  FactionPrototype.loadUpdatedMotionImages = function (factionData, scale) {
    if (this._loadUpdatedMotionImagesDeferred && this._loadUpdatedMotionImagesDeferred.state() == 'pending') {
      this._loadUpdatedMotionImagesDeferred.reject();
    }

    var deferred = this._loadUpdatedMotionImagesDeferred = $.Deferred(),
        images = [],
        self = this;

    for (var i = 0, il = this._motionManifest.length; i < il; i++) {
      var existMftItem = this._motionManifest[i],
          newMftItem = this.getMotionManifestItem(factionData, existMftItem.id, scale);

      if (existMftItem.scale < newMftItem.scale) {
        images.push(newMftItem);
      }
    }

    if (images.length > 0) {
      var loadedCount = 0,
          totalCount = images.length;

      var loadMftItem = function loadMftItem(mftItem) {
        var img = new Image();
        img.addEventListener('load', function () {
          self._motionManifest[self._motionManifest.indexOf(self.findMotionMftItem(mftItem.id))] = mftItem;
          mftItem.img = this;

          if (++loadedCount == totalCount) {
            self._loadUpdatedMotionImagesDeferred.resolve(images);
          }
        }, false);
        img.src = mftItem.src;
      };

      for (var i = 0, il = images.length; i < il; i++) {
        loadMftItem(images[i]);
      }
    } else {
      this._loadUpdatedMotionImagesDeferred.resolve([]);
    }

    return this._loadUpdatedMotionImagesDeferred.promise();
  };

  FactionPrototype.buildMotionManifest = function (factionData, scale) {
    var manifest = [];

    for (var key in factionData.motion.images) {
      manifest.push(this.getMotionManifestItem(factionData, key, scale));
    }

    return manifest;
  };

  FactionPrototype.getMotionManifestItem = function (factionData, key, scale) {
    var image = factionData.motion.images[key],
        scales = image.scales,
        selectedScale = 100,
        exceptScale = scale / (image.width / image.ewidth);

    for (var i = 0, il = scales.length; i < il; i++) {
      var cscale = scales[i],
          nscale = scales[i + 1];

      if (cscale >= exceptScale && (nscale == null || nscale < exceptScale)) {
        selectedScale = cscale;
        break;
      }
    }

    return {
      src: this.base + '/motion/images/' + key + '@' + selectedScale + 'p.' + image.extension,
      id: key,
      scale: selectedScale
    };
  };

  FactionPrototype.buildBitmapDefine = function (lib, id, bounds, img, scale) {
    var p = new createjs.Bitmap(img),
        m = new createjs.MovieClip();
    p.nominalBounds = m.nominalBounds = new (Function.prototype.bind.call(createjs.Rectangle, null, bounds))();
    this._bitmaps[id] = p;

    var Bitmap = function Bitmap() {};

    Bitmap.prototype = p;
    (lib[id] = function () {
      var b = new Bitmap();
      b.setTransform(0, 0, scale, scale);
      p.addEventListener('changed', function (e) {
        b.setTransform(0, 0, e.scale / scale, e.scale / scale);
      });
      this.addChild(b);
    }).prototype = m;
  };

  FactionPrototype.buildSpriteDefine = function (lib, id, frame, ss, scale) {
    var p = new createjs.Sprite(),
        m = new createjs.MovieClip();
    this._sprites[id] = p;

    var Sprite = function Sprite() {
      this.spriteSheet = ss;
      this.gotoAndStop(frame);
    };

    Sprite.prototype = p;
    (lib[id] = function () {
      var s = new Sprite();
      s.setTransform(0, 0, scale, scale);
      this.addChild(s);
      p.addEventListener('changed', function (e) {
        s.setTransform(0, 0, e.scale, e.scale);
      });
    }).prototype = m;
  };

  FactionPrototype.findMotionMftItem = function (id) {
    var mftItem;

    for (var j = 0, jl = this._motionManifest.length; j < jl; j++) {
      var item = this._motionManifest[j];

      if (item.id == id) {
        mftItem = item;
        break;
      }
    }

    return mftItem;
  };

  FactionPrototype.getScaledFramesBounds = function (frames, scale) {
    var scaledFrames = [];

    for (var i = 0, il = frames.length; i < il; i++) {
      var bounds = frames[i];
      scaledFrames.push([bounds[0] * scale, bounds[1] * scale, bounds[2] * scale, bounds[3] * scale]);
    }

    return scaledFrames;
  };

  FactionPrototype.loadMotion = function (factionData, scale) {
    if (this._motionPromise) {
      return this._motionPromise;
    }

    var deferred = $.Deferred(),
        self = this;
    this._motionPromise = deferred.promise();
    this.loadMotionLibs(factionData).then(function () {
      var motion = factionData.motion,
          lib = motion.library,
          prop = lib.properties,
          images = {},
          ss = {};
      var preload = new createjs.LoadQueue(false);
      self._motionLoading = true;
      preload.addEventListener('complete', function (e) {
        self._motionLoading = false;

        if (motion.atlases) {
          for (var id in motion.atlases) {
            var atlas = motion.atlases[id],
                spriteNames = atlas.sprites,
                mftItem = self.findMotionMftItem(id),
                img = motion.images[id],
                scale = img.width * mftItem.scale / 100 / img.ewidth;
            var result = {
              images: [],
              frames: self.getScaledFramesBounds(atlas.frames, scale)
            };
            result.images.push(preload.getResult(id));
            ss[id] = new createjs.SpriteSheet(result);
            var sprites = motion.atlases[id].sprites;

            for (var i = 0, il = sprites.length; i < il; i++) {
              self.buildSpriteDefine(lib, sprites[i], i, ss[id], 1 / scale);
            }
          }
        } else {
          for (var i = 0, il = self._motionManifest.length; i < il; i++) {
            var mftItem = self._motionManifest[i];
            images[mftItem.id] = preload.getResult(mftItem.id);
          }

          if (motion.bitmaps) {
            for (var id in motion.bitmaps) {
              var mftItem = self.findMotionMftItem(id),
                  img = motion.images[id],
                  scale = img.width * mftItem.scale / 100 / img.ewidth;
              self.buildBitmapDefine(lib, id, motion.bitmaps[id].bounds, images[id], 1 / scale);
            }
          }
        }

        motion.initLibrary(lib, createjs);
        deferred.resolve();
      }, false);
      preload.addEventListener('error', function (e) {
        console.log('Error when loading motion:', e.title, e.message);
        deferred.reject();
      }, false);
      self._motionManifest = self.buildMotionManifest(factionData, scale);
      preload.loadManifest(self._motionManifest);
    });
    return this._motionPromise;
  };

  document.registerElement('otp-faction', {
    prototype: FactionPrototype
  });

  var FactionLoader = (function () {
    function FactionLoader($root, policy) {
      _classCallCheck(this, FactionLoader);

      this.$root = $root;

      this._policy = policy || function ($faction) {
        return true;
      };
    }

    _createClass(FactionLoader, [{
      key: 'load',
      value: function load() {
        var _this = this;

        var loadingCount = 0,
            allRequested = false,
            deferred = $.Deferred();
        this.$root.find('otp-faction').each(function (index, faction) {
          loadingCount++;
          faction.load(_this._policy).then(function () {
            loadingCount--;

            if (allRequested && loadingCount === 0) {
              deferred.resolve();
            }
          });
        });
        allRequested = true;

        if (loadingCount === 0) {
          deferred.resolve();
        }

        return deferred.promise();
      }
    }]);

    return FactionLoader;
  })();

  exports.FactionPrototype = FactionPrototype;
  exports.FactionLoader = FactionLoader;
});