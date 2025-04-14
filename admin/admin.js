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
            $("<img />")
                .attr("src", $path_to_backend + val.tn_src)
                .click(function() {
                    clickPhoto(val.id);
                })
                .appendTo($tn_div)
        });
    });
};

/**
 * Triggers when admin clicks an image to display the full details in
 * the right column.
 * @param {*} id - The photo ID to display
 */
function clickPhoto(id) {
    var $info_col = $("#image-info");
    $info_col.empty();

    const endpoint = $path_to_backend + 'viewPhoto.php?grp_id=' + $grp_id + '&id=' + id;
    $.getJSON(endpoint, function(data)
    {
        $("<img />")
            .attr("src", $path_to_backend + data[0].src)
            .attr("class", "row")
            .css({maxHeight: "300px"})
            .appendTo($info_col)
        
        $("<button />")
            .attr("href", "#")
            .attr("class", "row py-2 mt-2 d-flex align-items-center")
            .append(
                $("<img />")
                    .attr("src", "../assets/remove-icon.svg")
                    .attr("class", "pr-2"),
                $("<span />")
                    .text("Delete post")
            )
            .click(function() {
                deletePhoto(id);
            })
            .appendTo($info_col)
    });
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
        alert("Post deleted successfully.");
        $("#image-info").empty;
        fetchPhotos();
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