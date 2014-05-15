(function($){

  jQuery.fn.generateBanner = function(options) {
    var
      that = this,
      build = function() {
        var obj = $('<div>'),
            banner = new BannerObject(),
            toolbar = new ToolbarObject(),
            properties = new PropertiesObject(),
            preview = new PreviewObject(),
            sm = new StateMachine()
        ;

        banner.initResize();

        properties.onChange = function() {
          sm.current().applyProperties();
          preview.update(banner, sm.all());
        };

        obj.append(toolbar.$self);
        obj.append(banner.$self);
        obj.append(properties.$self);
        obj.append(preview.$self);

        // добавление на баннер текста
        toolbar.$self.on('click', '.banner-text-button', function() {
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
          preview.update(banner, sm.all());

          return false;
        });

        $(this).replaceWith(obj);

        return {
          setBackground: function(src) {
            banner.setBackground(src);
          },
        };
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

    function StateMachine() {};
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

    StateMachine.prototype.all = function() {
      return this._callbacks || [];
    };

    // ---------------------------------

    function ToolbarObject() {
      this.$self = $('<div class=\'banner-toolbar\'></div>');
      this.$$textButton = $('<a class=\'banner-text-button\'></a>');
      this.$$textButton.text('Add text >');

      this.$self.append(this.$$textButton);
    };

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
        params = {};

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
        };

        this.$self.resizable(params);
      };

      this.$self.droppable({
        drop : function(e, ui) {
          // var left = ui.offset.left,
          //     top = ui.offset.top,
          //     cur = ui.helper,
          //     cur_id = cur.attr('id'),
          //     wh = results.getWh(cur_id);

          // results.addAttr(wh, cur_id, 'left', left - results.get_droppable().offset().left - results.constants.get('BORDER_SIZE'));
          // results.addAttr(wh, cur_id, 'top', top - results.get_droppable().offset().top - results.constants.get('BORDER_SIZE'));
        }
      });

      this.put = function(component) {
        this.$$workspace.append(component.$self);
      };
    };

    // ---------------------------------

    function CommonObject() {};

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

    // ---------------------------------

    function TextObject() {
      var that = this;
      this.$self = $('<div class=\'banner-text-object\'></div>');
      this.$$text = $('<span></span>');

      this.properties = $.extend(true, {}, this.properties);
      this.applyProperties();
      this.$self.append(this.$$text);
      this.$self.draggable({
        containment: 'parent',
      });
    };

    TextObject.prototype = Object.create(CommonObject.prototype);
    TextObject.prototype.constructor = TextObject;

    // default values for properties
    TextObject.prototype.properties = $.extend({
      'text': {
        'label': 'Text',
        'type': 'textarea',
        'value': 'Text',
        'method': function(prop, val) {
          this.$$text.text(val.value);
        },
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

    TextObject.prototype.preview = function() {
      // var
      //   $div = $('<div></div>'),
      //   $span = $('<span></span>')
      // ;

      //$div.append($span);

      // $div.css({
      //   'position': 'absolute',
      //   'left': this.$self.css('left'),
      //   'top': this.$self.css('top'),
      // });

      return this.$self.clone();
    };

    // ---------------------------------

    function PropertiesObject() {
      var that = this;

      this.$self = $('<div class=\'banner-properties\'></div>');

      this.fill = function(properties) {
        var
          $properties = $('<form role=\'form\'></form>'),
          $group, $field
        ;

        $.each(properties, function(prop, val) {
          $group = $('<div class=\'form-group\'></div>');
          $group.append('<label>' + (val.label || prop) + '</label>');

          if (val.type === 'textarea') {
            $field = $('<textarea rows=\'3\'>');
          } else {
            $field = $('<input type=\'' + (val.type || 'text') + '\'/>');
          }

          $field.addClass('form-control');
          $field.data('prop', val);
          $field.val(val.value);

          $group.append($field);

          $properties.append($group);
        });

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
    };

    // ---------------------------------

    function PreviewObject() {
      var that = this;
      this.$self = $('<div class=\'banner-preview\'></div>');
      this.$$preview = $('<div></div>');
      this.$$background = $('<img/>');
      this.$$code = $('<div></div>');

      this.$$background.css('position', 'absolute');

      this.$$preview.css('position', 'relative');
      this.$$background.on('dragstart', function (event) { event.preventDefault(); } );

      this.update = function(banner, textObjects) {
        this.$$preview.empty();

        this.$$preview.append(this.$$background);
        this.$$preview.width(banner.width);
        this.$$preview.height(banner.height);
        this.$$background.prop('src', banner.getBackground());

        $.each(textObjects, function() {
          var $obj = this.preview();

          $obj.attr('class', '');

          that.$$preview.append($obj);
        });

        // preview code
      };

      this.$self.append(this.$$preview);
      this.$self.append(this.$$code);
    };

    return $.proxy(build, this[0])();
  };

})(jQuery);