<?php

/**
 * 	Function used to load comments
 */
add_action( 'wp_ajax_load_comments', 'wpr_load_comments' );
add_action( 'wp_ajax_nopriv_load_comments', 'wpr_load_comments' );

function wpr_load_comments() {

	$postID = absint( $_REQUEST['postID'] );

	$comments_data = get_comments(
			array(
				'post_id' => $postID
			)
	);

	$comments = array( );

	foreach ( $comments_data as $comment ) {
		if ( $comment->comment_approved ) {
			$comments[] = array(
				'author' => $comment->comment_author,
				'author_url' => $comment->comment_author_url,
				'email_md5' => md5( strtolower( trim( $comment->comment_author_email ) ) ),
				'date' => mysql2date( __( 'Y/m/d \a\t g:i A' ), $comment->comment_date ),
				'content' => $comment->comment_content
			);
		}
	}

	echo json_encode( $comments );
	die();
}

/**
 * 	Function used to post comments
 */
add_action( 'wp_ajax_post_comment', 'wpr_post_comment' );
add_action( 'wp_ajax_nopriv_post_comment', 'wpr_post_comment' );

function wpr_post_comment() {

	$data = array(
		'comment_post_ID' => $_POST['postID'],
		'comment_author' => $_POST['name'],
		'comment_author_email' => $_POST['email'],
		'comment_author_url' => '',
		'comment_content' => $_POST['content'],
		'comment_type' => ''
	);

	$commentID = wp_new_comment( $data );

	if ( is_int( $commentID ) )
		echo json_encode( array( 'status' => 'success', 'email_md5' => md5( strtolower( trim( $_POST['email'] ) ) ), 'comment_status' => wp_get_comment_status( $commentID ) ) );
	else
		echo json_encode( array( 'status' => 'failure' ) );
	die();
}

/**
 * 	Function used to load posts
 */
add_action( 'wp_ajax_load_posts', 'wpr_load_posts' );
add_action( 'wp_ajax_nopriv_load_posts', 'wpr_load_posts' );

function wpr_load_posts() {
	global $wpdb;

	// Get offset
	if ( isset( $_REQUEST['offset'] ) )
		$offset = absint( $_REQUEST['offset'] );
	else
		$offset = 0;

	// Get age i.e. direction of posts to load from the current one
	if ( isset( $_REQUEST['age'] ) && $_REQUEST['age'] == 'both' )
		$age = 'both';
	else if ( $_REQUEST['age'] == 'newer' )
		$age = 'newer';
	else
		$age = 'older';

	// Get orderby parameter
	if ( isset( $_REQUEST['orderby'] ) && in_array( trim( $_REQUEST['orderby'] ), array( 'freshness', 'popular', 'discussed' ) ) )
		$orderby = trim( $_REQUEST['orderby'] );
	else
		$orderby = 'freshness';

	// Construct arguments aray
	$args = array(
		'offset' => $offset,
		'posts_per_page' => get_option( 'posts_per_page' )
	);
	$offset_plus_five = $args['offset'] + 5;

	// Set other parameters
	if ( $orderby == 'freshness' ) {
		$args['orderby'] = 'post_date';
		if ( $age == 'newer' )
			$args['order'] = 'ASC';
		else if ( $age == 'older' )
			$args['order'] = 'DESC';
		else
			$args['order'] = 'BOTH'; // Not a SQL orderby parameter, consider it as a flag
	} else if ( $orderby == 'popular' ) {
		$args['orderby'] = 'meta_value';
		$args['meta_key'] = 'wpr_pv';
	} else if ( $orderby == 'discussed' ) {
		$args['orderby'] = 'comment_count';
	}

	$pivotID = absint( $_REQUEST['pivotID'] );

	// If its a call from a single post link
	if ( $pivotID != 0 ) {

		$pivot_time = get_post( $pivotID )->post_date;

		if ( $args['order'] == 'BOTH' ) {

			$older_posts = array( );
			$newer_posts = array( );

			// fetch older posts
			$query = "SELECT * FROM {$wpdb->prefix}posts WHERE post_type = 'post' AND post_status = 'publish' AND post_date < '$pivot_time' ORDER BY post_date DESC LIMIT {$args['offset']}, $offset_plus_five;";
			$posts = $wpdb->get_results( $query );

			foreach ( $posts as $post ) {

				$older_posts[] = array(
					'postID' => $post->ID,
					'author' => get_userdata( $post->post_author )->display_name,
					'title' => $post->post_title,
					'content' => apply_filters( 'the_content', $post->post_content ),
					'url' => urlencode( get_permalink( $post->ID ) ), // encoding it here to reduce computation power used on client side (mobile) to save battery :P And we actually don't need decoded urls anywhere, only encoded ones are used in links for social sharing
					'comments_count' => $post->comment_count
				);
			}

			// fetch newer posts
			$query = "SELECT * FROM {$wpdb->prefix}posts WHERE post_type = 'post' AND post_status = 'publish' AND post_date > '$pivot_time' ORDER BY post_date ASC LIMIT {$args['offset']}, $offset_plus_five;";
			$posts = $wpdb->get_results( $query );

			foreach ( $posts as $post ) {

				$newer_posts[] = array(
					'postID' => $post->ID,
					'author' => get_userdata( $post->post_author )->display_name,
					'title' => $post->post_title,
					'content' => apply_filters( 'the_content', $post->post_content ),
					'url' => urlencode( get_permalink( $post->ID ) ), // encoding it here to reduce computation power used on client side (mobile) to save battery :P And we actually don't need decoded urls anywhere, only encoded ones are used in links for social sharing
					'comments_count' => $post->comment_count
				);
			}

			$posts = array(
				'left' => $newer_posts,
				'right' => $older_posts
			);

			echo json_encode( array( 'status' => 'success', 'data' => $posts ) );
		} else {
			// one side load
			$posts = array( );

			if ( $args['order'] == 'ASC' )
				$query = "SELECT * FROM {$wpdb->prefix}posts WHERE post_type = 'post' AND post_status = 'publish' AND post_date > '$pivot_time' ORDER BY post_date ASC LIMIT {$args['offset']}, $offset_plus_five;";
			else
				$query = "SELECT * FROM {$wpdb->prefix}posts WHERE post_type = 'post' AND post_status = 'publish' AND post_date < '$pivot_time' ORDER BY post_date DESC LIMIT {$args['offset']}, $offset_plus_five;";

			$queried_posts = $wpdb->get_results( $query );

			foreach ( $queried_posts as $post ) {

				$posts[] = array(
					'postID' => $post->ID,
					'author' => get_userdata( $post->post_author )->display_name,
					'title' => $post->post_title,
					'content' => apply_filters( 'the_content', $post->post_content ),
					'url' => urlencode( get_permalink( $post->ID ) ), // encoding it here to reduce computation power used on client side (mobile) to save battery :P And we actually don't need decoded urls anywhere, only encoded ones are used in links for social sharing
					'comments_count' => $post->comment_count
				);
			}

			if ( count( $posts ) == 0 )
				echo json_encode( array( 'status' => 'no-posts-left' ) );
			else
				echo json_encode( array( 'status' => 'success', 'data' => $posts ) );
		}
	} else { // If its a normal call from homepage view
		$queried_posts = get_posts( $args );

		$posts = array( );

		foreach ( $queried_posts as $post ) {

			$posts[] = array(
				'postID' => $post->ID,
				'author' => get_userdata( $post->post_author )->display_name,
				'title' => $post->post_title,
				'content' => apply_filters( 'the_content', $post->post_content ),
				'url' => urlencode( get_permalink( $post->ID ) ), // encoding it here to reduce computation power used on client side (mobile) to save battery :P And we actually don't need decoded urls anywhere, only encoded ones are used in links for social sharing
				'comments_count' => $post->comment_count
			);
		}

		if ( count( $posts ) == 0 )
			echo json_encode( array( 'status' => 'no-posts-left' ) );
		else
			echo json_encode( array( 'status' => 'success', 'data' => $posts ) );
	}

	die();
}

/**
 * 	Function used to update pageview of a post
 */
add_action( 'wp_ajax_record_pv', 'wpr_record_pv' );
add_action( 'wp_ajax_nopriv_record_pv', 'wpr_record_pv' );

function wpr_record_pv() {

	$postID = absint( $_REQUEST['postID'] );

	$existing_pv = (int) get_post_meta( $postID, 'wpr_pv', true );

	update_post_meta( $postID, 'wpr_pv', $existing_pv + 1 );
	die();
}

/**
 * 	Function to set Fullview cookie
 */
add_action( 'wp_ajax_switch_full_view', 'wpr_switch_full_view' );
add_action( 'wp_ajax_nopriv_switch_full_view', 'wpr_switch_full_view' );

function wpr_switch_full_view() {
	setcookie( 'ditch_wpr', 1, time() + 3600, '/' );
	$url = get_permalink( absint( $_REQUEST['currentPostID'] ) );
	echo json_encode( array( 'status' => 'success', 'url' => $url ) );
	die();
}