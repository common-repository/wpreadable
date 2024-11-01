		<script type="text/javascript">
			/* <![CDATA[ */
			var wpreadable = <?php
			echo json_encode( array(
				'ajaxurl' => admin_url( 'admin-ajax.php' ),
				'orderBy' => 'freshness',
				'loaded_posts_count' => get_wpr_loaded_posts_count(),
				'pivotID' => 0,
				'swipeImageURL' => plugins_url( 'images/swipe-hit.png', __FILE__ )
			) ) . ";\n"; ?>
			/* ]]> */
		</script>
		<script type="text/javascript" src="http://zeptojs.com/zepto.min.js"></script>
		<script type="text/javascript" src="<?php echo plugins_url( 'js/hammer.js', __FILE__ ); ?>"></script>
		<script type="text/javascript" src="<?php echo plugins_url( 'js/main.js', __FILE__ ); ?>"></script>
		<script type="text/javascript">
			var addToHomeConfig = {
				animationIn: 'bubble',
				animationOut: 'drop',
				lifespan: 10000,
				expire: 2,
				<?php if ( get_wpr_option( 'apple_icon' ) !== false && trim( get_wpr_option( 'apple_icon' ) ) != '' ) echo "touchIcon: true,"; ?>
				message: 'Bookmark us on your %device for quick access later on.'
			};
		</script>
		<script type="application/javascript" src="<?php echo plugins_url( 'js/add2home.js', __FILE__ ); ?>" charset="utf-8"></script>
	</body>
</html>