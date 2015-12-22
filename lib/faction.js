'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FactionPrototype = Object.create(HTMLElement.prototype);
// Object.defineProperty(FactionPrototype, 'kind', {
//     value: 'image',
//     writable : true
// });
// Object.defineProperty(FactionPrototype, 'name', {
//     value: '',
//     writable : true
// });
FactionPrototype.createdCallback = function () {
  // if (this.preload){
  // 	this.load();
  // }
  //kind, name, source, width, height;
  // if (this.kind === undefined){
  // 	this.kind = 'image';
  // }
  this._loadCount = 0;
  this._appliedScale = null;
};
FactionPrototype.readAttributes = function () {
  this.name = this.getAttribute('name');
  this.kind = this.getAttribute('kind') || 'image';
  //this.source = this.getAttribute('source');
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
    case 'name':
      $(this).empty();
      this.name = newVal;
      this.load();
      break;
    case 'kind':
      $(this).empty();
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
        //TODO others.
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
        //TODO others.
      }
      break;
  }
};
var pixelRatio = parseInt(window.devicePixelRatio || 1);

function getSuitableScale(node, data) {
  var ratio = pixelRatio,
      width = $(node).width(),
      height = $(node).height();
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
FactionPrototype.play = function (pos) {
  switch (this.kind) {
    case 'flash':
      if (pos !== undefined) {
        this.scene.gotoAndPlay(pos);
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
    case 'flash':
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
  };

  var loadCount = ++this._loadCount;
  var factionData = window.metadata.factions && this.name ? window.metadata.factions[this.name] || {} : {};
  factionData.image.scales.sort(function (a, b) {
    return a > b ? -1 : 1;
  });
  switch (this.kind) {
    case 'image':
      {
        var scale = getSuitableScale(this, factionData.image);
        if (this._appliedScale >= scale) {
          deferred.resolve();
          return deferred.promise();
        }
        this._appliedScale = scale;
        $faction.children().attr('otp-state', 'retired');
        var $img = $('<img class="otp-canvas">'),
            src = factionData.base + '/' + this.name + '/' + this.name + '@' + scale + 'p.' + factionData.image.extension;
        $img.on('load', function () {
          $faction.find('[otp-state=retired]').remove();
          deferred.resolve();
        }).on('error', function () {
          deferred.resolve();
        }).attr({ width: this.width, height: this.height, src: src });
        $faction.prepend($img);
        break;
      }
    case 'background':
      {
        var scale = getSuitableScale(this, factionData.image);
        if (this._appliedScale >= scale) {
          deferred.resolve();
          return deferred.promise();
        }
        this._appliedScale = scale;
        var $img = $('<img>'),
            src = factionData + '/' + this.name + '/' + this.name + '@' + scale + 'p.' + factionData.image.extension;
        $img.on('load', function () {
          deferred.resolve();
        }).on('error', function () {
          deferred.resolve();
        }).attr({ src: src });
        if (this.width) {
          if (this.height) {
            $faction.css({ 'background-size': this.width + 'px ' + this.height + 'px' });
          } else {
            $faction.css({ 'background-size': this.width + 'px' });
          }
        }
        $faction.css({ 'background-image': 'url(' + src + ')' });
        break;
      }
    case 'flash':
      {
        // let scale = getSuitableScale(this, factionData.flash);
        // if (this._appliedScale >= scale) {
        //   deferred.resolve();
        //   return deferred.promise();
        // }
        // this._appliedScale = setting;
        createjs.LoadItem.LOAD_TIMEOUT_DEFAULT = 800000;
        if (factionData.flash) {
          $faction.children().attr('otp-state', 'retired');
          var preload = factionData.flash.create($faction, factionData.flash.library);
          if (preload && !preload.loaded) {
            preload.addEventListener('complete', function (e) {
              $faction.find('[otp-state=retired]').remove();
              deferred.resolve();
            }, false);
            preload.addEventListener('error', function (e) {
              deferred.resolve();
            }, false);
          } else {
            $faction.find('[otp-state=retired]').remove();
            deferred.resolve();
          }
        } else {
          throw "No flash data found!";
        }
        break;
      }
    // case 'swiffy':{
    //   let setting = getSuitableScale(this, factionData.swiffy);
    //   if (this._appliedScale === setting) {
    //     deferred.resolve();
    //     return deferred.promise();
    //   }
    //   this._appliedScale = setting;
    //   $.getJSON(setting.source).done((swiffyObject) => {
    //     if (loadCount !== this._loadCount) return;
    //
    //     var stage = new swiffy.Stage($faction[0], swiffyObject, {});
    //     $faction.css({
    //       width: setting.width,
    //       height: setting.height
    //     });
    //     stage.start();
    //     $faction.children().addClass('otp-canvas');
    // 		// this._stage = stage;
    //     deferred.resolve();
    //   });
    //   break;
    // }
    default:
      {
        console.error("Not support faction kind: ", this.kind);
        break;
      }
  }
  return deferred.promise();
};

document.registerElement('otp-faction', { prototype: FactionPrototype });

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