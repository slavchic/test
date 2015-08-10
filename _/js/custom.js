dbg = function () {
  console.log(arguments);
  //some change 1000
}
$(function () {

  $.fn.switchToggleClass = function (class_1, class_2) {
	var o = this
	if (o.hasClass(class_1)) {
	  o.removeClass(class_1)
	  o.addClass(class_2)
	} else {
	  o.removeClass(class_2)
	  o.addClass(class_1)
	}
	return o
  }
  function hide_drop_menus() {
	$('.day_selector > .selector').removeClass('active')
	$('.dropdown_menu .toggle').removeClass('active')
  }

  $(document).on('click touch', hide_drop_menus)
  $('.dropdown_menu .toggle + *').on('click', function (e) {
	e.stopPropagation()
  })

  $('.tabs > a').click(function (e) {
	e.preventDefault()
	var el_num = 0, current_btn = this
	$(this).parent().find('> a').each(function (i) {
	  if (this == current_btn) el_num = i
	  $(this).removeClass('active')
	})
	$(this).parent().find('> div > div').each(function () {
	  $(this).removeClass('active')
	})
	$(this).parent().find('> div > div:eq(' + el_num + ')').addClass('active')

	$(this).addClass('active')

  })
  $('.dropdown_menu .toggle').on('click touch', function (e) {
	var el = $(this);

	e.preventDefault();
	e.stopPropagation()

	hide_drop_menus()

	el.toggleClass('active');

	if (el.data('value')) {
	  var drop_menu = el.next()
	  drop_menu.find('a[data-value]').removeClass('active')
	  drop_menu.find('a[data-value="' + el.data('value') + '"]').addClass('active')
	}
  })
  $('.dropdown_menu .toggle + * a').on('click touch', function (e) {
	e.preventDefault();
	var el = $(this)
	if (el.data('value') && el.data('input_id')) {
	  $('#' + el.data('input_id')).val(el.data('value'))
	}
	if (el.data('value_name')) {
	  el.closest('.dropdown_menu').find('.toggle')
		.data('value', el.data('value'))
		.removeClass('active')
		.text(el.data('value_name'))
	}
  })

  ///////////Search block ////////////

  // search persons sliders
  var person_slider_1 = $('.search .persons_selector .range_slider.adults'),
	  person_slider_2 = $('.search .persons_selector .range_slider.children');

  var update_persons_selector = function () {

	var btn_text_cont = $('.search .persons_selector .select_toggle > span'),
		adults_val = person_slider_1.slider('get_rounded_limits').low || 1,
		children_val = person_slider_2.slider('get_rounded_limits').low || 0,
		adult_html = (adults_val) ? '<i class="icon-male"></i>' + adults_val : '',
		children_html = (children_val) ? ', <i class="icon-child"></i>' + children_val : '',
		result_html = (adult_html || adult_html) ? 'Persons: ' + adult_html + children_html : 'Persons';

	btn_text_cont.html(result_html);
	$('#hotels_persons_inp').val(adults_val + ',' + children_val)
  };


  person_slider_1.slider({
	on_update: update_persons_selector,
	low_value_formater: function (val) {
	  return (val != 1) ? val + ' Adults' : val + ' Adult'
	}
  })
  person_slider_2.slider({
	on_update: update_persons_selector,
	low_value_formater: function (val) {
	  return (val != 1) ? val + ' Children' : val + ' Child'
	}
  })

  $('#hotels_more_options_toggle').on('click touch', function (e) {
	e.preventDefault();
	$(this).find('i').switchToggleClass('icon-plus', 'icon-minus')
	$('#hotels_more_options_cont').slideToggle()
  })

  $('.filters .range_slider').slider({})

  // day selector
  $(function () {
	var next = $('.day_selector > .next'),
		prev = $('.day_selector > .prev'),
		selector = $('.day_selector > .selector'),
		menu = $('.day_selector > ul');

	menu.on('click touch', function (e) {
	  e.stopPropagation()
	})


	selector.on('click touch', function (e) {
	  var t = $(this);
	  e.preventDefault()
	  e.stopPropagation()

	  t.toggleClass('active')
	  t.siblings('ul').css('left', t.position().left - 10)
	})

	var sa_tmt, selector_animate = function () {
	  clearTimeout(sa_tmt);
	  selector.addClass('animate')
	  sa_tmt = setTimeout(function () {
		selector.removeClass('animate')
	  }, 500)
	}
	menu.find('a').on('click touch', function (e) {

	  var t = $(this)

	  e.stopPropagation()
	  e.preventDefault()
	  menu.children().removeClass('current')
	  t.parent().addClass('current')
	  selector.find('span').text(t.text())
	  hide_drop_menus()
	  selector_animate()
	})
	prev.on('click touch', function (e) {
	  e.preventDefault()
	  e.stopPropagation()
	  menu.find('li.current').prev().find('a').trigger('click')
	  selector_animate()
	})
	next.on('click touch', function (e) {
	  e.preventDefault()
	  e.stopPropagation()
	  menu.find('li.current').next().find('a').trigger('click')
	  selector_animate()
	})
  })

  $('#flights_calendar_depart_inp, ' +
  '#flights_calendar_return_inp, ' +
  '#hotels_calendar_depart_inp, ' +
  '#hotels_calendar_return_inp').datetimepicker({
	lang: 'en',
	closeOnDateSelect: true,
	timepicker: false,
	format: 'd-m-Y',
	formatDate: 'Y/m/d',
	minDate: '-1970/01/02', // yesterday is minimum date
	onSelectDate: function (current_time, $input) {
	  if ($input.prop('id') == 'flights_calendar_depart_inp') {
		$('#flights_calendar_return_inp').focus()
	  }
	  if ($input.prop('id') == 'hotels_calendar_depart_inp') {
		$('#hotels_calendar_return_inp').focus()
	  }
	  if ($input.prop('id') == 'hotels_calendar_return_inp') {
		$('#hotels_persons_menu_toggle').trigger('click')
	  }
	}
  }).siblings('i').on('click touch', function () {
	$(this).siblings('input:text').datetimepicker('show');
  }).siblings('a.clear').on('click touch', function (e) {
	e.preventDefault()
	$(this).siblings('input:text').val('');
  });


  // search autocomplete
  var states = [
	{"value": "United Arab Emirates", "data": "AE"},
	{"value": "United Kingdom", "data": "UK"},
	{"value": "United States", "data": "US"}
  ];
  $('#flights_directions_from_inp, #flights_directions_to_inp').autocomplete({
	//serviceUrl:locations_search.php,
	lookup: states,
	minChars: 0,
	triggerSelectOnValidInput: false,
	onSelect: function (suggestion) {
	  if (this.id == 'flights_directions_from_inp') {
		$('#flights_directions_to_inp').focus()
	  }
	  if (this.id == 'flights_directions_to_inp') {
		$('#flights_calendar_depart_inp').focus()
	  }
	}
  });
  $('#flights_switch_directions').on('click touch', function (e) {
	var from_inp = $('#flights_directions_from_inp'),
		from_val = from_inp.val(),
		to_inp = $('#flights_directions_to_inp');

	to_val = to_inp.val();
	e.preventDefault()
	clearTimeout(this.tmt);

	from_inp.val(to_val).addClass('blink');
	to_inp.val(from_val).addClass('blink');

	this.tmt = setTimeout(function () {
	  from_inp.removeClass('blink');
	  to_inp.removeClass('blink');
	}, 700)
  })
  $('#hotels_destination_inp').autocomplete({
	//serviceUrl:locations_search.php,
	lookup: states,
	minChars: 0,
	triggerSelectOnValidInput: false,
	onSelect: function (suggestion) {
	  $('#hotels_calendar_depart_inp').focus()
	}
  });

///////////end of Search block ////////////
})



















