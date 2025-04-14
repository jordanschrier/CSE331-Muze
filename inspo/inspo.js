/**
 * Parses URL parameters to get the desired ID
 * @returns {Object} Object containing URL parameters
 */
function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    
    if (queryString && queryString.length > 1) {
        queryString.substring(1).split('&').forEach(param => {
            if (param.includes('=')) {
                const [key, value] = param.split('=');
                params[key] = decodeURIComponent(value);
            }
        });
    }
    return params;
}

/**
 * Loads the inspiration detail based on the ID parameter in the URL
 */
function loadInspirationDetail() {
    const params = getUrlParams();
    const id = params.id;
    
    if (!id) {
        // If no ID provided, show error message
        $('#inspo-description').text('No inspiration ID provided');
        $('#inspo-image').hide();
        return;
    }
    
    // Show loading state
    $('#inspo-image').attr('src', '');
    $('#inspo-description').text('Loading...');
    $('#tag1').text('').hide();
    $('#tag2').text('').hide();
    
    // Fetch the photo data
    const endpoint = $path_to_backend + 'viewPhoto.php?grp_id=' + $grp_id + '&id=' + id;
    $.getJSON(endpoint, function(data) {
        if (!data || data.length === 0) {
            // Handle case where photo isn't found
            $('#inspo-description').text('Photo not found');
            return;
        }
        
        // Parse the post data using our helper function
        const postData = parsePostData(data[0]);
        
        if (!postData.isValid) {
            $('#inspo-description').text('This post has invalid data format');
            return;
        }
        
        // Log legacy format warning for debugging purposes
        if (postData.isLegacyFormat) {
            console.warn('Post is using legacy data format. Comments are not supported for legacy posts.');
        }
        
        // Update the page with the photo data
        document.title = `${postData.description} - Muze`;
        $('#inspo-image').attr('src', $path_to_backend + data[0].src);
        $('#inspo-description').text(postData.description);
        
        // Only show tags if they exist
        if (postData.tag1 && postData.tag1.trim()) {
            $('#tag1').text(postData.tag1).show();
        } else {
            $('#tag1').hide();
        }
        
        if (postData.tag2 && postData.tag2.trim()) {
            $('#tag2').text(postData.tag2).show();
        } else {
            $('#tag2').hide();
        }
        
        // Optionally show legacy indicator
        if (postData.isLegacyFormat) {
            $('#inspo-detail').append(
                $('<div class="col-12 mt-3">').append(
                    $('<small class="text-muted">').text('This post uses legacy format')
                )
            );
        }
        
        // Store the post ID for comment submission
        $('#comment-form').data('post-id', id);
        
        // Only show comments section for modern format posts
        if (postData.isLegacyFormat) {
            $('#comments-container').html(
                '<div class="alert alert-warning">' +
                'Comments are not available for legacy posts. New posts support comments.' +
                '</div>'
            );
            // Disable the comment form for legacy posts
            $('#comment-form').find('input, textarea, button').prop('disabled', true);
        } else {
            // Display comments for modern format posts
            displayComments(postData.comments);
        }
    })
    .fail(function() {
        $('#inspo-description').text('Error loading photo');
    });
}

/**
 * Displays comments for a post
 * @param {Array} comments - Array of comment objects
 */
function displayComments(comments) {
    const $commentsContainer = $('#comments-container');
    $commentsContainer.empty();
    
    if (!comments || comments.length === 0) {
        $commentsContainer.append(
            $('<p class="no-comments">').text('No comments yet. Be the first to comment!')
        );
        return;
    }
    
    // Sort comments by timestamp, newest first
    const sortedComments = [...comments].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Add each comment to the container
    sortedComments.forEach(comment => {
        const commentDate = new Date(comment.timestamp);
        const formattedDate = commentDate.toLocaleDateString() + ' ' + commentDate.toLocaleTimeString();
        
        const $commentEl = $('<div class="comment">').append(
            $('<div class="comment-header">').append(
                $('<span class="comment-author">').text(comment.author),
                $('<span class="comment-date">').text(formattedDate)
            ),
            $('<div class="comment-text">').text(comment.text)
        );
        
        $commentsContainer.append($commentEl);
    });
}

/**
 * Handles comment form submission
 */
function handleCommentSubmit() {
    const postId = $('#comment-form').data('post-id');
    const author = $('#comment-author').val().trim() || 'Anonymous';
    const text = $('#comment-text').val().trim();
    
    if (!text) {
        alert('Please enter a comment');
        return;
    }
    
    // Disable the submit button and show loading state
    $('#comment-submit').prop('disabled', true).text('Posting...');
    
    // Save the comment
    saveComment(postId, author, text)
        .then(() => {
            // Clear the form
            $('#comment-text').val('');
            
            // Reload the post data to get the updated comments
            loadInspirationDetail();
            
            // Show success message
            alert('Comment posted successfully!');
        })
        .catch(error => {
            // Show error message
            alert('Failed to post comment: ' + error.message);
        })
        .finally(() => {
            // Re-enable the submit button
            $('#comment-submit').prop('disabled', false).text('Post Comment');
        });
}