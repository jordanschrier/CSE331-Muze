/**
 * Fetch function for the admin interface. Uses the 100x100 pixel tn_src
 * for loading efficiency since visuals are less important.
 */
function fetchPhotos()
{
    // get the div where the images should go
    var $tn_div = $("#thumbs");
    // just in case there's anything still in the thumbnails div, clear it out
    $tn_div.empty();

    // retrieve images from the database
    $endpoint = $path_to_backend + 'getPhotos.php?grp_id=395642';
    $.getJSON($endpoint, function(data)
    {
        $.each(data, function(key, val)
        {
            $("<div />")
                .attr("class", "admin-tn col")
                .append(
                    $("<img />")
                        .attr("src", $path_to_backend + val.tn_src)
                        .click(function() {
                            deletePhoto(val.id);
                        }),

                    $("<img />")
                        .attr("src", "../assets/remove-icon.svg")
                        .click(function() {
                            deletePhoto(val.id);
                        })
                )
                .appendTo($tn_div)
        });
    });
};

/**
 * Triggers when admin clicks an image to route to its full details
 * @param {*} id - The photo ID to display
 */
function clickPhoto(id) {
    
}

/**
 * Deletes a photo by its given id. The deletePhoto endpoint requires a POST
 * with a body containing the id as form data.
 * @param {*} id 
 */
function deletePhoto(id){
    const photoFormData = new FormData();
    photoFormData.append("id", id);

    $.ajax({
        url: $path_to_backend + 'deletePhoto.php?id=',
        type: 'POST',
        data: photoFormData,
        
        cache: false,
        contentType: false,
        processData: false,

    })
    .done(function() //let the admin know the photo was deleted
    {
    });
}

/**
 * Edits an image's description and/or tags through its given id
 * @param {*} id 
 * @param {string} desc
 */
function editDesc(id, desc){
    $endpoint = $path_to_backend + 'updatePhoto.php?id=',{id},'&description=',{desc};
}