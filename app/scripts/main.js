(function($) {
  'use strict';

  function Events() {
    var callbacks = {};

    this.bind = function(ev, callback) {
      (callbacks[ev] || (callbacks[ev] = [])).push(callback);
    };

    this.trigger = function(ev) {
      var args = [].slice.call(arguments);

      if (!callbacks[ev]) {
        return this;
      }

      for (var i = 0; i < callbacks[ev].length; i++) {
        callbacks[ev][i].apply(this, args.slice(1));
      }
    };
  }

  // ---------------------------------

  function StateMachine() {}
  StateMachine.prototype.add = function(element) {
    var sm = this, calls = this._callbacks || (this._callbacks = []);

    calls.push(element);

    element.active = function() {
      var that = this;
      $.each(calls, function() {
        if (this === that) {
          this.activate();

          sm.current = function() {
            return that;
          };
        } else {
          this.deactivate();
        }
      });
    };
  };

  StateMachine.prototype.removeByNumber = function(from, to) {
    var calls = this._callbacks || [],
      rest = calls.slice((to || from) + 1 || calls.length);
    calls.length = from < 0 ? calls.length + from : from;
    return calls.push.apply(calls, rest);
  };

  StateMachine.prototype.removeByValue = function(el) {
    var calls = this._callbacks || [];
    for (var i = 0; i < calls.length; i+=1) {
      if (calls[i] === el) {
        return this.removeByNumber(i);
      }
    }
  };

  StateMachine.prototype.all = function() {
    return this._callbacks || [];
  };

  StateMachine.prototype.clear = function() {
    if (this._callbacks) {
      this._callbacks.length = 0;
    }
  };
  function ToolbarObject() {
    this.$self = $('<div class=\'banner-toolbar\'></div>');
    this.$$textButton = $('<a href class=\'banner-text-button btn\'></a>');
    this.$$textButton.text('Add text >');

    this.$self.append(this.$$textButton);
  }

  // ---------------------------------

  function BannerObject(options) {
    var that = this;

    this.$self = $('<div class=\'banner-workspace\'></div>');

    this.$$workspace = $('<div></div>');
    this.$$background = $('<img/>');

    this.$$background.attr('draggable', false);

    this.$self.append(this.$$workspace);
    this.$$workspace.append(this.$$background);

    this.setBackground = function(image, callback) {
      this.$$background.prop('src', image);

      this.$$background.off('load').on('load', function() {
        var $this = $(this);

        $this.css({
          'position': 'absolute',
          'width': '100%',
          'height': '100%',
        });

        that.setSize($this[0].naturalWidth, $this[0].naturalHeight);
        callback && callback.call(that);
      });
    };

    if (options.background) {
      this.setBackground(options.background);
    }

    this.getBackground = function() {
      return this.$$background.prop('src');
    };

    this.setSize = function(width, height) {
      if (options.maxWidth && width > options.maxWidth) {
        width = options.maxWidth;
      }

      if (options.minWidth && width < options.minWidth) {
        width = options.minWidth;
      }

      if (options.maxHeight && height > options.maxHeight) {
        height = options.maxHeight;
      }

      if (options.minHeight && height < options.minHeight) {
        height = options.minHeight;
      }

      this.width = width;
      this.height = height;

      this.$$workspace.width(width);
      this.$$workspace.height(height);
    };

    this.setSize(options.width, options.height);

    this.initResize = function() {
      var params = {};

      if (options.maxHeight) {
        params.maxHeight = options.maxHeight;
      }

      if (options.minHeight) {
        params.minHeight = options.minHeight;
      }

      if (options.minWidth) {
        params.minWidth = options.minWidth;
      }

      if (options.maxWidth) {
        params.maxWidth = options.maxWidth;
      }

      params.stop = function(event, ui) {
        that.setSize(ui.size.width, ui.size.height);

        if ($.isFunction(that.onResized)) {
          that.onResized();
        }
      };

      this.$self.resizable(params);
    };

    this.$self.droppable({
      drop: function(/* e, ui */) {
        if ($.isFunction(that.onDrop)) {
          that.onDrop();
        }
      },
    });

    this.put = function(component) {
      this.$$workspace.append(component.$self);
    };
  }

  // ---------------------------------

  function CommonObject() {}

  CommonObject.prototype.applyProperties = function() {
    var that = this;

    $.each(this.properties, function(prop, val) {
      if ($.isFunction(val.method)) {
        $.proxy(val.method, that)(prop, val);
      } else {
        that.$$text.css(prop, val.value);
      }
    });
  };

  CommonObject.prototype.activate = function() {
    this.$self.addClass('activated');
  };

  CommonObject.prototype.deactivate = function() {
    this.$self.removeClass('activated');
  };

  CommonObject.prototype.preview = function() {
    var $prevObject = this.$self.clone();

    $prevObject.css({
      'position': 'absolute',
    });

    $prevObject.children('span').css({
      'display': 'inline-block',
    });

    $prevObject.attr('class', 'banner-preview-object');

    return $prevObject;
  };

  // ---------------------------------

  function TextObject() {
    this.$self = $('<div class=\'banner-text-object\'></div>');
    this.$$text = $('<span></span>');

    this.properties = $.extend(true, {}, this.properties);
    this.applyProperties();
    this.$self.append(this.$$text);
    this.$self.draggable({
      containment: 'parent',
    });
  }


  TextObject.prototype = Object.create(CommonObject.prototype);
  TextObject.prototype.constructor = TextObject;

  TextObject.prototype.fillProperties = function(properties) {
    var that = this,
        currentProp;

    $.each(properties, function(i, v) {
      currentProp = that.properties[i];

      if (!currentProp) {
        return;
      }

      if (currentProp.values) {
        v = currentProp.values.indexOf(v);

        if (v === -1) {
          v = 0;
        }
      }

      currentProp.value = v;

      if (currentProp.method) {
        $.proxy(currentProp.method, that)(i, currentProp);
      }
    });
  };

  // ---------------------------------

  function PropertiesObject() {
    var that = this;

    this.$self = $('<div class=\'banner-properties\'></div>');

    this.fill = function(properties) {
      var
        $properties = $('<form role=\'form\'></form>'),
        $group, $field,
        options = ''
      ;

      $.each(properties, function(prop, val) {
        $group = $('<div class=\'form-group\'></div>');
        $group.append('<label>' + (val.label || prop) + '</label>');

        if (val.type === 'select') {
          $field = $('<select></select>');

          $.each(val.values, function(i, v) {
            if (i === val.value) {
              options += '<option selected value=\'' + v + '\'>' + v + '</option>';
            } else {
              options += '<option value=\'' + v + '\'>' + v + '</option>';
            }
          });

          $field.append(options);
        } else {
          if (val.type === 'textarea') {
            $field = $('<textarea rows=\'3\'>');
            val.value = val.value.replace(/<(\/)?br(\/)?>/g,'\n');
          } else {
            $field = $('<input type=\'' + (val.type || 'text') + '\'/>');
          }

          $field.val(val.value);
        }

        $field.addClass('form-control');
        $field.data('prop', val);

        $group.append($field);

        $properties.append($group);
      });

      var $removeButton = $('<a href class=\'banner-remove-text btn\'></a>');

      $removeButton.text('Remove');

      $removeButton.on('click', function() {
        that.onRemove();
        return false;
      });

      $properties.append($removeButton);

      this.$self.html($properties);
    };

    this.$self.on('keyup change', '.form-control', function() {
      var $this = $(this);

      if (!$this.data('prop')) {
        return;
      }

      $this.data('prop').value = $this.val();

      if ($.isFunction(that.onChange)) {
        that.onChange();
      }
    });
  }

  // ---------------------------------

  function PreviewObject(showPreview, showCode) {
    var that = this;
    this.$self = $('<div class=\'banner-preview\'></div>');
    this.$$preview = $('<div></div>');
    this.$$background = $('<img/>');
    this.$$code = $('<div></div>');

    this.$self.css({
      'position': 'relative',
      'display': 'inline-block',
    });

    this.$$background.css({
      'position': 'absolute',
      'width': '100%',
      'height': '100%',
    });

    this.$$preview.css('position', 'relative');
    this.$$background.attr('draggable', false);

    this.update = function(banner, textObjects) {
      this.$$preview.empty();

      this.$$preview.append(this.$$background);

      this.$$preview.width(banner.width);
      this.$$preview.height(banner.height);
      this.$$background.prop('src', banner.getBackground());

      $.each(textObjects, function() {
        that.$$preview.append(this.preview());
      });

      that.$$code.text($('<div>').append(this.$$preview.clone()).html());
    };

    if (showPreview) {
      this.$self.append(this.$$preview);
    }

    if (showCode) {
      this.$self.append(this.$$code);
    }
  }

  // ---------------------------------

  function Basic(options) {
    this.init(options);
  }

  Basic.prototype.init = function(options) {
    var that = this;

    this.events = new Events();

    this.options = $.extend({
      'width': 300,
      'height': 300,
      'show-preview': true,
      'show-preview-code': true,
    }, options);

    // default values for properties
    TextObject.prototype.properties = $.extend({
      'text': {
        'label': 'Text',
        'type': 'textarea',
        'value': 'Text',
        'method': function(prop, val) {
          val.value = val.value.replace(/\n/g, '<br\/>');
          val.value = val.value.replace(/\s/g, '&nbsp');
          val.value = val.value.replace(/&nbsp/g, ' ');
          this.$$text.html(val.value);
        },
      },
      'width': {
        'label': 'Width',
        'type': 'text',
        'value': 'auto',
      },
      'text-align': {
        'label': 'Horz Position',
        'type': 'select',
        'values': ['left', 'center', 'right', 'justify', 'start', 'end',],
        'value': 0,
      },
      'color': {
        'label': 'Color',
        'type': 'color',
        'value': '#000000',
      },
      'font-size': {
        'label': 'Size',
        'type': 'number',
        'value': 14,
        'method': function(prop, val) {
          this.$$text.css(prop, val.value + 'px');
        },
      },
      'font-family': {
        'label': 'Font',
        'type': 'text',
        'value': 'Tahoma, Arial',
      },
    }, this.options.properties || {});

    this.banner = new BannerObject(this.options),
    this.preview = new PreviewObject(this.options['show-preview'], this.options['show-preview-code']);
    this.sm = new StateMachine();

    this.banner.onDrop = function() {
      var textObjects = that.sm.all(),
          rightBorder, bottomBorder
      ;

      that.events.trigger('update');

      $.each(textObjects, function() {
        rightBorder = parseInt(this.$self.css('left'), 10) + this.$self.width();
        bottomBorder = parseInt(this.$self.css('top'), 10) + this.$self.height();

        if (!that.banner.rightBorder || that.banner.rightBorder < rightBorder) {
          that.banner.rightBorder = rightBorder;
        }

        if (!that.banner.bottomBorder || that.banner.bottomBorder < bottomBorder) {
          that.banner.bottomBorder = bottomBorder;
        }
      });
    };

    this.banner.onResized = function() {
      that.events.trigger('update');
    };
  };

  Basic.prototype._addTextObject = function() {
    var text = new TextObject(),
        active = $.proxy(function() {
          text.active();
          this.properties.fill(text.properties);
        }, this)
    ;

    this.sm.add(text);

    text.$self.on('mousedown', active);
    text.$self.on('touchstart', active);

    this.banner.put(text);

    return text;
  },

  Basic.prototype.fill = function(obj) {
    if (obj.background) {
      if (obj.background.src) {
        this.banner.setBackground(obj.background.src, function() {
          if (obj.background.width && obj.background.height) {
            this.setSize(obj.background.width, obj.background.height);
          }
        });
      }
    }

    if (obj.objects) {
      var text, that = this;

      $.each(obj.objects, function() {
        text = that._addTextObject();
        text.fillProperties(this.properties);
        text.applyProperties();
        text.$self.css('left', this.positions.left);
        text.$self.css('top', this.positions.top);
      });
    }

    this.events.trigger('update');
  },

  Basic.prototype.getJSON = function() {
    var obj = {},
        properties;

    obj.background = {
      src: this.banner.getBackground(),
      width: this.banner.width,
      height: this.banner.height,
    };
    obj.objects = [];

    $.each(this.sm.all(), function() {
      properties = {};

      $.each(this.properties, function(k, v) {
        if (v.values) {
          v = v.values[v.value];
        } else {
          v = v.value;
        }

        properties[k] = v;
      });

      obj.objects.push({
        properties: properties,
        positions: {left: this.$self.css('left'), top: this.$self.css('top')}
      });
    });

    return obj;
  };

  Basic.prototype.clear = function() {
    $.each(this.sm.all(), function() {
      this.$self.remove();
    });
    this.sm.clear();
    this.events.trigger('update');
  };

  Basic.prototype.setBackground = function(src) {
    var that = this;

    this.banner.setBackground(src, function() {
      that.events.trigger('update');
    });
  };

  Basic.prototype.getHTML = function() {
    return $('<div>').append(this.preview.$$preview.clone()).html();
  };

  function Advanced(options) {
    this.init(options);
  }

  Advanced.prototype = Object.create(Basic.prototype);

  Advanced.prototype.init = function(options) {
    var that = this;

    this.__proto__.__proto__.init(options);

    this.options = $.extend({
      minWidth: 200,
      minHeight: 150,
      maxWidth: 1000,
      maxHeight: 750,
      width: 700,
      height: 400,
    }, options);

    this.toolbar = new ToolbarObject();
    this.properties = new PropertiesObject();

    this.properties.onChange = function() {
      that.sm.current().applyProperties();
      that.events.trigger('update');
    };

    this.properties.onRemove = function() {
      var currentObject = that.sm.current();
      that.sm.removeByValue(currentObject);
      currentObject.$self.remove();
      that.events.trigger('update');
    };

    // добавление на баннер текста
    this.toolbar.$self.on('click', '.banner-text-button', function() {

      that._addTextObject();

      that.events.trigger('update');

      return false;
    });
  };

  // ---------------------------------

  $.fn.showBanner = function(unparsed_json, additional) {
    var $obj = $('<div>'),
        $this = $(this),
        options = this.val(),
        base;

    unparsed_json = unparsed_json || options;

    options = JSON.parse(unparsed_json);

    options = $.extend(options, additional);

    base = new Basic(options);

    base.events.bind('update', function() {
      base.preview.update(base.banner, base.sm.all());
      $this.val(JSON.stringify(base.getJSON()));
    });

    $obj.append(base.preview.$self);

    $this.hide();
    $this.after($obj);

    base.fill(options);

    return base;
  };

  $.fn.showBannerEditor = function(options) {
    var $obj = $('<div>'),
        $this = $(this),
        advanced = new Advanced(options);

    advanced.events.bind('update', function() {
      advanced.preview.update(advanced.banner, advanced.sm.all());
      $this.val(JSON.stringify(advanced.getJSON()));
    });

    advanced.banner.initResize();

    $obj.append(advanced.toolbar.$self, advanced.banner.$self, advanced.properties.$self, advanced.preview.$self);

    $this.hide();
    $this.after($obj);

    return advanced;
  };

})(jQuery);