/**
 * Fetch function for the admin interface. Uses the 100x100 pixel tn_src
 * for loading efficiency since visuals are less important here.
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
    $info_col.empty(); //empty the column where image data is displayed

    const endpoint = $path_to_backend + 'viewPhoto.php?grp_id=' + $grp_id + '&id=' + id;
    $.getJSON(endpoint, function(data)
    {
        $("<img />")
            .attr("src", $path_to_backend + data[0].src)
            .attr("class", "row")
            .css({height: "300px"}) //keep the images semi-consistent
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
                let text = "Are you sure you want to delete this?";
                if (confirm(text) == true) { //dialog popup, avoid accidental deletion
                    deletePhoto(id);
                }
            })
            .appendTo($info_col)
        
        //displaying the description and tags by destructuring the JSON
        $("<h2 />")
            .text("Description")
            .attr("class", "mt-4")
            .appendTo($info_col)
        $("<p />")
            .text(JSON.parse(data[0].description).description)
            .appendTo($info_col);
        $("<h2 />")
            .text("Tags")
            .attr("class", "mt-4")
            .appendTo($info_col)
        $("<p />")
            .text(JSON.parse(data[0].description).tags)
            .appendTo($info_col);
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
    .done(function()
    {
        alert("Post deleted successfully.");
        var $info_col = $("#image-info"); 
        $info_col.empty(); //ensure right column is cleared after deletion
        fetchPhotos();
    });
}
