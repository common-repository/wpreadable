(function($){
	$(document).ready(function($){
		$('#colorpicker_header_bg').farbtastic('#wpr_header_bg_color');
		$('#colorpicker_body_bg').farbtastic('#wpr_body_bg_color');

		/*
		$('#wpr_bg_color').click(function() {
			$('#colorpicker').fadeIn();
		});

		$(document).mousedown(function() {
			if ( $('#colorpicker').css('display') == 'block' )
					$('#colorpicker').fadeOut();
		});
		*/
	});
})(jQuery);