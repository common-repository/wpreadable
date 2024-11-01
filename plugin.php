<?php

/*
  Plugin Name: WPReadable
  Plugin URI: http://anattadesign.com
  Description: Plugin which builds up a sleek interface for iOS & Android based mobile devices
  Author: Anatta Design
  Version: 1.2
  Author URI: http://anattadesign.com

  Copyright 2012 Anatta Design  (email : team@anattadesign.com)

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License, version 2, as
  published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

/* Set constant for library path */
define( 'WPR_LIB_PATH', dirname( __FILE__ ) . '/lib/' );

/* Admin Options page */
if ( is_admin() )
	require( WPR_LIB_PATH . 'wp-admin-functions.php' );

/* AJAX handlers */
if ( defined( 'DOING_AJAX' ) && DOING_AJAX )
	require( WPR_LIB_PATH . 'ajax-handler.php' );

/**
 * 	Setup function
 */
add_action( 'init', 'wpr_upgrade_routine' );

function wpr_upgrade_routine() {
	$current_version = get_wpr_option( 'wpr_version' );
	// If we don't have it in options yet, we are dealing with prior to v1.2, and we had v1.1.1 before we released v1.2
	if ( $current_version === false )
		$current_version = '1.1.1';

	$did_upgrade = false;

	/** Upgrade functions following this line * */
	if ( $current_version < '1.2' ) {
		// Add version string in options stored in db
		$wpr_options = get_option( 'wpr_options' );
		$current_version = $wpr_options['wpr_version'] = '1.2';
		update_option( 'wpr_options', $wpr_options );
		$did_upgrade = true;
	}

	if ( $did_upgrade )
		wpr_ping();
}

function wpr_ping() {
	if ( !function_exists( 'get_plugin_data' ) )
		require_once( ABSPATH . 'wp-admin/includes/plugin.php' );

	$wpr_plugin_data = get_plugin_data( __FILE__ );

	$ping = array(
		'version' => $wpr_plugin_data['Version'], // current version
		'site_name' => get_bloginfo( 'name' ),
		'url' => trailingslashit( home_url() )
	);

	$post_args = array(
		'method' => 'POST',
		'timeout' => 5,
		'body' => array(
			'ping' => $ping
		)
	);

	$response_body = wp_remote_retrieve_body( wp_remote_post( 'http://api.anattadesign.com/wpreadable/1alpha/collect/ping', $post_args ) );
	$response = json_decode( $response_body, true );

	if ( isset( $response['status'] ) && $response['status'] == 'success' ) {
		// make sure ping is not rescheduled
		delete_option( 'wpreadable_ping_rescheduled' );
	} else {
		// make sure ping is rescheduled
		$reschedule_count = get_option( 'wpreadable_ping_rescheduled' );
		if ( false === $reschedule_count )
			update_option( 'wpreadable_ping_rescheduled', 1 );
		else
			update_option( 'wpreadable_ping_rescheduled', absint( $reschedule_count ) + 1 ); // keeping a track of reschedule counts so as to be able to see if its being rescheduled again & again without success
	}
}

/**
 * 	Login ping check
 */
add_action( 'wp_login', 'wpr_login_check' );

function wpr_login_check() {
	if ( get_option( 'wpreadable_ping_rescheduled' ) !== false )
		wpr_ping();
}

/**
 * 	Kill admin bar
 */
if ( is_touch_mobile() ) {
	add_filter( 'show_admin_bar', '__return_false' );
}

/**
 * 	Counter attack caching
 */
if ( is_touch_mobile() ) {
	// Tell WP Super Cache & W3 Total Cache to not cache WPReadable requests
	define( 'DONOTCACHEPAGE', true );
}

/**
 * 	Function to return wpr default options
 */
function get_wpr_defaults() {
	return array(
		'header_bg_color' => '#e2e2e4',
		'body_bg_color' => '#75591f',
		'logo' => false,
		'categories' => array( ),
		'show_homepage' => 1, // true
		'show_comments_count' => 1, // true
		'turn_off_comments' => 0, // false
		'custom_css' => ''
	);
}

/**
 * 	Function to return wpr options
 */
function get_wpr_option( $option ) {
	$wpr_options = get_option( 'wpr_options' );
	$wpr_defaults = get_wpr_defaults();
	$wpr_options = wp_parse_args( $wpr_options, $wpr_defaults );

	if ( isset( $wpr_options[$option] ) )
		return ( $option == 'custom_css' ) ? stripslashes( $wpr_options[$option] ) : $wpr_options[$option];
	else
		return false;
}

/**
 * 	Function to check if we are on a touch based mobile device
 */
function is_touch_mobile() {
	// Bypassing WPReadable for desktop full view on mobile
	if ( isset( $_COOKIE['ditch_wpr'] ) && $_COOKIE['ditch_wpr'] == 1 )
		return false;

	// To aid in development
	if ( defined( 'WPREADABLE_DEBUG' ) && WPREADABLE_DEBUG )
		return true;

	if ( stripos( $_SERVER['HTTP_USER_AGENT'], 'iPod' ) || stripos( $_SERVER['HTTP_USER_AGENT'], 'iPhone' ) || stripos( $_SERVER['HTTP_USER_AGENT'], 'Android' ) )
		return true;
	else
		return false;
}

/**
 * 	Override the current theme so that we can use our custom templates
 */
add_filter( 'template_include', 'wpr_override_template' );

function wpr_override_template( $template ) {

	if ( !is_touch_mobile() )
		return $template;

	if ( is_single() )
		return trailingslashit( dirname( __FILE__ ) ) . 'templates/single.php';
	else if ( is_search() )
		return trailingslashit( dirname( __FILE__ ) ) . 'templates/search.php';
	else
		return trailingslashit( dirname( __FILE__ ) ) . 'templates/home.php';
}

/**
 * 	WPReadable header and footer functions
 */
function get_wpr_header() {
	require trailingslashit( dirname( __FILE__ ) ) . 'templates/header.php';
}

function get_wpr_footer() {
	require trailingslashit( dirname( __FILE__ ) ) . 'templates/footer.php';
}

/**
 * 	Function to return how many posts were loaded on homepage visit
 */
function get_wpr_loaded_posts_count() {
	$wp_count_posts = wp_count_posts();
	$posts_count = $wp_count_posts->publish;

	$posts_per_page_setting = get_option( 'posts_per_page' );

	return $posts_count > $posts_per_page_setting ? $posts_per_page_setting : $posts_count;
}

/**
 * 	Function to exclude certain categories
 */
add_action( 'parse_query', 'wpr_cat_excluder' );

function wpr_cat_excluder( $query ) {

	if ( !is_touch_mobile() || is_admin() )
		return;

	// Categories that user want us to show
	$wpr_cats = get_wpr_option( 'categories' );

	// All WP categories
	$all_cats = get_categories( array( 'hide_empty' => false ) );

	// Collect Category IDs
	$wp_cats = array( );
	foreach ( $all_cats as $cat ) {
		$wp_cats[] = $cat->term_id;
	}

	// exclude posts only if user category selection is non-empty
	if ( !empty( $wpr_cats ) )
		set_query_var( 'category__not_in', array_diff( $wp_cats, $wpr_cats ) );
}

/**
 * 	Function to unregister default and some extra widgets so as to minimize database queries
 */
add_action( 'widgets_init', 'wpr_unregister_default_wp_widgets', 1 );

function wpr_unregister_default_wp_widgets() {

	if ( !is_touch_mobile() )
		return;

	unregister_widget( 'WP_Widget_Pages' );
	unregister_widget( 'WP_Widget_Calendar' );
	unregister_widget( 'WP_Widget_Archives' );
	unregister_widget( 'WP_Widget_Links' );
	unregister_widget( 'WP_Widget_Meta' );
	unregister_widget( 'WP_Widget_Search' );
	unregister_widget( 'WP_Widget_Text' );
	unregister_widget( 'WP_Widget_Categories' );
	unregister_widget( 'WP_Widget_Recent_Posts' );
	unregister_widget( 'WP_Widget_Recent_Comments' );
	unregister_widget( 'WP_Widget_RSS' );
	unregister_widget( 'WP_Widget_Tag_Cloud' );
	unregister_widget( 'WP_Nav_Menu_Widget' );
	unregister_widget( 'Twenty_Eleven_Ephemera_Widget' );
	unregister_widget( 'Akismet_Widget' );
}

/**
 * 	Function to add class to body in markup
 */
add_filter( 'body_class', 'wpr_browser_classes' );

function wpr_browser_classes( $classes ) {

	if ( is_home() && get_wpr_option( 'show_comments_count' ) == 0 )
		$classes[] = 'no-comments-home';

	if ( is_home() && get_wpr_option( 'show_homepage' ) )
		$classes[] = 'show-homepage';

	if ( get_wpr_option( 'turn_off_comments' ) )
		$classes[] = 'comments-off';

	if ( is_single() )
		$classes[] = 'gradient-header';

	return $classes;
}

/**
 * 	Function to redirect to homepage if any other URL is accessed
 *
 * 	New experience for posts coming soon ;-)
 */
add_action( 'template_redirect', 'wpr_redirector' );

function wpr_redirector() {
	if ( is_touch_mobile() && !( is_home() || is_front_page() || is_single() || !is_page() ) )
		wp_redirect( home_url(), 302 ); // 302 to not mess with any SEO power
}