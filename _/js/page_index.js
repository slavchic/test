(function ($) {

  $.fn.jumbotron = function (switch_timeout) {
	var collection = this;

	collection.each(function () {

	  var jbt = $(this),
		  items = jbt.find('.wrapper > div'),
		  items_count = items.length,
		  switchers_cont = $('<span/>'),
		  switchers = $(new Array(items_count + 1).join('<a href="#"/>')),

		  current_index = 0,
		  switch_timeout = switch_timeout || 5000,
		  interval,
		  hovered = false;

	  // define switchers
	  switchers_cont.append(switchers)
	  switchers.first().addClass('active')
	  jbt.find('.wrapper').before(switchers_cont)

	  var move = function (e) {
		if (e) e.preventDefault()
		if (hovered && !arguments.length) return;
		current_index = arguments.length ? $(this).data('index') : ++current_index;
		current_index = (current_index == items_count) ? 0 : current_index

		switchers.removeClass('active')
		$(switchers[current_index]).addClass('active')
		$(items[0]).css('margin-left', -(current_index * 100) + '%')

	  }

	  switchers.each(function (i) {
		$(this).data('index', i).click(move);
	  })

	  // end of define switchers

	  jbt.mouseover(function () {
		clearInterval(interval)
	  }).mouseout(function () {
		interval = setInterval(move, switch_timeout)
	  }).trigger('mouseout')



	})
  }
})(jQuery)

$(function () {
  $('.jumbotron').jumbotron(5000)
})