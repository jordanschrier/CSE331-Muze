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
                // append the images to their respective columns and trigger uploadFunction when clicked
                // using src instead of tn_src for the higher-quality images. longer loading times though
                $("<a>")
                .attr("href", "#") //requires this to actually be focusable and look like a link
                    .append(
                        $("<img />")
                            .attr("src", $path_to_backend + val.src)
                            .attr("id", val.id)
                            .attr("class", "img-fluid thumbnail")
                    )
                .appendTo($tn_col1)
                .click(function() {
                    clickPhoto(val.id);
                });
            }else if((key >= col_length) && key < (col_length*2)){
                $("<a>")
                .attr("href", "#") //requires this to actually be focusable and look like a link
                    .append(
                        $("<img />")
                            .attr("src", $path_to_backend + val.src)
                            .attr("id", val.id)
                            .attr("class", "img-fluid thumbnail")
                    )
                .appendTo($tn_col2)
                .click(function() {
                    clickPhoto(val.id);
                });
            }else{
                $("<a>")
                .attr("href", "#") //requires this to actually be focusable and look like a link
                    .append(
                        $("<img />")
                            .attr("src", $path_to_backend + val.src)
                            .attr("id", val.id)
                            .attr("class", "img-fluid thumbnail")
                    )
                .appendTo($tn_col3)
                .click(function() {
                    clickPhoto(val.id);
                });
            }
        });
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

/**
 * Triggers when user clicks an image to open the 'vertical view.' 
 * Currently just loads the clicked image. Must reload the page to view full gallery.
 * In the future, will ensure the clicked image is loaded first, followed by the rest 
 * of the images.
 * @param {*} id 
 */
function clickPhoto(id) {
    var $col = $("#column_section");
    $col.empty();

    //calling viewPhoto to get the single photos and their descriptions
    $endpoint = $path_to_backend + 'viewPhoto.php?grp_id=' + $grp_id + '&id=' + id;
    $.getJSON($endpoint, function(data){
        //split the description by % to separate the tags
        var elements = data[0].description.split('%');
        var description = elements[0];
        var tag1 = elements[1];
        var tag2 = elements[2];

        //renders full-sized image
        $("<img />")
            .attr("src", $path_to_backend + data[0].src)
            .attr("class", "img-fluid full-image")
            .appendTo($col)
            .wrap('<div class="col-md px-2"></div>')

        //renders white description box next to image
        $("<div>")
            .append("<h2>Description</h2>")
            .append(
                $("<div>").text(description)
            )
            .append( //add the tags as separate boxes
                $("<div>").text(tag1).addClass("tag")
            )
            .append( //add the tags as separate boxes
                $("<div>").text(tag2).addClass("tag")
            )
            .appendTo($col)
            .wrap('<div class="col-md px-2"></div>')
            .attr("class", "description p-3")
    });
}

