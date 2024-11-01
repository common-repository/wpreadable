// For error detection.
//window.onerror = function(errorMsg, url, lineNumber){
//	return true;
//}


/**
 * Function to load comments through AJAX
 */

wpreadable.commentLoadingAjax = function(currentPost,postID) {

	$.ajax({
		type: 'POST',
		url: wpreadable.ajaxurl,
		data: {
			action: 'load_comments',
			'postID': postID
		},
		success: function(response){

			var comments = JSON.parse(response);

			var commentsMarkup = '<div class="show-comments"><ul class="comments-listing">';
			for ( var index = 0; index < comments.length; index++ ) {
				commentsMarkup+= '<li>';
				commentsMarkup+= '<img class="avatar" src="http://www.gravatar.com/avatar/'+ comments[index].email_md5 +'" alt="avatar" />';
				commentsMarkup+= '<div class="content">';
				commentsMarkup+= '<span class="name">'+ comments[index].author +':</span> ';
				//commentsMarkup+= '<span class="date">'+ comments[index].date +'</span>';
				commentsMarkup+= comments[index].content;
				commentsMarkup+= '</div>';
				commentsMarkup+= '</li>';
			}
			commentsMarkup+= '</ul><div class="comment-form" data-postID="'+postID+'">';
			commentsMarkup+= '<input class="txt comments-name" type="text" name="" value="Your name" />';
			commentsMarkup+= '<input class="txt comments-email" type="text" name="" value="Your e-mail address" />';
			commentsMarkup+= '<textarea class="txtarea comments-content">Your comment</textarea>';
			commentsMarkup+= '<input class="button submit comment-submit" type="submit" name="" value="Publish!" /></div></div>';
			commentsMarkup+= '<div class="pwrd"><a>Switch to Full View</a></div>';

			currentPostParent = $(currentPost).parent();

			// remove existing powered by message
			currentPostParent.find('.pwrd').remove();

			// append comments markup
			$(currentPostParent).append(commentsMarkup);

			$(currentPostParent).find('.txt, .txtarea').on('focus', function(e) {
				if ( this.value == this.defaultValue )
					this.value='';
			});

			$(currentPostParent).find('.txt, .txtarea').on('blur', function(e) {
				if ( this.value == '' )
					this.value = this.defaultValue;
			});

			$(currentPostParent).find('.submit').on('click', function(e) {
				// make sure form has actual values
				var flag = true;
				$(currentPostParent).find('.txt, .txtarea').each(function(){
					if ( flag && this.value == this.defaultValue ) {
						flag = false;

						if ( $(this).hasClass('comments-name') )
							alert('Please enter your name');
						else if ( $(this).hasClass('comments-email') )
							alert('Please enter your email address');
						else if ( $(this).hasClass('comments-content') )
							alert('Please enter a comment');
					}
				});

				if (flag) {
					$.ajax({
						type: 'POST',
						url: wpreadable.ajaxurl,
						data: {
							action: 'post_comment',
							postID: $(currentPostParent).find('.comment-form').attr('data-postID'),
							name: $(currentPostParent).find('.comments-name').val(),
							email: $(currentPostParent).find('.comments-email').val(),
							content: $(currentPostParent).find('.comments-content').val()
						},
						success: function(response){
							var response = JSON.parse(response);

							if ( response.status == 'success' ) {

								if ( response.comment_status == 'unapproved' )
									var markup = '<li><img class="avatar" src="http://www.gravatar.com/avatar/' + response.email_md5 + '" alt="avatar" /><div class="content"><span class="name">' + $(currentPostParent).find('.comments-name').val() + ':</span> ' + $(currentPostParent).find('.comments-content').val() + '<div class="clear"></div><p class="awaiting-approval">Your comment is awaiting approval.</p></div></li>';
								else
									var markup = '<li><img class="avatar" src="http://www.gravatar.com/avatar/' + response.email_md5 + '" alt="avatar" /><div class="content"><span class="name">' + $(currentPostParent).find('.comments-name').val() + ':</span> ' + $(currentPostParent).find('.comments-content').val() + '</div></li>';

								$(currentPostParent).find('.comments-listing').append(markup);

								// remove the awaiting approval message after a couple of seconds
								setTimeout(function(){
									$(currentPostParent).find('.awaiting-approval').remove();
								}, 7000);

								// increase the comment count
								$(currentPostParent).find('.button.comments span').html( 'Comments (' + parseInt( parseInt( $(currentPostParent).find('.button.comments span').html().replace('Comments (','').replace(')','') ) + 1 ) + ')' );

							} else {
								alert('Error posting comment!');
							}
						},
						error: function(){
							alert('Error posting comment!');
						}
					});
				}
			});

			// save the postIDs for which comment has been already loaded
			wpreadable.commentsLoaded.push(postID);

			// recalculate the height of the slide to accomodate the comments
			var slideStyle = window.getComputedStyle( wpreadable.swipey.slides[wpreadable.swipey.currentSlide] );
			wpreadable.swipey.wrapper.style.height = slideStyle.getPropertyValue('height');
		},
		error: function(){
			alert( 'Error fetching comments!');
		}
	});
}


/**
 * Function for recording page views of post
 */

wpreadable.recordingPV = function(postID) {

	postID = parseInt(postID);

	if ( isNaN(postID) )
		return;

	// check if we already have recording a page view for this post in this page load
	if ( wpreadable.pvsRecorded.indexOf(postID) == -1 ) {
		console.log('recording PV for post '+postID);
		// make the ajax call only when it wasn't found in global var
		$.ajax({
			type: 'POST',
			url: wpreadable.ajaxurl,
			data: {
				action: 'record_pv',
				'postID': postID
			},
			success: function(response){

				console.log(response);
				// save this postID in global var
				wpreadable.pvsRecorded.push(parseInt(postID));

			},
			error: function(){
				console.log('Error saving pageview!');
			}
		});
	}
}


/**
 *	JSON Object for swipey which has its own variables and functions
 */

wpreadable.swipey = {
	slideContainer: null, //<div> element object that holds the image slides
	wrapper: null, //meant for masking/clipping
	slides: null, //array of all slides
	slidesCount: 0, // slides count
	preferredWidth: 0, //dynamic variable to set width
	preferredHeight: 0, //dynamic variable to set height
	maxDistance: 0, //maximum distance in X direction that slide container can move
	currentDistance: 0, //current distance moved by slide container through translate
	currentSlide: 0, // current slide no, starting from zero just like array index
	offsetLeft: 0, // how much left side posts has been loaded (for single post links)
	offsetRight: 0, // how much right side posts has been loaded (for single post links)
	preloadCallFlood: 0, // Set to 1 to indicate preload call is in place, and don't send it again, when the call will complete, it will add more posts by itself
	dragLength:0, //the length to be dispalced on drag event.
	pastX:0, //to store previous value of X distance
	lastX:0, // to store last value of x touch coordinated
	flag:0, //to prevent right movement in case of 1st slide
	startX:0, //to store starting point of drag
	dragFlag:0, //to prevent dragend to fire in case of swipe executes.
	startTime:0, //start time of touch
	endTime:0, //end time of touch
	currentDistanceY: 0, //current distance vertically
	scrollLock:0, //initially 0, when vertically moved it is set to 1 to prevent horizontal movement and when horizontally moved set to 2 to prevent vertical movement.
	pastDirection:null, //to store last direction of drag
	lastSlideIndex:0, //last slide index
	moveCheck:0, //to check left slide doesnt exceeds last slide area

	initSwipey: function() {

		// scroll the window up to hide the address bar of the browser.
		window.setTimeout(function() {
			window.scrollTo(0, 1);
		}, 100);

		var swipeMinDistance = window.innerWidth/20;
		// get all the instances of the HTML elements
		this.wrapperhammer = new Hammer($("#wrapper")[0], {
			swipe_min_distance:swipeMinDistance,
			drag_min_distance:0
		});
		this.wrapper = $("#wrapper")[0];
		this.slideContainer = $("#wpswipe")[0];
		this.slides = this.slideContainer.getElementsByClassName("post_wrapper");
		this.slidesCount = this.slides.length;
		// Width
		this.preferredWidth = window.innerWidth; // 320
		this.preferredHeight = (window.innerHeight);

		// setting the width to our wrapper with overflow = hidden
		this.wrapper.style.width = this.preferredWidth + "px";
		this.wrapper.style.height = this.preferredHeight + "px";

		// setting width of each slide
		for ( var i = 0; i < this.slides.length; i++ ) {
			this.slides[i].style.width = window.innerWidth + 'px';
		}

		// setting the width to our <ul> element which holds all the <div> elements
		this.slideContainer.style.width = this.slides.length * this.preferredWidth + "px";

		// calculating the max distance of travel for Slide Container i.e <ul> element
		this.maxDistance = this.slides.length * this.preferredWidth;

		//calculating the X for last slide
		this.moveCheck = -(this.maxDistance - this.preferredWidth);

		// initialize and assign the touch events
		this.initEvents();
	},

	initEvents: function() {
		this.lastSlideIndex = (this.slides.length-1);

		var swipeyObj = wpreadable.swipey;

		swipeyObj.wrapperhammer.ondragstart = function(o) {
			//calculating start time for touch
			var a = new Date();
			swipeyObj.startTime = a.valueOf();
			swipeyObj.pastX = 0;
			swipeyObj.lastX = 0;
			swipeyObj.startX = o.touches[0].x;
			swipeyObj.dragFlag = 0;
		};

		swipeyObj.wrapperhammer.ondrag = function(o) {

			var currentX = o.distance;
			swipeyObj.dragLength = currentX - swipeyObj.pastX;
			var slideNum = parseInt(Math.abs( swipeyObj.currentDistance / window.innerWidth ),10);

			//to store end point of current slide
			var endCheck = (window.innerHeight - swipeyObj.slides[slideNum].offsetHeight -95);

			/* Calculations for current vertical distance after 3D translate */
			swipeyObj.currentDistanceY = swipeyObj.getLastYPosition(slideNum);

			if(o.direction == 'left' && (Math.abs( swipeyObj.currentDistance / window.innerWidth )) <= swipeyObj.lastSlideIndex && swipeyObj.scrollLock != 1) {

				//if the direction is left, last slide is not reached and there is no vertical motion then show the next left slide
				swipeyObj.dragLeft(swipeyObj.dragLength);
				swipeyObj.pastDirection = o.direction;

			} else if(o.direction == 'right' && (swipeyObj.currentDistance < 0) && swipeyObj.scrollLock != 1) {

				//if the direction is right, user is not at 1st slide and there is no vertical motion then show the next right slide
				swipeyObj.dragRight(swipeyObj.dragLength);
				swipeyObj.pastDirection = o.direction;

			} else if(o.direction == 'up' && swipeyObj.currentDistanceY > endCheck && swipeyObj.scrollLock != 2){

				//if the direction is up, user is not at end of slide vertically and there is no horizontal motion then scroll the page up.
				swipeyObj.dragUp(slideNum,swipeyObj.dragLength,0);

			} else if(o.direction == 'down' && swipeyObj.currentDistanceY < 0 && swipeyObj.scrollLock != 2){

				//if the direction is down, user is not at beginning of slide vertically and there is no horizontal motion then scroll the page down.
				swipeyObj.dragDown(slideNum,swipeyObj.dragLength,0);

			} else {
				swipeyObj.comeBack(slideNum);
				swipeyObj.flag = 1;
			}
			swipeyObj.pastX = currentX;
			swipeyObj.lastX = o.touches[0].x;
		};


		swipeyObj.wrapperhammer.onswipe = function(o) {
			var slideNum = parseInt(Math.abs( swipeyObj.currentDistance / window.innerWidth ),10);

			//calculating end time for touch
			var b = new Date();
			swipeyObj.endTime = b.valueOf();

			var swipeDistance = o.distance;
			var swipeTime = (swipeyObj.endTime - swipeyObj.startTime); //Time taken to swipe
			var speed = ((window.innerHeight)/swipeDistance)*swipeTime; //time duration for horizontal swipe
			var endCheck = (window.innerHeight - swipeyObj.slides[slideNum].offsetHeight -95); //to store end point of current slide

			//Calculation of vertical displacement in case of vertical swipe.
			var displacement = ((swipeDistance*swipeDistance*2 )/(swipeTime));

			//maximum speed of transition should not exceed 300ms.
			if ( speed > 300 ) {
				speed = 300;
			}

			if(o.direction == 'left' && (Math.abs( swipeyObj.currentDistance/ window.innerWidth )) <= (swipeyObj.lastSlideIndex) && swipeyObj.scrollLock != 1) {
				//if the direction is left, last slide is not reached and there is no vertical motion then show the next left slide
				swipeyObj.moveLeft(slideNum, speed);
			} else if(o.direction == 'right'  && (swipeyObj.currentDistance < 0) && swipeyObj.scrollLock != 1) {
				//if the direction is right, user is not at 1st slide and there is no vertical motion then show the next right slide
				swipeyObj.moveRight(slideNum, speed);
			} else if(o.direction == 'up' && swipeyObj.currentDistanceY > endCheck && swipeyObj.scrollLock != 2){
				//if the direction is up, user is not at end of slide vertically and there is no horizontal motion then scroll the page up.
				swipeyObj.slideUp(slideNum,displacement,500);
			} else if(o.direction == 'down' && swipeyObj.currentDistanceY < 0 && swipeyObj.scrollLock != 2){
				//if the direction is down, user is not at beginning of slide vertically and there is no horizontal motion then scroll the page down.
				swipeyObj.slideDown(slideNum,displacement,500);
			} else {
				swipeyObj.comeBack(slideNum);
				swipeyObj.flag = 1;
			}
			swipeyObj.dragFlag = 1;
			swipeyObj.scrollLock = 0;

			// record pageview
			var currentPost = $('#swipeaway li').eq(wpreadable.swipey.currentSlide).attr('data-postID');
			wpreadable.recordingPV(currentPost);

			// preload checker
			swipeyObj.preloadChecker();
		};


		swipeyObj.wrapperhammer.ondragend = function(o) {

			if(swipeyObj.dragFlag == 0){

				var slideNum = parseInt(Math.abs( swipeyObj.currentDistance / window.innerWidth ),10);

				//threshold value for left or right movement on drag end
				var threshold = window.innerWidth/5;

				var distanceTravel = Math.abs(swipeyObj.startX - swipeyObj.lastX);
				if ( o.direction == 'left' && slideNum <= swipeyObj.lastSlideIndex && swipeyObj.scrollLock != 1){
					if(threshold > distanceTravel){
						/* On drag end if the direction is left, last slide is not reached,there is no vertical motion
						and threshold value is not crossed then revert back and show the current slide*/
						swipeyObj.moveRight(slideNum, 300);
					}else{
						//If threshold value is crossed then move left and show next slide
						swipeyObj.moveLeft(slideNum, 300);
					}
				} else if(o.direction == 'right' && swipeyObj.scrollLock != 1){
					if(threshold > distanceTravel && swipeyObj.flag == 0){
						/* On drag end if the direction is right, first slide is not reached,there is no vertical motion
						and threshold value is not crossed then revert back and show the current slide*/
						swipeyObj.moveLeft(slideNum, 300);
					}else{
						//If threshold value is crossed then move right and show next slide
						swipeyObj.moveRight(slideNum, 300);
					}
				} else {
					// In case while horizontal movement, user also makes vertical movement while drag end
					if (swipeyObj.scrollLock == 2){
						if(swipeyObj.pastDirection == 'left' && slideNum <= swipeyObj.lastSlideIndex ){
							if(threshold > distanceTravel){
								/* On drag end if the past direction was left, last slide is not reached
								and threshold value is not crossed then revert back and show the current slide*/
								swipeyObj.moveRight(slideNum, 300);
							}else{
								//If threshold value is crossed then move left and show next slide
								swipeyObj.moveLeft(slideNum, 300);
							}
						} else if(swipeyObj.pastDirection == 'right'){
							if(threshold > distanceTravel && swipeyObj.flag == 0){
								/* On drag end if the past direction was right, first slide is not reached
								and threshold value is not crossed then revert back and show the current slide*/
								swipeyObj.moveLeft(slideNum, 300);
							}else{
								//If threshold value is crossed then move right and show next slide
								swipeyObj.moveRight(slideNum, 300);
							}
						}
					}
				}
			}

			swipeyObj.flag = 0;
			swipeyObj.scrollLock = 0;

		};

	},

	getLastYPosition: function(slideNum){
		var lastPos = parseInt($('#slide_'+slideNum).attr('data-last-Y'),10);
		if(isNaN(lastPos)){
			lastPos=0;
		}
		return lastPos;
	},

	setTransform: function(currentDistance) {
		this.slideContainer.style.webkitTransform = "translate3d(" + currentDistance + "px, 0,0)";
		this.slideContainer.style.MozTransform  = "translate3d(" + currentDistance + "px, 0,0)";
		this.slideContainer.style.OTransform  = "translate3d(" + currentDistance + "px, 0,0)";
	},

	setTransformY: function(slideNum,currentDistanceY) {
		$('#slide_'+slideNum).attr('data-last-Y', currentDistanceY);
		this.slides[slideNum].style.webkitTransform = "translate3d(0 ,"+ currentDistanceY + "px, 0)";
		this.slides[slideNum].style.MozTransform  = "translate3d(0 ,"+ currentDistanceY + "px, 0)";
		this.slides[slideNum].style.OTransform  = "translate3d(0 ,"+ currentDistanceY + "px, 0)";
	},

	setTransitionDuration: function(duration) {
		this.slideContainer.style.webkitTransitionDuration = duration + "ms";
		this.slideContainer.style.MozTransitionDuration = duration + "ms";
		this.slideContainer.style.OTransitionDuration = duration + "ms";
	},

	dragLeft: function(distanceMove) {
		this.currentDistance += -distanceMove;
		this.setTransitionDuration(0);
		this.setTransform(this.currentDistance);
		this.scrollLock = 2;
	},
	dragRight: function(distanceMove) {
		this.currentDistance += distanceMove;
		this.setTransitionDuration(0);
		this.setTransform(this.currentDistance);
		this.scrollLock = 2;
	},
	dragUp: function(slideNum,distanceMoveY,speed) {
		this.currentDistanceY = this.currentDistanceY + (-distanceMoveY);
		this.setTransitionDurationY(slideNum,speed);
		this.setTransformY(slideNum,this.currentDistanceY);
		this.scrollLock = 1;
	},
	dragDown: function(slideNum,distanceMoveY,speed) {
		this.currentDistanceY = this.currentDistanceY + (distanceMoveY);
		if(this.currentDistanceY > 0) {
			this.currentDistanceY = 0;
		}
		this.setTransitionDurationY(slideNum,speed);
		this.setTransformY(slideNum,this.currentDistanceY);
		this.scrollLock = 1;
	},

	setTransitionDurationY: function(slideNum,duration) {
		this.slides[slideNum].style.webkitTransitionDuration = duration + "ms";
		this.slides[slideNum].style.MozTransitionDuration = duration + "ms";
		this.slides[slideNum].style.OTransitionDuration = duration + "ms";

	},
	setTransitionTiming: function(slideNum){
		this.slides[slideNum].style.webkitTransitionTimingFunction = "ease-out";
		this.slides[slideNum].style.MozTransitionTimingFunction = "ease-out";
		this.slides[slideNum].style.OTransitionTimingFunction = "ease-out";
	},
	slideUp: function(slideNum,distanceMoveY,speed) {
		this.currentDistanceY = this.currentDistanceY + (-distanceMoveY);
		var endCheck = (window.innerHeight - this.slides[slideNum].offsetHeight -95);
		if(this.currentDistanceY < endCheck) {
			this.currentDistanceY = endCheck;
		}
		this.setTransitionDurationY(slideNum,speed);
		this.setTransitionTiming(slideNum);
		this.setTransformY(slideNum,this.currentDistanceY);
		this.scrollLock = 1;
	},
	slideDown: function(slideNum,distanceMoveY,speed) {
		this.currentDistanceY = this.currentDistanceY + (distanceMoveY);
		if(this.currentDistanceY > 0) {
			this.currentDistanceY = 0;
		}
		this.setTransitionDurationY(slideNum,speed);
		this.setTransitionTiming(slideNum);
		this.setTransformY(slideNum,this.currentDistanceY);
		this.scrollLock = 1;
	},

	moveLeft: function(slideNum, slideSpeed) {
		var moveDistance = -((slideNum+1) * window.innerWidth);
		this.setTransitionDuration(slideSpeed);
		if (moveDistance < this.moveCheck){
			moveDistance = this.moveCheck;
		}
		this.setTransform(moveDistance);
		this.slideContainer.style.webkitTransitionTimingFunction = "ease-out";
		this.currentDistance = moveDistance;
		this.currentDistanceY = 0;
		this.scrollLock = 2;
		console.log('moveleft',moveDistance);
		this.updateSlideNo();
	},
	moveRight: function(slideNum, slideSpeed) {
		var moveDistance = -(slideNum * window.innerWidth);
		this.setTransitionDuration(slideSpeed);
		this.setTransform(moveDistance);
		this.slideContainer.style.webkitTransitionTimingFunction = "ease-out";
		this.currentDistance = moveDistance;
		this.currentDistanceY = 0;
		this.scrollLock = 2;
		console.log('moveright');
		this.updateSlideNo();
	},
	comeBack: function(slide) {
		console.log('comeback firing',slide,this.lastSlideIndex);
		if (slide == this.lastSlideIndex) {
			this.setTransitionDuration(100);
			this.setTransform(this.moveCheck);
			this.slideContainer.style.webkitTransitionTimingFunction = "ease-out";
		}
	},
	updateSlideNo: function(){
		var slideNum = parseInt(Math.abs( wpreadable.swipey.currentDistance / window.innerWidth ),10);
		wpreadable.swipey.currentSlide = parseInt(slideNum);
		console.log('updateSlideNo is ',wpreadable.swipey.currentSlide);
	},
	preloadChecker: function() {
		if ( this.preloadCallFlood == 1 )
			return;

		// set Flood flag
		this.preloadCallFlood = 1;

		// issue ajax request when we come on either first / last slide
		if ( this.currentSlide == this.slidesCount - 1 ) {
			this.getPosts();
		} else if ( wpreadable.pivotID != 0 && this.currentSlide == 0 ) { // checking for pivotID so as not to trigger the check when starting from homepage view
			this.getPosts(false,'newer');
		}

		// reset the flood status variable so that we can make furter calls
		this.preloadCallFlood = 0;
	},

	getPosts: function(isNavClick,age){
		wpreadable.age = age ? age : 'older';
		if ( wpreadable.pivotID == 0 )
			var offset = isNavClick ? 0 : wpreadable.swipey.slidesCount;
		else {
			if ( wpreadable.age == 'older' )
				var offset = wpreadable.swipey.offsetRight;
			else
				var offset = wpreadable.swipey.offsetLeft;
		}

		// Make ajax call
		$.ajax({
			type: 'POST',
			url: wpreadable.ajaxurl,
			data: {
				action: 'load_posts',
				orderby: wpreadable.orderBy,
				age: wpreadable.age,
				offset: offset,
				pivotID: wpreadable.pivotID
			},
			success: function(response){
				if(isNavClick)
					wpreadable.swipey.removePosts();
				if (wpreadable.age == 'both')
					wpreadable.swipey.loadBothSidePosts(JSON.parse(response));
				else
					wpreadable.swipey.loadPosts(JSON.parse(response));
			},
			error: function(){
				posts = false;
			}
		});
	},

	removePosts: function(){
		// remove all li except "view more" li
		$('#swipeaway li').not('.viewmore').remove();
		// empty slider
		$('#wpswipe').empty();
	},

	loadPosts: function(posts){
		console.log('loadPosts func',posts);

		if ( posts !== false && posts.status == 'success' ) {

			posts = posts.data;
			var postsMarkup = '', postsHomeMarkup = '';

			if ( wpreadable.age == 'newer' )
				posts.reverse();

			for ( var index = 0; index < posts.length; index++ ) {

				postsMarkup+= '<div class="post_wrapper" data-postID="' + posts[index].postID + '" id="slide_'+parseInt(index+wpreadable.swipey.slidesCount)+ '">';
				postsMarkup+= '<section class="content"><div class="post"><header class="post-header">';
				postsMarkup+= '<img class="hit-swipe" src="' + wpreadable.swipeImageURL + '" alt="swipe" />';
				postsMarkup+= '<h1>' + posts[index].title + '</h1>';
				postsMarkup+= '<span>by ' + posts[index].author + '</span>';
				postsMarkup+= '<div class="clear"></div>';
				postsMarkup+= '</header><div class="post-content">';
				postsMarkup+= posts[index].content;
				postsMarkup+= '</div></div></section><footer class="footer">';
				postsMarkup+= '<a href="http://www.facebook.com/sharer.php?u=' + posts[index].url + '" target="_blank" class="button facebook"><span>Share on Facebook</span></a>';
				postsMarkup+= '<a href="http://twitter.com/home/?status=' + encodeURIComponent( posts[index].title + ' - ' + posts[index].url ) + '" target="_blank" class="button tweet"><span>Tweet about this</span></a>';
				postsMarkup+= '<div class="button comments" data-postID="' + posts[index].postID + '" data-commentsCount="' + posts[index].comments_count + '"><span>Comments (' + posts[index].comments_count + ')</span></div>';
				postsMarkup+= '<div class="pwrd"><a>Switch to Full View</a></div>';
				postsMarkup+= '</footer></div>';

				if ( wpreadable.pivotID == 0 ) {
					postsHomeMarkup+= '<li data-postID="' + posts[index].postID + '">';
					postsHomeMarkup+= '<a href="' + decodeURIComponent( posts[index].url ) + '">' + posts[index].title + '<span class="comment-count">' + posts[index].comments_count + '</span></a>';
					postsHomeMarkup+= '</li>';
				}

				if ( wpreadable.age == 'older' )
					wpreadable.swipey.offsetRight++;
				else
					wpreadable.swipey.offsetLeft++;
			}

			// append posts markup in slider
			if ( wpreadable.age == 'older' )
				this.slideContainer.innerHTML+= postsMarkup;
			else
				this.slideContainer.innerHTML = postsMarkup + this.slideContainer.innerHTML;

			if ( wpreadable.pivotID == 0 ) {
				// append posts markup in homepage list
				var injectionPt = $('#swipeaway .viewmore');
				$(postsHomeMarkup).insertBefore(injectionPt); // insert before view more li

				console.log( 'New posts added to Homepage list' );
			}

			this.reinit();

			// move slider back to current post only
			if ( wpreadable.age == 'newer' )
				wpreadable.swipey.moveRight(posts.length);

		} else {
			$('#swipeaway .viewmore a').html('No more posts left to load');
		}
	},

	loadBothSidePosts: function(allPosts){
		console.log('loadBothSidePosts func',allPosts);

		if ( allPosts !== false && allPosts.status == 'success' ) {

			var postsMarkup = '';
			var posts = allPosts.data.left;

			for ( var index = posts.length - 1; index >= 0; index-- ) {

				postsMarkup+= '<div class="post_wrapper" data-postID="' + posts[index].postID + '" id="slide_'+parseInt(index+wpreadable.swipey.slidesCount)+ '">';
				postsMarkup+= '<section class="content"><div class="post"><header class="post-header">';
				postsMarkup+= '<img class="hit-swipe" src="' + wpreadable.swipeImageURL + '" alt="swipe" />';
				postsMarkup+= '<h1>' + posts[index].title + '</h1>';
				postsMarkup+= '<span>by ' + posts[index].author + '</span>';
				postsMarkup+= '<div class="clear"></div>';
				postsMarkup+= '</header><div class="post-content">';
				postsMarkup+= posts[index].content;
				postsMarkup+= '</div></div></section><footer class="footer">';
				postsMarkup+= '<a href="http://www.facebook.com/sharer.php?u=' + posts[index].url + '" target="_blank" class="button facebook"><span>Share on Facebook</span></a>';
				postsMarkup+= '<a href="http://twitter.com/home/?status=' + encodeURIComponent( posts[index].title + ' - ' + posts[index].url ) + '" target="_blank" class="button tweet"><span>Tweet about this</span></a>';
				postsMarkup+= '<div class="button comments" data-postID="' + posts[index].postID + '" data-commentsCount="' + posts[index].comments_count + '"><span>Comments (' + posts[index].comments_count + ')</span></div>';
				postsMarkup+= '<div class="pwrd"><a>Switch to Full View</a></div>';
				postsMarkup+= '</footer></div>';

				wpreadable.swipey.offsetLeft++;

			}

			var rightSwipeNeeded = posts.length;
			var leftPostsMarkup = postsMarkup;

			postsMarkup = '';
			posts = allPosts.data.right;

			for ( var index = 0; index < posts.length; index++ ) {

				postsMarkup+= '<div class="post_wrapper" data-postID="' + posts[index].postID + '" id="slide_'+parseInt(index+wpreadable.swipey.slidesCount)+ '">';
				postsMarkup+= '<section class="content"><div class="post"><header class="post-header">';
				postsMarkup+= '<img class="hit-swipe" src="' + wpreadable.swipeImageURL + '" alt="swipe" />';
				postsMarkup+= '<h1>' + posts[index].title + '</h1>';
				postsMarkup+= '<span>by ' + posts[index].author + '</span>';
				postsMarkup+= '<div class="clear"></div>';
				postsMarkup+= '</header><div class="post-content">';
				postsMarkup+= posts[index].content;
				postsMarkup+= '</div></div></section><footer class="footer">';
				postsMarkup+= '<a href="http://www.facebook.com/sharer.php?u=' + posts[index].url + '" target="_blank" class="button facebook"><span>Share on Facebook</span></a>';
				postsMarkup+= '<a href="http://twitter.com/home/?status=' + encodeURIComponent( posts[index].title + ' - ' + posts[index].url ) + '" target="_blank" class="button tweet"><span>Tweet about this</span></a>';
				postsMarkup+= '<div class="button comments" data-postID="' + posts[index].postID + '" data-commentsCount="' + posts[index].comments_count + '"><span>Comments (' + posts[index].comments_count + ')</span></div>';
				postsMarkup+= '<div class="pwrd"><a>Switch to Full View</a></div>';
				postsMarkup+= '</footer></div>';

				wpreadable.swipey.offsetRight++;

			}

			var rightPostsMarkup = postsMarkup;

			// append posts markup in slider
			this.slideContainer.innerHTML = leftPostsMarkup + this.slideContainer.innerHTML + rightPostsMarkup;

			this.reinit();

			// move slider back to current post only
			wpreadable.swipey.moveLeft(rightSwipeNeeded - 1);

		}
	},

	reinit: function(){
		// Replace callbacks by overwriting with empty functions
		this.wrapperhammer.onswipe = function(){}
		this.wrapperhammer.ondragstart = function(){}
		this.wrapperhammer.ondrag = function(){}
		this.wrapperhammer.ondragend = function(){}

		// save the scroll position here
		var pageOffset = window.pageYOffset;

		this.initSwipey();

		// make the page scroll back to where it was
		setTimeout(function(){
			window.scrollTo(0, pageOffset);
		},100);
	}
};


// Init function
wpreadable.init = function() {

	// Placeholder for collecting POST IDs for which postviews have been recorded
	wpreadable.pvsRecorded = new Array();

	if ( $('body').hasClass('single') ) {
		// Set PivotID
		wpreadable.pivotID = $('#wpswipe div').attr('data-postid');

		// set Orderby as freshness
		wpreadable.orderBy = 'freshness';

		// record PV
		wpreadable.recordingPV($('#wpswipe div').attr('data-postid'));

		// load 5 newer & older posts
		wpreadable.swipey.getPosts(false,'both');
	}

	// Invoke the swipe init method to make the slides ready for swiping
	wpreadable.swipey.initSwipey();

	// Posts sorting on homepage
	$('#nav a').click(function(){
		if ( $(this).hasClass('active') )
			return false;

		$('#nav a').removeClass('active');
		$(this).addClass('active');

		// Get which nav click is this
		// Note: OrderBy is set in global because while loading more posts we need to know the context in which posts were originally loaded
		var index = $('#nav a').index($(this));
		if ( index == 0 )
			wpreadable.orderBy = 'freshness';
		else if ( index == 1 )
			wpreadable.orderBy = 'popular';
		else if ( index == 2 )
			wpreadable.orderBy = 'discussed';

		wpreadable.swipey.getPosts(true);
	});

	// Homepage slideaway post navigation
	$('#swipeaway').on('click', 'li', function(){

		var postID = $(this).attr('data-postID') || 0;
		var flag = true; // keep searching flag
		var counter = -2;

		if (postID != 0) { // if its not a click on view more

			// swipe to this post
			$('#wpswipe .post_wrapper').each(function(){
				if (flag) {
					counter++;
					if ( $(this).attr('data-postID') == postID ) {
						wpreadable.swipey.moveLeft(counter);
						flag = false; // we dont need to search more for swiping the clicked post

						// record PV
						wpreadable.recordingPV(postID);
					}
				}
			});

			$('#swipeaway,#nav').hide();
			$('#wrapper').show();

			// Body class change
			$('body').addClass('gradient-header');

			// Home button class change
			$('#header .home-icon').removeClass('disabled');

			// call preloader function
			wpreadable.swipey.preloadChecker();

		} else { // its a click on viewmore button

			$('#swipeaway .viewmore a').html('Loading more posts..');
			wpreadable.swipey.getPosts();
			$('#swipeaway .viewmore a').html('View more posts');

		}

		return false;
	});

	// Home button should not be clickable on homepage
	$('#header').on('click','.home-icon.disabled',function(){
		return false;
	});

	// Don't let users go to image's link when clicked
	$('#wrapper img').click(function(){
		return false;
	});

	// Comment loading trigger
	$('.comments').on('click',function(){
		var postID = $(this).attr('data-postid');
		var flag = true;

		// Check if comments were already loaded for this post
		for (var i = 0; i < wpreadable.commentsLoaded.length; i++ ) {
			if ( wpreadable.commentsLoaded[i] == postID ) {
				// comments are already loaded, just show them
				console.log( $(this).parent().find('.show-comments') );
				$(this).parent().find('.show-comments').toggle();
				flag = false;
			}
		}

		if (flag)
			wpreadable.commentLoadingAjax( $(this), postID );
	});

	// Placeholder for collecting POST IDs for which comments AJAX call were successful
	wpreadable.commentsLoaded = new Array();

	// Switch to Full View
	$('#wpswipe').on('click', '.pwrd',function(){
		$.ajax({
			type: 'POST',
			url: wpreadable.ajaxurl,
			data: {
				action: 'switch_full_view',
				currentPostID: $('#wpswipe > div').eq(wpreadable.swipey.currentSlide).attr('data-postid')
			},
			success: function(response){
				response = JSON.parse(response);
				if ( response.status == 'success' )
					location.href = response.url;
			}
		});
	});
}

// Start off the engine
wpreadable.init();