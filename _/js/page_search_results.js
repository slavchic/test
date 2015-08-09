$(function(){
  $('aside.filters > div > div > a').click(function (e) {

	var parent = $(this).parent(),
		has_expanded_class = parent.hasClass('expanded')

	e.preventDefault()

	if (has_expanded_class) {
	  parent.removeClass('expanded')
	  $(this).next().slideUp()

	} else {
	  parent.addClass('expanded')
	  $(this).next().slideDown()
	}
  })
  $(window).on('scroll', function(){
	var w = $(this), d = $(document);
	if (d.height() - d.scrollTop() <= w.height()) {

	  var request = $.ajax({
		url:"/_/includes/ajaxload/more_search_results.shtml",
		contentType:'text/plain'
	  })
		.done(function (data) {
		  var loaded_code = $(data);
		  $('.search_results .active .result_list').append(loaded_code)
		})
		.fail(function () {
		  dbg("error");
		  $('.search_results .active .load_more_btn').hide()
		})
		.always(function () {
		  dbg("complete");
		});
	}
  })
})
