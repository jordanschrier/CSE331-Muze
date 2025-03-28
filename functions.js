function fetchPhotos()
{
    // get the dive where the images should go
    var $tn_div = $("#thumbs");
    // just in case there's anything still in the thumbnails div, clear it out
    $tn_div.empty();

    // retrieve images from the database
    // !!! NB: change grp_id to match your group !!! //
    $endpoint = $path_to_backend + 'getPhotos.php?grp_id=' + $grp_id;
    $.getJSON($endpoint, function(data)
    {
        $.each(data, function(key, val)
        {
            // append the images to the div, and make them clickable for details
            $("<img />")
                .attr("src", $path_to_backend + val.tn_src)
                .attr("id", val.id)
                .attr("class", "tn")
                .appendTo($tn_div)
                .wrap('<a href="' + $path_to_backend + val.tn_src + '"></a>')
                .onClick(alert("clicked"));
        });

        // make our thumbnails draggable
        
    });
};

function uploadFunction()
{
    // for data, we want to submit the photo and the description
    var photoFormData = new FormData(document.forms['uploader']);
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

        // Custom XMLHttpRequest
        xhr: function() {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                // For handling the progress of the upload
                myXhr.upload.addEventListener('progress', function(e) {
                    if (e.lengthComputable) {
                        $('progress').attr({
                            value: e.loaded,
                            max: e.total,
                        });
                    }
                } , false);
            }
            return myXhr;
        }
    })
    .done(function()
    {
        alert("photo uploaded");
    });
}

