'use strict';

(function () {
  function Anole(root) {
    var aura = 'normal';
    function updateElements() {
      $(root).find('.otp-anole').each(function () {
        var $ele = $(this),
            attributes = this.attributes;
        for (var i = attributes.length - 1; i >= 0; i--) {
          var attribute = attributes[i],
              name = attribute.name;
          if (name.indexOf('anole-') === 0) {
            var name = name.substring(6),
                vals = eval('(' + attribute.value + ')'),
                val = vals[aura];
            if (val === undefined) {
              val = vals['lack'];
            }
            if (val !== undefined) {
              $ele.attr(name, val);
            } else {
              $ele.removeAttr(name);
            }
          }
        }
      });
    }
    Object.defineProperty(this, "aura", {
      get: function get() {
        return aura;
      },
      set: function set(val) {
        if (val == aura) {
          return;
        }
        aura = val;
        updateElements();
      }
    });
  }

  window.Anole = Anole;
})();