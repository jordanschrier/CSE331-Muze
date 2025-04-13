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
        
        // Split the description by % to separate the tags
        const elements = data[0].description.split('%');
        const description = elements[0];
        const tag1 = elements[1];
        const tag2 = elements[2];
        
        // Update the page with the photo data
        document.title = `${description} - Muze`;
        $('#inspo-image').attr('src', $path_to_backend + data[0].src);
        $('#inspo-description').text(description);
        
        // Only show tags if they exist
        if (tag1 && tag1.trim()) {
            $('#tag1').text(tag1).show();
        } else {
            $('#tag1').hide();
        }
        
        if (tag2 && tag2.trim()) {
            $('#tag2').text(tag2).show();
        } else {
            $('#tag2').hide();
        }
    })
    .fail(function() {
        $('#inspo-description').text('Error loading photo');
    });
}