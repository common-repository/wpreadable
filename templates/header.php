<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />
		<title><?php bloginfo( 'name' ); ?></title>
		<!-- meta tags -->
		<meta content="yes" name="apple-mobile-web-app-capable" />
		<meta content="text/html; charset=iso-8859-1" http-equiv="Content-Type" />
		<meta name="viewport"  content="width=device-width, user-scalable=no;" />

		<!-- This makes the site run in fullscreen mode hiding the safari's top/bottom bar -->
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

		<link href="<?php echo plugins_url( 'css/style.css', __FILE__ ); ?>" type="text/css" rel="stylesheet" />
		<link rel="apple-touch-icon" href="<?php echo get_wpr_option( 'apple_icon' ); ?>" />

		<style type="text/css">
			body { background-color: <?php echo get_wpr_option( 'body_bg_color' ); ?> }
			#header { background-color: <?php echo get_wpr_option( 'header_bg_color' ); ?> }
			<?php echo get_wpr_option( 'custom_css'); ?>
			<?php if ( get_wpr_option( 'turn_off_comments' ) ) { ?>
				.footer .comments { display:none; }
			<?php } ?>
		</style>
	</head>
	<body <?php body_class(); ?>>
		<header id="header">
			<div class="left">
				<?php $wpr_logo = get_wpr_option( 'logo' ); ?>
				<?php if ( $wpr_logo ) { ?>
					<span id="logo"><img src="<?php echo $wpr_logo; ?>" alt="logo" /></span>
				<?php } else { ?>
					<?php bloginfo( 'name' ); ?>
				<?php } ?>
			</div>
			<div class="right">
				<a  class="home-icon<?php echo !is_single() ? ' disabled' : ''; ?>" href="<?php bloginfo( 'url' ); ?>"><img src="<?php echo plugins_url( 'images/home-icon.png', __FILE__ ); ?>" alt="home" /></a>
			</div>
		</header>
