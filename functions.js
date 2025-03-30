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
    // divide images into 3 to separate into each column
    // layout by column instead of row to keep varying image heights

    {
        var col_length = ((data.length) / 3);
        $.each(data, function(key, val)
        {
            if(key < col_length){
                // append the images to the div, and make them clickable for details
                // using src instead of tn_src for the higher-quality images
                $("<img />")
                .attr("src", $path_to_backend + val.src)
                .attr("id", val.id)
                .attr("class", "img-fluid thumbnail")
                .appendTo($tn_col1)
                .wrap('<a href="' + $path_to_backend + val.src + '"></a>')
            }else if((key >= col_length) && key < (col_length*2)){
                $("<img />")
                .attr("src", $path_to_backend + val.src)
                .attr("id", val.id)
                .attr("class", "thumbnail img-fluid")
                .appendTo($tn_col2)
                .wrap('<a href="' + $path_to_backend + val.src + '"></a>')
            }else{
                $("<img />")
                .attr("src", $path_to_backend + val.src)
                .attr("id", val.id)
                .attr("class", "thumbnail img-fluid")
                .appendTo($tn_col3)
                .wrap('<a href="' + $path_to_backend + val.src + '"></a>')
            }
        });

        // make our thumbnails draggable
        
    });
};

function uploadFunction()
{
    // for data, we want to submit the photo and the description
    var photoFormData = new FormData(document.forms['uploader']);
    if (!photoFormData.get("description").trim()) {
        alert("Please enter a photo description.");
        return;
    }
    
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
        fetchPhotos();
    });
}

