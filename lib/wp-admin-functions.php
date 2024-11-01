<?php
/**
 * 	Options page
 */
add_action( 'admin_menu', 'wpr_options_page' );

function wpr_options_page() {
	$page = add_submenu_page( 'themes.php', 'WP Readable Options', 'WP Readable Options', 'manage_options', basename( __FILE__ ), 'wpr_options_page_content' );
	add_action( 'admin_print_styles-' . $page, 'wpr_options_page_scripts' );
}

function wpr_options_page_scripts() {
	wp_enqueue_style( 'farbtastic' );
	wp_enqueue_script( 'farbtastic' );
	wp_enqueue_script( 'wpr-options', plugins_url( 'js/wpr-options.js', __FILE__ ), array( 'farbtastic', 'jquery' ) );
}

function wpr_options_page_content() {

	// Collect all existing WordPress categories into an array
	// (Required on both a normal page load, and on saving data, moreover its not going to change in the page load, so its safe & good to load it here)
	$wp_cats = get_categories( array( 'hide_empty' => false ) );
	$categories = array( );
	foreach ( $wp_cats as $category ) {
		$categories[$category->cat_ID] = $category->cat_name;
	}

	// check for $_POST, nonce and save data
	if ( !empty( $_POST ) && isset( $_POST['wpr_options_page'] ) && wp_verify_nonce( $_POST['wpr_options_page'], 'wpr_options_page_submit' ) ) {

		$valid = array( );

		// Background color
		$valid['header_bg_color'] = '#' . ctype_alnum( str_replace( '#', '', $_POST['wpr_options']['header_bg_color'] ) ) ? $_POST['wpr_options']['header_bg_color'] : $wpr_defaults['header_bg_color'];
		$valid['body_bg_color'] = '#' . ctype_alnum( str_replace( '#', '', $_POST['wpr_options']['body_bg_color'] ) ) ? $_POST['wpr_options']['body_bg_color'] : $wpr_defaults['body_bg_color'];

		// Logo
		$file_name = strtolower( str_replace( ' ', '-', trim( $_FILES['wpr_options']['name']['logo'] ) ) );
		$temp_file = $_FILES['wpr_options']['tmp_name']['logo'];
		$file_type = $_FILES['wpr_options']['type']['logo'];

		if ( !empty( $file_name ) ) { // For checking whether image exists or not
			if ( $file_type == 'image/gif' || $file_type == 'image/jpeg' || $file_type == 'image/pjpeg' || $file_type == 'image/png' ) {

				$fd = fopen( $temp_file, 'rb' );
				$file_content = file_get_contents( $temp_file );
				fclose( $fd );

				$wud = wp_upload_dir();

				if ( file_exists( $wud['path'] . '/' . strtolower( $file_name ) ) )
					unlink( $wud['path'] . '/' . strtolower( $file_name ) );

				$upload = wp_upload_bits( $file_name, '', $file_content );

				$wpr_image = $wud['url'] . '/' . strtolower( $file_name );
			}
		}

		$valid['logo'] = isset( $wpr_image ) ? $wpr_image : false;

		// Apple bookmark icon
		$file_name = strtolower( str_replace( ' ', '-', trim( $_FILES['wpr_options']['name']['apple_icon'] ) ) );
		$temp_file = $_FILES['wpr_options']['tmp_name']['apple_icon'];
		$file_type = $_FILES['wpr_options']['type']['apple_icon'];

		if ( !empty( $file_name ) ) { // For checking whether image exists or not
			if ( $file_type == 'image/gif' || $file_type == 'image/jpeg' || $file_type == 'image/pjpeg' || $file_type == 'image/png' ) {

				$fd = fopen( $temp_file, 'rb' );
				$file_content = file_get_contents( $temp_file );
				fclose( $fd );

				$wud = wp_upload_dir();

				if ( file_exists( $wud['path'] . '/' . strtolower( $file_name ) ) )
					unlink( $wud['path'] . '/' . strtolower( $file_name ) );

				$upload = wp_upload_bits( $file_name, '', $file_content );

				$wpr_image = $wud['url'] . '/' . strtolower( $file_name );
			}
		}

		$valid['apple_icon'] = isset( $wpr_image ) ? $wpr_image : false;

		// Homepage options
		$valid['show_homepage'] = isset( $_POST['wpr_options']['show_homepage'] ) && $_POST['wpr_options']['show_homepage'] == 'on' ? 1 : 0;
		$valid['turn_off_comments'] = isset( $_POST['wpr_options']['turn_off_comments'] ) && $_POST['wpr_options']['turn_off_comments'] == 'on' ? 1 : 0;
		$valid['show_comments_count'] = isset( $_POST['wpr_options']['show_comments_count'] ) && $_POST['wpr_options']['show_comments_count'] == 'on' ? 1 : 0;

		// Categories
		$valid['categories'] = array_map( 'absint', array_keys( $_POST['wpr_options']['categories'] ) ); // collect all keys and make sure they are integer
		// Custom CSS (Need to sanitize)
		$valid['custom_css'] = $_POST['wpr_options']['custom_css'];

		if ( $valid['logo'] === false ) {
			$wpr_options = get_option( 'wpr_options' );
			$valid['logo'] = $wpr_options['logo'];
		}

		// Save to database now
		update_option( 'wpr_options', $valid );

		// For settings saved message
		add_action( 'admin_notices', 'wpr_settings_update_admin_notice' );
	}

	$wpr_options = get_option( 'wpr_options' );
	$wpr_defaults = get_wpr_defaults();
	$wpr_options = wp_parse_args( $wpr_options, $wpr_defaults );
	?>
	<div class="wrap">
		<?php screen_icon( 'options-general' ); ?>
		<h2>WP Readable Options</h2>
		<?php do_action( 'admin_notices' ); ?>

		<form action="" method="POST" enctype="multipart/form-data">
			<?php wp_nonce_field( 'wpr_options_page_submit', 'wpr_options_page' ); ?>

			<table class="form-table">
				<tbody>
					<tr valign="top">
						<th scope="row">Header Background Color</th>
						<td>
							<input id="wpr_header_bg_color" name="wpr_options[header_bg_color]" type="text" value="<?php echo esc_attr( $wpr_options['header_bg_color'] ); ?>" />
							<div style="" id="colorpicker_header_bg"></div>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">Footer Background Color</th>
						<td>
							<input id="wpr_body_bg_color" name="wpr_options[body_bg_color]" type="text" value="<?php echo esc_attr( $wpr_options['body_bg_color'] ); ?>" />
							<div style="" id="colorpicker_body_bg"></div>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">Logo</th>
						<td>
							<input id="wpr_logo" name="wpr_options[logo]" type="file" />
							<?php if ( isset( $wpr_options['logo'] ) && $wpr_options['logo'] ) { ?>
								<p><img src="<?php echo esc_attr( $wpr_options['logo'] ); ?>" alt="selected-logo" /></p>
							<?php } ?>
							<p>For the best fit, use 150 X 35 size logo.</p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">Apple Bookmark Icon</th>
						<td>
							<input id="wpr_apple_logo" name="wpr_options[apple_icon]" type="file" />
							<?php if ( isset( $wpr_options['apple_icon'] ) && $wpr_options['apple_icon'] ) { ?>
								<p><img src="<?php echo esc_attr( $wpr_options['apple_icon'] ); ?>" alt="apple-icon" /></p>
							<?php } ?>
							<p>Square size icon looks best.</p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">Show Homepage?</th>
						<td>
							<input id="wpr_show_homepage" name="wpr_options[show_homepage]" type="checkbox" <?php checked( $wpr_options['show_homepage'], 1 ); ?> />
							<p>If unchecked, users are directly taken to the latest post page.</p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">Completely turn off Comments?</th>
						<td>
							<input id="wpr_show_comments_count" name="wpr_options[turn_off_comments]" type="checkbox" <?php checked( $wpr_options['turn_off_comments'], 1 ); ?> />
							<p>If checked, comments functionality will be disabled.</p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">Show Post's Comment count?</th>
						<td>
							<input id="wpr_show_comments_count" name="wpr_options[show_comments_count]" type="checkbox" <?php checked( $wpr_options['show_comments_count'], 1 ); ?> />
							<p>If checked, comments count along post titles are shown on homepage.</p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">Categories</th>
						<td>
							<?php
							foreach ( $categories as $cat_id => $cat ) {
								// if user category selection is empty, mark the checkbox as selected
								if ( empty( $wpr_options['categories'] ) )
									$check_state = 1;
								else {
									$check_state = 0; // assume checkbox state as false
									if ( in_array( $cat_id, $wpr_options['categories'] ) )
										$check_state = 1; // mark true when found
								}
								echo '<input name="wpr_options[categories][' . $cat_id . ']" type="checkbox" value="include"' . checked( $check_state, 1, false ) . ' /> <label for="wpr_options[categories][' . $cat_id . ']">' . $cat . '</label><br />';
							}
							?>
							<p>Unselected categories will be filtered out.</p>
						</td>
					</tr>
					<tr valign="top">
						<th scope="row">Custom CSS</th>
						<td>
							<p><textarea name="wpr_options[custom_css]" rows="10" cols="50" class="large-text code"><?php echo stripslashes( $wpr_options['custom_css'] ); ?></textarea></p>
							<p><strong>Guidelines to override CSS</strong></p>
							<p>For overriding styles for post sorting buttons<br /><code>#nav a{}</code></p>
							<p>For overriding styles for post headings on homepage<br /><code>#swipeaway{}</code></p>
							<p>For overriding styles for post header<br /><code>.post-header{}</code></p>
							<p>For overriding styles for post content<br /><code>.post-content{}</code></p>
						</td>
					</tr>
				</tbody>
			</table>
			<div class="color-picker" style="position: relative;">
				<div style="position: absolute;" id="colorpicker"></div>
			</div>
			<div class="clear">&nbsp;</div>
			<input name="submit" class="button-primary" type="submit" value="Save Changes" />
		</form>
	</div>
	<?php
}

/**
 * 	Function which echos settings saved message
 */
function wpr_settings_update_admin_notice() {
	echo '<div class="updated"><p><strong>Settings saved.</strong></p></div>';
}