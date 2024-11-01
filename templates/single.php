<?php get_wpr_header(); ?>

<?php if ( have_posts() ) { ?>

	<div class="gradient"></div>
	<div id="wrapper">
		<div id="wpswipe" class="posts-list">

			<?php while ( have_posts() ) { ?>
				<?php the_post(); ?>
				<div class="post_wrapper" data-postID="<?php the_ID(); ?>">
					<section class="content">
						<div class="post">
							<header class="post-header">
								<img class="hit-swipe" src="<?php echo plugins_url( 'images/swipe-hit.png', __FILE__ ); ?>" alt="swipe" />
								<h1><?php the_title(); ?></h1>
								<span>by <?php the_author(); ?></span>
								<div class="clear"></div>
							</header>
							<div class="post-content">
								<?php the_content(); ?>
							</div>
						</div>
					</section>
					<footer class="footer">
						<a href="http://www.facebook.com/sharer.php?u=<?php echo urlencode( get_permalink() ); ?>" target="_blank" class="button facebook"><span>Share on Facebook</span></a>
						<a href="http://twitter.com/home/?status=<?php echo urlencode( get_the_title() . ' - ' . get_permalink() ); ?>" target="_blank" class="button tweet"><span>Tweet about this</span></a>
						<div class="button comments" data-postID="<?php the_ID(); ?>" data-commentsCount="<?php echo get_comments_number(); ?>"><span>Comments (<?php echo get_comments_number(); ?>)</span></div>
						<div class="pwrd"><a>Switch to Full View</a></div>
					</footer>
				</div>
				<?php
			}
			?>
		</div>

	</div>
	<?php
}

get_wpr_footer();