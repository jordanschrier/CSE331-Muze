function fetchPhotos()
{
    // select the 3 cols where imgs will be populated
    var $tn_col1 = $("#col1");
    var $tn_col2 = $("#col2");
    var $tn_col3 = $("#col3");
    // just in case there's anything still in the thumbnail divs, clear them out
    $tn_col1.empty();
    $tn_col2.empty();
    $tn_col3.empty();

    // retrieve images from the database
    $endpoint = $path_to_backend + 'getPhotos.php?grp_id=' + $grp_id;
    $.getJSON($endpoint, function(data)
    {
        if (!data || data.length === 0) {
            // Show message if no posts found
            $tn_col1.append('<div class="no-posts">No posts found</div>');
            return;
        }
        
        // Display all posts in the gallery
        sortImagesIntoColumns(data, $tn_col1, $tn_col2, $tn_col3);
    })
    .fail(function() {
        $tn_col1.append('<div class="no-posts">Error loading posts</div>');
    });
};

/**
 * Sorts images into three columns from left to right, top to bottom,
 * with newest posts (lowest IDs) first
 * @param {Array} imagesData - Array of image data from the server
 * @param {jQuery} $col1 - jQuery object for the first column,
 * @param {jQuery} $col2 -                       second column,
 * @param {jQuery} $col3 -                       & third column
 */
function sortImagesIntoColumns(imagesData, $col1, $col2, $col3) {
    // Sort images by ID from lowest to highest (newest to oldest)
    // Lower ID means newer, higher ID means older
    const sortedImages = [...imagesData].sort((a, b) => parseInt(b.id) - parseInt(a.id));
    
    // Create a row-based layout
    const columns = [$col1, $col2, $col3];
    
    // Load all images first before displaying
    let loadedImages = [];
    let imagesLoaded = 0;
    const totalImagesToLoad = sortedImages.length;
    
    if (totalImagesToLoad === 0) {
        return;
    }
    
    // Load each image
    $.each(sortedImages, function(index, imageData) {
        const img = new Image();
        img.onload = function() {
            // Store the image data with its index to maintain order
            loadedImages[index] = {
                data: imageData,
                width: this.width,
                height: this.height
            };
            
            imagesLoaded++;
            
            // When all images are loaded, arrange them in the grid
            if (imagesLoaded === totalImagesToLoad) {
                displayImagesInGrid(loadedImages, columns);
            }
        };
        
        // Handle image loading errors
        img.onerror = function() {
            imagesLoaded++;
            // Skip this image but continue with others
            if (imagesLoaded === totalImagesToLoad) {
                // Filter out undefined elements from loadedImages
                const validImages = loadedImages.filter(img => img !== undefined);
                displayImagesInGrid(validImages, columns);
            }
        };
        
        // Start loading the image
        img.src = $path_to_backend + imageData.src;
    });
}

/**
 * Displays images in a grid layout from left to right, top to bottom
 * @param {Array} loadedImages - Array of loaded image data
 * @param {Array} columns - Array of jQuery column elements
 */
function displayImagesInGrid(loadedImages, columns) {
    const numColumns = columns.length;
    
    // Iterate through each image
    loadedImages.forEach((imgData, index) => {
        // Calculate which column this image should go into
        const columnIndex = index % numColumns;
        
        // Add the image to the appropriate column
        appendImageToColumn(imgData.data, columns[columnIndex]);
    });
}

/**
 * Appends an image to the specified column
 * @param {Object} imageData - Image data from server
 * @param {jQuery} $column - jQuery object for the column
 */
function appendImageToColumn(imageData, $column) {
    $("<a>")
        .attr("href", "#") // Required to be focusable and look like a link
        .append(
            $("<img />")
                .attr("src", $path_to_backend + imageData.src)
                .attr("id", imageData.id)
                .attr("class", "img-fluid thumbnail")
        )
        .appendTo($column)
        .click(function() {
            clickPhoto(imageData.id);
        });
}

function uploadFunction()
{
    // For the data, we want to submit the photo and the description
    const fileInput = document.getElementById('file-input');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Please provide an image to upload as inspiration');
        return;
    }

    var photoFormData = new FormData(document.forms['uploader']);
    if (!photoFormData.get("description").trim()) {
        alert("Please enter a photo description.");
        return;
    }

    $('#progressCircle').show();

    // Use the helper function to create JSON from form data
    const postData = {
        description: photoFormData.get("description"),
        tag1: photoFormData.get("tag1"),
        tag2: photoFormData.get("tag2")
    };
    
    // Convert to JSON and set in the form data
    console.log(postData);
    
    const jsonData = writePostDataToJson(postData);
    photoFormData.set("description", jsonData);
    
    // Include the group ID
    photoFormData.append('grp_id', $grp_id);
    $.ajax({
        url: $path_to_backend + 'uploadPhoto.php',
        type: 'POST',
        data: photoFormData,
        // responseType: 'application/json',

        // some flags for jQuery
        cache: false,
        contentType: false,
        processData: false,
    })
    .done(function()
    {
        setTimeout(function() {
            window.location.href = "../";
        }, 1000);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        alert("Upload failed: " + textStatus);
        $('#progressCircle').hide();
    });
}

/**
 * Triggers when user clicks an image to route to the inspiration detail page
 * @param {*} id - The photo ID to display
 */
function clickPhoto(id) {
    window.location.href = "./inspo/index.html?id=" + id;
}