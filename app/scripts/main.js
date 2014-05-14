$(function() {
  //$.event.props.push('touches', 'targetTouches', 'changedTouches');

  function BannerObject($banner) {
    var that = this;
    this.minWidth = 200;
    this.minHeight = 150;
    this.maxWidth = 1000;
    this.maxHeight = 500;
    this.currentWidth = 700;
    this.currentHeight = 400;

    this.$self = $banner;
    this.$background = $('<img class=\'background\'/>');

    this.$self.append(this.$background);

    this.setSize = function(width, height) {
      // if (width > this.maxWidth) {
      //   width = this.maxWidth;
      // }

      if (width < this.minWidth) {
        width = this.minWidth;
      }

      // if (height > this.maxHeight) {
      //   height = this.maxHeight;
      // }

      if (height < this.minHeight) {
        height = this.minHeight;
      }

      this.$self.width(width);
      this.$self.height(height);
    };

    this.setSize(this.currentWidth, this.currentHeight);

    this.initResize = function() {
      this.$self.resizable({
        animate: true,
        //maxHeight: this.maxHeight,
        //maxWidth: this.maxWidth,
        minHeight: this.minHeight,
        minWidth: this.minWidth,
        stop: function(event, ui) {
          that.currentWidth = ui.size.width;
          that.currentHeight = ui.size.height;
        },
      });
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

    this.setBackground = function(image) {
      this.$background.prop('src', image);

      this.$background.off('load').on('load', function() {
        var $this = $(this);
        console.log($this.width());

        that.setSize($this.width(), $this.height());

        $this.css({
          'width': '100%',
          'height': '100%',
        });
      });
    };

    this.getBackground = function() {

    };

    this.put = function(component) {
      this.$self.append(component.$self);
    };
  };

  // ====================================================================================

  function TextObject() {
  	var that = this;
    this.$self = $('<div class=\'text-object\'></div>');
    this.$text = $('<span></span>');

    this.$self.data('object', this);

    this.properties = {
    	'text': 'Text',
    	'background-color': '#ffffff',
    	'color': '#000000',
    	'size': 14,
    	'font': 'Tahoma, Arial',
    	'padding': '3px',
    	'text-shadow': '0 0 0 black',
    	'box-shadow': '0 0 0 black',
    };

    this.applyProperties = function() {
	    this.$text.text(this.properties.text);
	    this.$self.css('background-color', this.properties['background-color']);
	    this.$text.css({
	    	'color': this.properties.color,
		  	'font-size': this.properties.size + 'px',
		  	'font': this.properties.font,
		  	'padding': this.properties.padding,
		  	'text-shadow': this.properties['text-shadow'],
		  	'box-shadow': this.properties['box-shadow'],
	    });
    };

    this.applyProperties();

    var activate = function() {
    	var $this = $(this);

    	deactivateAll();

    	properties.show();

    	fillProperties($this.data('object'));

	   	$this.addClass('activated');
    };

    this.$self.on('mousedown', activate);
    this.$self.on('touchstart', activate);

    this.$self.append(this.$text);
    this.$self.draggable({
    	containment: "parent",
    });
  };

  // ====================================================================================

  var banner = new BannerObject($('#banner'));

  banner.initResize();

  var
  	properties = $('.settings'),
  	deactivateAll = function() {
  		$('.activated').removeClass('activated');
			properties.hide();
  	},
  	fillProperties = function(textObject) {
  		$.each(textObject.properties, function(prop, val) {
  			$('[data-prop=' + prop + ']', properties).val(val);
  		});
  	}
	;

	properties.on('keyup change', '[data-prop]', function() {
		var $this = $(this),
			textObject = $('.activated:first').data('object');

			if (!textObject) {
				return;
			}

			textObject.properties[$this.data('prop')] = $this.val();
			textObject.applyProperties();
	});

  $('.add-text-block').on('click', function() {
    var text = new TextObject();

    banner.put(text);

    return false;
  });

  $('#link-on-image').on('keyup', function() {
    banner.setBackground($(this).val());
  });

  var readURL = function(input, onloadFunc) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();

      if ($.isFunction(onloadFunc)) {
          reader.onload = onloadFunc;
      }

      reader.readAsDataURL(input.files[0]);
    }
  };

  $('#upload-image').on('change', function() {
    readURL(this, function(e) {
      banner.setBackground(e.target.result);
    });
  });
});