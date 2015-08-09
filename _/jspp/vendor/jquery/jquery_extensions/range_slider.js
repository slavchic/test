(function ($) {
  $.fn.slider = function (options) {

	function slider(instance, options) {
	  var o = this;

	  o.el = instance;
	  o.dom = {}
	  o.p = $.extend({
		limits: {min:o.el.data('min'), max:o.el.data('max')},
		selected_limits: {low:o.el.data('left'), high:o.el.data('right')},
		result: o.el.data('result'),
		type: o.el.data('type')
	  }, options);

	  o.init = function () {

		o.build_html()

		o.cont_w = function () {
		  return $(o.dom.range_cont).innerWidth()
		}

		if (o.p.result == 'time') {
		  o.p.limits.min = o.get_milliseconds_from_time(o.p.limits.min)
		  o.p.limits.max = o.get_milliseconds_from_time(o.p.limits.max)
		  o.p.selected_limits.low = o.get_milliseconds_from_time(o.p.selected_limits.low)
		  if (o.p.type == 'range') o.p.selected_limits.high = o.get_milliseconds_from_time(o.p.selected_limits.high)
		}
		var zero_width_int // if container is hidden wait until it visible
		if (!o.cont_w()) {

		  zero_width_int = setInterval(function () {
			if (o.cont_w()) {
			  o.setup_interface()
			  clearInterval(zero_width_int)
			}
		  }, 150)
		} else {
		  o.setup_interface()
		}

	  }
	  o.update_options = function(options){
		$.extend(o.p, options);
	  }
	  o.build_html = function () {
		var d = document;

		o.dom.range_cont = d.createElement('div');
		o.dom.line_bk = d.createElement('div');
		o.dom.line = d.createElement('div');

		o.dom.lp = d.createElement('a');
		o.dom.lp.href = '#'

		o.dom.result_cont = d.createElement('div');
		o.dom.low_value_preview = d.createElement('b');


		o.dom.result_cont.appendChild(o.dom.low_value_preview)


		o.dom.line_bk.appendChild(o.dom.line)
		o.dom.range_cont.appendChild(o.dom.line_bk)
		o.dom.range_cont.appendChild(o.dom.lp)


		o.el[0].appendChild(o.dom.range_cont)
		o.el[0].appendChild(o.dom.result_cont)


		if (o.p.type == 'range') {
		  o.dom.rp = d.createElement('a');
		  o.dom.rp.href = '#'
		  o.dom.range_cont.appendChild(o.dom.rp)
		  o.dom.high_value_preview = d.createElement('b');
		  o.dom.result_cont.appendChild(o.dom.high_value_preview)
		}

		$(o.dom.lp).drags({
		  axis: 'x',
		  callback: o.on_pointer_drag,
		  on_mouseup: o.apply_range
		}).click(function (e) {
		  e.preventDefault()
		})
		$(o.dom.rp).drags({
		  axis: 'x',
		  callback: o.on_pointer_drag,
		  on_mouseup: o.apply_range
		}).click(function (e) {
		  e.preventDefault()
		})

		o.dom.range_cont.className = 'range'
		o.dom.result_cont.className = 'result'


	  }
	  o.setup_interface = function () {
		$(o.dom.lp).css('left', o.cont_w() * (o.p.selected_limits.low - o.p.limits.min) / (o.p.limits.max - o.p.limits.min) + 'px')
		if (o.p.type == 'range') $(o.dom.rp).css('left', o.cont_w() * (o.p.selected_limits.high - o.p.limits.min) / (o.p.limits.max - o.p.limits.min) + 'px')
		o.set_limits_line()
		o.update_preview_values()
	  }
	  o.get_milliseconds_from_time = function (time_str) {
		var a = time_str.split(':')
		return a[0] * 1000 * 3600 + a[1] * 1000 * 60
	  }
	  o.get_time_from_milliseconds = function (ms) {
		var mins = ms / 1000 / 60,
			hours = mins / 60;

		mins = parseInt(mins % 60)
		hours = parseInt(hours % 24)

		if (mins < 10) mins = '0' + mins;

		return hours + ':' + mins;
	  }
	  o.set_limits_line = function () {
		$(o.dom.line).css('marginLeft', parseFloat($(o.dom.lp).css('left')))
		if (o.p.type == 'range') $(o.dom.line).css('width', (parseFloat($(o.dom.rp).css('left')) - parseFloat($(o.dom.lp).css('left'))))
	  }
	  o.set_pointer_move_limits = function () {
		if (o.dom.rp.limits) o.dom.rp.limits.l_limit = parseFloat($(o.dom.lp).css('left'))
		if (o.dom.lp.limits) o.dom.lp.limits.r_limit = parseFloat($(o.dom.rp).css('left'))
	  }
	  o.update_selected_limits = function () {
		o.p.selected_limits.low = parseFloat($(o.dom.lp).css('left')) * (o.p.limits.max - o.p.limits.min) / o.cont_w() + o.p.limits.min
		if (o.p.type == 'range') {
		  o.p.selected_limits.high = parseFloat($(o.dom.rp).css('left')) * (o.p.limits.max - o.p.limits.min) / o.cont_w() + o.p.limits.min
		  //return {low: o.p.selected_limits.low, high: o.p.selected_limits.high}
		} else {
		  o.p.selected_limits.low = parseFloat($(o.dom.lp).css('left')) * (o.p.limits.max - o.p.limits.min) / o.cont_w() + o.p.limits.min
		  //return {low: o.p.selected_limits.low}
		}
	  }
	  o.get_selected_limits = function () {
		return o.p.selected_limits
	  }
	  o.get_rounded_limits = function(){
		return {low:Math.floor(o.p.selected_limits.low), high:Math.floor(o.p.selected_limits.low)}
	  }
	  o.on_pointer_drag = function () {
		o.update_selected_limits()
		if (o.p.type == 'range') o.set_pointer_move_limits()

		o.set_limits_line()
		o.update_preview_values()
		if (o.p.on_update) {
		  o.p.on_update()
		}
	  }
	  
	  o.preview_value_convert = function (val) {
		if (o.p.result == 'number') {
		  return Math.floor(val)
		} else if (o.p.result == 'time') {
		  return parseInt(val)
		}
	  }
	  o.low_value_formater = (o.p.low_value_formater) ? o.p.low_value_formater : function (val) {
		return val
	  }
	  o.high_value_formater = (o.p.high_value_formater) ? o.p.high_value_formater : function (val) {
		return val
	  }
	  o.update_preview_values = function () {
		if (o.p.result == 'number') {

		  $(o.dom.low_value_preview).text(
			o.low_value_formater(o.preview_value_convert(o.p.selected_limits.low))
		  )
		  if (o.p.type == 'range') {
			$(o.dom.high_value_preview).text(
			  o.high_value_formater(o.preview_value_convert(o.p.selected_limits.high))
			)
		  }
		} else if (o.p.result == 'time') {

		  var low = o.get_time_from_milliseconds(o.p.selected_limits.low);

		  if (low == '0:00' && o.p.selected_limits.low > o.p.limits.min) low = '24:00'

		  if (o.p.type == 'range') {
			var high = o.get_time_from_milliseconds(o.p.selected_limits.high)
			if (high == '0:00' && o.p.selected_limits.high == o.p.limits.max) high = '24:00'
			$(o.dom.high_value_preview).text(high)
		  }
		  $(o.dom.low_value_preview).text(low)

		}
	  }

	  o.init()
	  return o
	}

	if (typeof options == 'string') {
		return this.data('slider')[options]()
	} else {
	  return this.each(function () {
		var el = $(this), instance = el.data('slider')
		if (!instance) {
		  el.data('slider', new slider(el, options))
		} else {
		  instance.update_options(options)
		}
	  })
	}
  }

})(jQuery)
