/**
 * Post data schema helper functions
 * These functions help convert between JSON and string formats for post data
 */

/**
 * Converts post data to JSON string for storage
 * @param {Object} postData - Object containing post data fields
 * @param {string} postData.description - Main description text
 * @param {string} postData.tag1 - First tag (optional)
 * @param {string} postData.tag2 - Second tag (optional)
 * @param {Array} postData.comments - Array of comment objects (optional)
 * @returns {string} JSON string representation of post data
 */
function writePostDataToJson(postData) {
    const jsonData = {
        version: 1, // For future compatibility
        description: postData.description || "",
        tags: [
            postData.tag1 || "",
            postData.tag2 || ""
        ],
        comments: postData.comments || [],
        savedCount: postData.savedCount || 0, // Track number of times saved to boards
        createdAt: new Date().toISOString() // Adding timestamp for future sorting options
    };
    
    return JSON.stringify(jsonData);
}

/**
 * Creates a new comment object
 * @param {string} author - Name of the comment author
 * @param {string} text - Comment text content
 * @returns {Object} Comment object with author, text, and timestamp
 */
function createComment(author, text) {
    return {
        author: author || "Anonymous",
        text: text,
        timestamp: new Date().toISOString()
    };
}

/**
 * Adds a comment to a post's data
 * @param {Object} postData - The post data object
 * @param {string} author - Name of the comment author
 * @param {string} text - Comment text content
 * @returns {Object} Updated post data with new comment
 */
function addCommentToPostData(postData, author, text) {
    // Create a deep copy of the post data
    const updatedPostData = JSON.parse(JSON.stringify(postData));
    
    // Initialize comments array if it doesn't exist
    if (!updatedPostData.comments) {
        updatedPostData.comments = [];
    }
    
    // Add the new comment
    updatedPostData.comments.push(createComment(author, text));
    
    return updatedPostData;
}

/**
 * Parses post data from backend response
 * @param {Object} backendData - Raw data from backend
 * @returns {Object} Structured post data
 */
function parsePostData(backendData) {
    // Default fallback data structure
    const defaultData = {
        description: "No description available",
        tag1: "",
        tag2: "",
        comments: [],
        savedCount: 0,
        isLegacyFormat: false,
        isValid: false
    };
    
    if (!backendData || !backendData.description) {
        return defaultData;
    }
    
    try {
        // Try to parse as JSON first
        const jsonData = JSON.parse(backendData.description);
        
        // Return structured data from JSON
        return {
            description: jsonData.description || "No description available",
            tag1: (jsonData.tags && jsonData.tags[0]) || "",
            tag2: (jsonData.tags && jsonData.tags[1]) || "",
            comments: jsonData.comments || [],
            savedCount: jsonData.savedCount || 0,
            createdAt: jsonData.createdAt,
            isLegacyFormat: false,
            isValid: true
        };
    } catch (e) {
        // If JSON parsing fails, try legacy format (%delimiter)
        try {
            const parts = backendData.description.split('%');
            
            // If we have at least a description part
            if (parts.length >= 1) {
                return {
                    description: parts[0] || "No description available",
                    tag1: parts.length > 1 ? parts[1] : "",
                    tag2: parts.length > 2 ? parts[2] : "",
                    comments: [], // Legacy format doesn't support comments
                    savedCount: 0,  // Legacy format doesn't support saved count
                    isLegacyFormat: true,
                    isValid: true
                };
            }
        } catch (legacyError) {
            // If all parsing fails, return original description as is
            return {
                description: backendData.description,
                tag1: "",
                tag2: "",
                comments: [],
                savedCount: 0,
                isLegacyFormat: true,
                isValid: false
            };
        }
    }
    
    return defaultData;
}

/**
 * Updates the saved count for an image
 * @param {string} postId - The ID of the post to update
 * @param {number} increment - Amount to change count by (1 for save, -1 for unsave)
 * @returns {Promise} Promise that resolves when the count is updated
 */
function updateServerSavedCount(postId, increment) {
    return new Promise((resolve, reject) => {
        if (!postId) {
            reject(new Error("Post ID is required"));
            return;
        }
        
        // First, get the current post data
        const endpoint = $path_to_backend + 'viewPhoto.php?grp_id=' + $grp_id + '&id=' + postId;
        
        $.getJSON(endpoint)
            .then(data => {
                if (!data || data.length === 0) {
                    reject(new Error("Post not found"));
                    return;
                }
                
                // Parse the current post data
                const postData = parsePostData(data[0]);
                
                // Log current state
                console.log(`[SERVER DEBUG] Image ${postId} - Current saved count: ${postData.savedCount || 0}`);
                console.log(`[SERVER DEBUG] Attempting to change by: ${increment}`);
                
                // Update the saved count (ensure it never goes below 0)
                postData.savedCount = Math.max(0, (postData.savedCount || 0) + increment);
                
                console.log(`[SERVER DEBUG] New saved count will be: ${postData.savedCount}`);
                
                // Convert post data to JSON string for the description field
                const jsonDescription = writePostDataToJson(postData);

                // Update the post on the server
                return $.ajax({
                    url: $path_to_backend + 'updatePhoto.php',
                    type: 'POST',
                    data: {
                        grp_id: $grp_id,
                        id: postId,
                        description: jsonDescription
                    },
                    error: function(xhr, status, error) {
                        if (xhr.status === 404) {
                            throw new Error("The updatePhoto.php endpoint is not available.");
                        } else {
                            throw new Error("Error updating saved count: " + error);
                        }
                    }
                });
            })
            .then(() => {
                resolve();
            })
            .catch(error => {
                reject(error);
            });
    });
}

/**
 * Saves a comment to a post
 * @param {number} postId - The ID of the post to comment on
 * @param {string} author - Name of the comment author
 * @param {string} text - Comment text content
 * @returns {Promise} Promise that resolves when the comment is saved
 */
function saveComment(postId, author, text) {
    return new Promise((resolve, reject) => {
        if (!postId || !text.trim()) {
            reject(new Error("Post ID and comment text are required"));
            return;
        }
        
        // First, get the current post data
        const endpoint = $path_to_backend + 'viewPhoto.php?grp_id=' + $grp_id + '&id=' + postId;
        
        $.getJSON(endpoint)
            .then(data => {
                if (!data || data.length === 0) {
                    reject(new Error("Post not found"));
                    return;
                }
                
                // Parse the current post data
                const postData = parsePostData(data[0]);
                
                // Add the comment
                const updatedPostData = addCommentToPostData(postData, author, text);
                
                // Convert post data to JSON string for the description field
                const jsonDescription = writePostDataToJson(updatedPostData);

                // Update the post on the server using the correct endpoint parameters
                return $.ajax({
                    url: $path_to_backend + 'updatePhoto.php',
                    type: 'POST',
                    data: {
                        grp_id: $grp_id, // Required group ID
                        id: postId,
                        description: jsonDescription
                    },
                    error: function(xhr, status, error) {
                        // Provide more specific error message
                        if (xhr.status === 404) {
                            throw new Error("The updatePhoto.php endpoint is not available. Comments cannot be saved.");
                        } else {
                            throw new Error("Error saving comment: " + error);
                        }
                    }
                });
            })
            .then(() => {
                resolve();
            })
            .catch(error => {
                reject(error);
            });
    });
}

/**
 * Determines if a post has valid data format
 * @param {Object} backendData - Raw data from backend
 * @returns {boolean} Whether the post data is valid
 */
function isValidPost(backendData) {
    // If data lacks an ID or source, it's definitely not valid
    if (!backendData || !backendData.id || !backendData.src) {
        return false;
    }
    
    // For gallery view where description isn't included, consider valid
    if (!backendData.hasOwnProperty('description')) {
        return true;
    }
    
    // If we have a description field, validate its format
    if (!backendData.description) {
        return false;
    }
    
    try {
        // Try parsing as JSON
        JSON.parse(backendData.description);
        return true;
    } catch (e) {
        // If JSON parsing fails, check if it's a legacy format
        const parts = backendData.description.split('%');
        return parts.length >= 1 && parts[0].trim().length > 0;
    }
}


/**
 * handles the filtering functionality 
 */
function tagFiltering() {
    const tagItems = document.querySelectorAll('.tag-item');
    const searchInput = document.getElementById('search');
    const selectedTagsContainer = document.getElementById('selected-tags');

    const $tn_col1 = $("#col1");
    const $tn_col2 = $("#col2");
    const $tn_col3 = $("#col3");
    
    // filtering
    let selectedTags = [];
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            // finds all the tags & their categories
            const tagItems = document.querySelectorAll('.tag-item');
            const tagCategories = document.querySelectorAll('.tag-category');
            
            // fliters through tags 
            tagItems.forEach(tagItem => {
                const tagText = tagItem.textContent.toLowerCase();
                if (searchTerm === '' || tagText.includes(searchTerm)) {
                    tagItem.style.display = 'block';
                } else {
                    tagItem.style.display = 'none';
                }
            });
            
            // hides categories with no tags after filter
            tagCategories.forEach(category => {
                const visibleTags = category.querySelectorAll('.tag-item[style="display: block;"]');
                if (visibleTags.length === 0 && searchTerm !== '') {
                    category.style.display = 'none';
                } else {
                    category.style.display = 'block';
                }
            });
        });
    }
    
    // handling to selection
    tagItems.forEach(tagItem => {
        tagItem.addEventListener('click', function() {
            const tagName = this.textContent.trim();
            
            if (this.classList.contains('selected')) {
                // remove tag
                this.classList.remove('selected');
                selectedTags = selectedTags.filter(tag => tag !== tagName);
                const selectedTag = document.querySelector(`.selected-tag[data-tag="${tagName}"]`);
                    if (selectedTag) {
                        selectedTag.remove();
                    }
            } else {
                // add tag to list
                this.classList.add('selected');
                selectedTags.push(tagName);
                addSelectedTag(tagName, this);
            }
            
            // filter gallery based on tag filter slection
            if (selectedTags.length > 0) {
                filterGalleryByTags(selectedTags);
            } else {
                // if none, show all
                fetchPhotos();
            }
        });
    });
    
    /**
     * Adds a tag to the selected tags section
     * @param {string} tagName - The tag to add
     */
    function addSelectedTag(tagName) {
        if (!document.querySelector(`.selected-tag[data-tag="${tagName}"]`)) {
            const tagElement = document.createElement('div');
            tagElement.className = 'selected-tag';
            tagElement.dataset.tag = tagName;
            tagElement.innerHTML = `${tagName} <span class="remove-tag">&times;</span>`;
            
            // removing selected tags 
            tagElement.querySelector('.remove-tag').addEventListener('click', function() {
                tagElement.remove();
                selectedTags = selectedTags.filter(tag => tag !== tagName);
                const tagItems = document.querySelectorAll('.tag-item');
                tagItems.forEach(item => {
                    if (item.textContent.trim() === tagName) {
                        item.classList.remove('selected');
                    }
                });
                
                // if no tags selected, show all
                if (selectedTags.length === 0) {
                    fetchPhotos();
                } else {
                    // filter gallery with the selcted tags
                    filterGalleryByTags(selectedTags);
                }
            });
            
            selectedTagsContainer.appendChild(tagElement);
        }
    }
    
    /**
     * Filters gallery by selected tags
     * @param {Array} tags - Array of selected tag names
     */
    function filterGalleryByTags(tags) {
        $tn_col1.empty();
        $tn_col2.empty();
        $tn_col3.empty();
        
        $(".search-message").remove();
        
        // gets all photos
        $endpoint = $path_to_backend + 'getPhotos.php?grp_id=' + $grp_id;
        $.getJSON($endpoint, function(photoList) {
            if (!photoList || photoList.length === 0) {
                $tn_col1.append('<div class="no-posts">No posts found</div>');
                return;
            }
            
            console.log("Filtering " + photoList.length + " photos by tags:", tags);
            
            // stores photos that match the tag
            let matchedPhotos = [];
            let photosProcessed = 0;
            
        
            function handleTagFiltering() {
                console.log("Tag filtering complete, found " + matchedPhotos.length + " matches");
                
                // show message if none found, but still show full gallery
                if (matchedPhotos.length === 0) {
                    $("#column_section").before(
                        '<div class="no-posts search-message">No posts match the selected tags. Showing all photos.</div>'
                    );
                    sortImagesIntoColumns(photoList, $tn_col1, $tn_col2, $tn_col3);
                } else {
                    // show the photos that match to slected tags
                    sortImagesIntoColumns(matchedPhotos, $tn_col1, $tn_col2, $tn_col3);
                }
            }
            
            // gets all photo details to chekc against selected tags
            photoList.forEach(function(photo) {
                const endpoint = $path_to_backend + 'viewPhoto.php?id=' + photo.id;
                $.getJSON(endpoint, function(detailData) {
                    const photoDets = {
                        ...photo,
                        description: detailData[0]?.description || ""
                    };
                    
                    // parse photo dets
                    const postData = parsePostData(photoDets);
                    
                    // checks if selected tags match any in the gallery
                    const isMatch = tags.some(tag => 
                        (postData.tag1 && postData.tag1.toLowerCase() === tag.toLowerCase()) ||
                        (postData.tag2 && postData.tag2.toLowerCase() === tag.toLowerCase())
                    );
                    
                    // add match to results if found
                    if (isMatch) {
                        matchedPhotos.push(photo);
                        console.log("Match found in photo ID: " + photo.id);
                    }
                    
                    photosProcessed++;
                    
                    // display photos that match if all processed
                    if (photosProcessed === photoList.length) {
                        handleTagFiltering();
                    }
                })
                .fail(function() {
                    console.log("Failed to load details for photo ID: " + photo.id);
                    photosProcessed++;
                    
                    // checks if all photos processed
                    if (photosProcessed === photoList.length) {
                        handleTagFiltering();
                    }
                });
            });
        })
        .fail(function() {
            $tn_col1.append('<div class="no-posts">Error loading posts</div>');
        });
    }
}