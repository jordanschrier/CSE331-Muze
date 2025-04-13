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
        console.log(data);
        
        sortImagesIntoColumns(data, $tn_col1, $tn_col2, $tn_col3);
    });
};

/**
 * Sorts images into three columns with roughly equal heights
 * @param {Array} imagesData - Array of image data from the server
 * @param {jQuery} $col1 - jQuery object for the first column,
 * @param {jQuery} $col2 -                       second column,
 * @param {jQuery} $col3 -                       & third column
 */
function sortImagesIntoColumns(imagesData, $col1, $col2, $col3) {
    // array of column objects to track heights
    const columns = [
        { element: $col1, height: 0 },
        { element: $col2, height: 0 },
        { element: $col3, height: 0 }
    ];
    
    // create image elements first to pre-calculate heights
    const imageElements = [];
    const imagesToLoad = imagesData.length;
    let imagesLoaded = 0;
    
    // process images once they're loaded
    $.each(imagesData, function(index, imageData) {
        const img = new Image();
        img.onload = function() {
            imageElements.push({
                data: imageData,
                width: this.width,
                height: this.height,
                aspectRatio: this.width / this.height
            });
            
            imagesLoaded++;
            
            if (imagesLoaded === imagesToLoad) {
                //sort images by height (tallest first)

                imageElements.forEach(function (imgElement) {
                  // find the column with the shortest height
                  let shortestColumn = columns[0];
                  for (let i = 1; i < columns.length; i++) {
                    if (columns[i].height < shortestColumn.height) {
                      shortestColumn = columns[i];
                    }
                  }

                  appendImageToColumn(imgElement.data, shortestColumn.element);

                  // update the column height
                  const estimatedHeight = 100 / imgElement.aspectRatio; // assumes 100px standard width
                  shortestColumn.height += estimatedHeight;
                });
            }
        };
        
        // start loading the image
        img.src = $path_to_backend + imageData.src;
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

    //to work with the existing backend, append the tag and description together
    var description = photoFormData.get("description");
    var tag1 = photoFormData.get("tag1");
    var tag2 = photoFormData.get("tag2");

    //separate them by a % so we can parse later
    var all = description + "%" + tag1 + "%" + tag2;

    //replace entered description with description plus tags
    photoFormData.set("description", all);
    
    // include the group ID
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