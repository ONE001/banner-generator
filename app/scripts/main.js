'use strict';

(function($){

  jQuery.fn.generateBanner = function(options) {
    var
      build = function() {
        var obj = $('<div>'),
            $this = $(this),
            banner = new BannerObject(),
            toolbar = new ToolbarObject(),
            properties = new PropertiesObject(),
            preview = new PreviewObject(),
            sm = new StateMachine(),

            addTextObject = function() {
              var
                text = new TextObject(),
                active = function() {
                  text.active();
                  properties.fill(text.properties);
                }
              ;

              sm.add(text);

              text.$self.on('mousedown', active);
              text.$self.on('touchstart', active);

              banner.put(text);

              return text;
            },

            res = {
              clear: function() {
                $.each(sm.all(), function() {
                  this.$self.remove();
                });
                sm.clear();
                preview.update(banner, sm.all());
              },
              setBackground: function(src) {
                banner.setBackground(src);
              },
              getHTML: function() {
                return $('<div>').append(preview.$$preview.clone()).html();
              },
              getJSON: function() {
                var obj = {},
                  properties;

                obj.background = {
                  src: banner.getBackground(),
                  width: banner.width,
                  height: banner.height,
                };
                obj.objects = [];

                $.each(sm.all(), function() {
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
              },
              fill: function(obj) {
                if (obj.background) {
                  if (obj.background.src) {
                    banner.setBackground(obj.background.src);
                  }

                  if (obj.background.width && obj.background.height) {
                    banner.setSize(obj.background.width, obj.background.height);
                  }
                }

                if (obj.objects) {
                  var text;

                  $.each(obj.objects, function() {
                    text = addTextObject();
                    text.fillProperties(this.properties);
                    text.applyProperties();
                    text.$self.css('left', this.positions.left);
                    text.$self.css('top', this.positions.top);
                  });
                }

                preview.update(banner, sm.all());
              },
            },

            jsonInInput = function() {
              $this.val(JSON.stringify(res.getJSON()));
            }
        ;

        banner.initResize();

        properties.onChange = function() {
          sm.current().applyProperties();
          preview.update(banner, sm.all());
          jsonInInput();
        };

        properties.onRemove = function() {
          var currentObject = sm.current();
          sm.removeByValue(currentObject);
          currentObject.$self.remove();
          preview.update(banner, sm.all());
          jsonInInput();
        };

        banner.onDrop = function() {
          var
            textObjects = sm.all(),
            rightBorder, bottomBorder
          ;

          preview.update(banner, textObjects);
          jsonInInput();

          $.each(textObjects, function() {
            rightBorder = parseInt(this.$self.css('left'), 10) + this.$self.width();
            bottomBorder = parseInt(this.$self.css('top'), 10) + this.$self.height();

            if (!banner.rightBorder || banner.rightBorder < rightBorder) {
              banner.rightBorder = rightBorder;
            }

            if (!banner.bottomBorder || banner.bottomBorder < bottomBorder) {
              banner.bottomBorder = bottomBorder;
            }
          });
        };

        banner.onResized = function() {
          preview.update(banner, sm.all());
          jsonInInput();
        };

        obj.append(toolbar.$self);
        obj.append(banner.$self);
        obj.append(properties.$self);
        obj.append(preview.$self);

        // добавление на баннер текста
        toolbar.$self.on('click', '.banner-text-button', function() {

          addTextObject();

          preview.update(banner, sm.all());
          jsonInInput();

          return false;
        });

        $this.hide();
        $this.after(obj);
        
        if ($this.val()) {
          res.fill(JSON.parse($this.val()));
        }

        return res;
      }
    ;

    options = $.extend({
      minWidth: 200,
      minHeight: 150,
      maxWidth: 1000,
      maxHeight: 750,
      width: 700,
      height: 400,
    }, options);

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

    // ---------------------------------

    function ToolbarObject() {
      this.$self = $('<div class=\'banner-toolbar\'></div>');
      this.$$textButton = $('<a class=\'banner-text-button btn\'></a>');
      this.$$textButton.text('Add text >');

      this.$self.append(this.$$textButton);
    }

    // ---------------------------------

    function BannerObject() {
      var that = this;

      this.$self = $('<div class=\'banner-workspace\'></div>');

      this.$$workspace = $('<div></div>');
      this.$$background = $('<img/>');

      this.$$background.on('dragstart', function (event) { event.preventDefault(); } );

      this.$self.append(this.$$workspace);
      this.$$workspace.append(this.$$background);

      this.setBackground = function(image) {
        this.$$background.prop('src', image);

        this.$$background.off('load').on('load', function() {
          var $this = $(this);

          that.setSize($this.width(), $this.height());

          $this.css({
            'position': 'absolute',
            'width': '100%',
            'height': '100%',
          });
        });
      };

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

        // params.start = function() {
        //   var $this = $(this);

        //   if (that.rightBorder) {
        //     $this.resizable('option', 'minWidth', that.rightBorder);
        //   }

        //   if (that.bottomBorder) {
        //     $this.resizable('option', 'minHeight', that.bottomBorder);
        //   }
        // };

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
    }, options.properties || {});

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

        var $removeButton = $('<a class=\'banner-remove-text btn\'></a>');

        $removeButton.text('Remove');

        $removeButton.on('click', function() {
          that.onRemove();
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

    function PreviewObject() {
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
      this.$$background.on('dragstart', function (event) { event.preventDefault(); } );

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

      this.$self.append(this.$$preview);
      this.$self.append(this.$$code);
    }

    return $.proxy(build, this[0])();
  };

})(jQuery);