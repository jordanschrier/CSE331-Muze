/**
 * Initializes the muze board functionality
 */
function initMuzeBoard() {
    loadSavedImages();
    setupDragAndDrop();
}

/**
 * Loads any previously saved images from local storage
 */
function loadSavedImages() {
    const savedBoard = getSavedBoard();
    const $board = $("#muze-board");

    // Clear the board
    $board.empty();

    // No saved images
    if (!savedBoard || !savedBoard.items || savedBoard.items.length === 0) {
        $board.append('<div class="empty-board-message">Save images on posts to create your muze board</div>');
        return;
    }
    
    // Add the saved images to the board
    savedBoard.items.forEach((item) => {
        // Ensure any existing item with this ID is removed first
        $(`.muze-board-item[data-id="${item.id}"]`).remove();
        // Add the image to the board
        addImageToBoard(item.id, item.src, item.position, item.size);
    });
}

/**
 * Sets up drag and drop functionality for the muze board
 */
function setupDragAndDrop() {
    const $board = $("#muze-board");
    
    // Allow dropping on the board
    $board.on('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).addClass('drag-over');
    });
    
    $board.on('dragleave', function() {
        $(this).removeClass('drag-over');
    });
    
    // Handle drop events
    $board.on('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('drag-over');
        
        // Get the image data from the drag event
        const imageData = e.originalEvent.dataTransfer.getData('application/json');
        if (!imageData) return;
        
        try {
            const data = JSON.parse(imageData);
            if (data.id && data.src) {
                // Check if the image is already on the board
                if (isImageOnBoard(data.id)) {
                    console.log("Image already on board, not adding again");
                    return;
                }
                
                // Get drop position or use center if not available
                let dropX = e.originalEvent.offsetX || 0;
                let dropY = e.originalEvent.offsetY || 0;
                
                // If drop position is not valid, use board center
                if (!dropX || !dropY || dropX < 0 || dropY < 0) {
                    const boardWidth = $board.width();
                    const boardHeight = $board.height();
                    dropX = Math.max(20, (boardWidth / 2) - 140);
                    dropY = Math.max(20, (boardHeight / 2) - 140);
                }
                
                // Ensure the image will be fully visible on the board
                const boardWidth = $board.width();
                const boardHeight = $board.height();
                
                dropX = Math.min(dropX, boardWidth - 300);
                dropY = Math.min(dropY, boardHeight - 300);
                
                const position = {
                    x: Math.max(20, dropX),
                    y: Math.max(20, dropY)
                };
                
                // Default size placeholder - will be adjusted based on actual image dimensions
                const size = {
                    width: 280,
                    height: 280
                };
                
                addImageToBoard(data.id, data.src, position, size);
                saveBoard();
            }
        } catch (error) {
            console.error("Error processing dropped image:", error);
        }
    });
}

/**
 * Checks if an image is already on the board
 * @param {string} id - The image ID to check
 * @returns {boolean} Whether the image is already on the board
 */
/**
 * Checks if an image is already on the board in localStorage
 * @param {string} id - The image ID to check
 * @param {boolean} checkDomOnly - If true, only check DOM not localStorage
 * @returns {boolean} Whether the image is already on the board
 */
function isImageOnBoard(id, checkDomOnly) {
    // Check DOM if specified
    if (checkDomOnly) {
        return $(`.muze-board-item[data-id="${id}"]`).length > 0;
    }
    
    // Otherwise check localStorage
    const savedBoard = getSavedBoard() || { items: [] };
    return savedBoard.items.some(item => item.id === id);
}

/**
 * Adds an image to the muze board
 * @param {string} id - The image ID
 * @param {string} src - The image source URL
 * @param {Object} position - The position {x, y} on the board
 * @param {Object} size - The size {width, height} of the image
 */
function addImageToBoard(id, src, position, size) {
    // Special case for loading from localStorage - don't do duplicate check
    const isLoadingFromSaved = size && size.hasOwnProperty('width') && size.hasOwnProperty('height');
    
    // If we're not loading from saved state, check for duplicates
    if (!isLoadingFromSaved && isImageOnBoard(id)) {
        return;
    }
    
    // Check if the image is already in the DOM to prevent duplicate DOM elements
    if ($(`.muze-board-item[data-id="${id}"]`).length > 0) {
        return;
    }
    
    // Remove empty board message if it exists
    $(".empty-board-message").remove();
    
    const $board = $("#muze-board");
    
    // Whether this is a new image or a restored one from saved state 
    const isFromSavedState = size && size.hasOwnProperty('width') && size.hasOwnProperty('height') && 
                            size.width > 0 && size.height > 0;
    
    // Make sure we have a valid source URL
    if (!src) {
        return;
    }
    
    // Make sure the source URL is valid
    const validSrc = src.includes('http') ? src : $path_to_backend + src;
    
    // Create a draggable, resizable image element
    const $imgContainer = $("<div>")
        .addClass("muze-board-item")
        .attr("data-id", id);
    
    if (isFromSavedState) {
        // Use the exact saved dimensions and position
        $imgContainer.css({
            left: position.x + "px",
            top: position.y + "px",
            width: size.width + "px",
            height: size.height + "px"
        });
    } else {
        // Default positioning for new images
        $imgContainer.css({
            left: position.x + "px",
            top: position.y + "px",
            width: "280px", // Initial width while loading
            height: "200px"  // Initial height while loading
        });
        
        // Preload the image to get its natural dimensions
        const tempImg = new Image();
        tempImg.onload = function() {
            const imgWidth = this.width;
            const imgHeight = this.height;
            const aspectRatio = imgWidth / imgHeight;
            
            // Adjust container size based on aspect ratio while keeping the area similar
            let newWidth, newHeight;
            
            if (aspectRatio > 1) {
                // Landscape image
                newWidth = 280;
                newHeight = newWidth / aspectRatio;
            } else {
                // Portrait or square image
                newHeight = 280;
                newWidth = newHeight * aspectRatio;
            }
            
            // Update the container size
            $imgContainer.css({
                width: newWidth + "px",
                height: newHeight + "px"
            });
            
            // Center the image in its position space
            $imgContainer.css({
                left: Math.max(20, position.x - (newWidth / 2) + 140) + "px",
                top: Math.max(20, position.y - (newHeight / 2) + 140) + "px"
            });
            
            // Save the updated board after sizing
            saveBoard();
        };
        
        // Start loading the image
        tempImg.src = validSrc;
    }
    
    // Add the image (the size will be adjusted when loaded)
    const $img = $("<img>")
        .attr("src", validSrc)
        .addClass("muze-board-image");
    
    // Add remove button
    const $removeBtn = $("<button>")
        .addClass("remove-image-btn")
        .html('<img src="../assets/cross-x-icon.svg" alt="Remove" class="cross-icon">')
        .on('click', function(e) {
            e.stopPropagation();
            const imageId = $(this).parent().attr("data-id");
            
            if (imageId) {
                // Use the unified removeImageFromBoard method that handles server update too
                removeImageFromBoard(imageId, false);
                
                // Show empty message if no images left
                if ($(".muze-board-item").length === 0) {
                    $board.append('<div class="empty-board-message">Save images on posts to create your muze board</div>');
                }
            } else {
                // Just remove the DOM element if no ID available
                $(this).parent().remove();
                saveBoard();
                
                // Update UI
                updateSaveButtonsUI();
            }
        });
    
    $imgContainer.append($img, $removeBtn);
    $board.append($imgContainer);
    
    // Make the image draggable
    $imgContainer.draggable({
        containment: "parent", // Constrain movement within the board
        stack: ".muze-board-item",
        stop: function() {
            // Additional check to ensure the image is fully within the container
            const $board = $("#muze-board");
            const boardWidth = $board.width();
            const boardHeight = $board.height();
            const position = $imgContainer.position();
            const width = $imgContainer.width();
            const height = $imgContainer.height();
            
            // Ensure the item is fully within the board boundaries with padding
            // Use padding only on the left/top edges, but allow closer fit to right/bottom
            let newLeft = Math.max(20, position.left);
            newLeft = Math.min(newLeft, boardWidth - width - 5);
            
            let newTop = Math.max(20, position.top);
            newTop = Math.min(newTop, boardHeight - height - 5);
            
            // Apply position adjustments if needed
            if (newLeft !== position.left || newTop !== position.top) {
                $imgContainer.css({
                    left: newLeft + "px",
                    top: newTop + "px"
                });
            }
            
            saveBoard();
        }
    });
    
    // Make the image resizable with visible handles
    $imgContainer.resizable({
        aspectRatio: true, // Keep aspect ratio when resizing
        minWidth: 100,
        minHeight: 50, // Lower minimum height for wide images
        maxWidth: 600,
        containment: "parent", // Constrain resizing within the board
        handles: "all",
        stop: function() {
            // Ensure the image is fully within the parent container
            const $board = $("#muze-board");
            const boardWidth = $board.width();
            const boardHeight = $board.height();
            const position = $imgContainer.position();
            const width = $imgContainer.width();
            const height = $imgContainer.height();
            
            // Check if any part is outside the board and adjust if needed
            let newLeft = position.left;
            let newTop = position.top;
            
            // Check right edge - use smaller padding on right/bottom edges
            if (position.left + width > boardWidth - 5) {
                newLeft = boardWidth - width - 5;
            }
            
            // Check bottom edge
            if (position.top + height > boardHeight - 5) {
                newTop = boardHeight - height - 5;
            }
            
            // Apply position adjustments if needed
            if (newLeft !== position.left || newTop !== position.top) {
                $imgContainer.css({
                    left: Math.max(20, newLeft) + "px",
                    top: Math.max(20, newTop) + "px"
                });
            }
            
            saveBoard();
        }
    });
    
    // Set up resize handles with initial hidden state and maroon color
    $imgContainer.find(".ui-resizable-handle").css({
        "background-color": "#8C2F26", // Maroon color
        "border": "1px solid white",
        "opacity": "0" // Start hidden
    });
    
    // Create completely separate, larger but invisible hitboxes for each handle
    setTimeout(function() {
        $imgContainer.resizable("option", "helper", "ui-resizable-helper");
        
        // Add hover event handlers to show/hide all handles and hitboxes for this item only
        $imgContainer.hover(
            function() {
                // Show this item's handles and hitboxes on hover
                $(this).find(".ui-resizable-handle").css("opacity", "0.7");
                $(this).find(".resize-hitbox").show();
            },
            function() {
                // Hide this item's handles and hitboxes when not hovered
                $(this).find(".ui-resizable-handle").css("opacity", "0");
                $(this).find(".resize-hitbox").hide();
            }
        );
        
        // For each handle type, create a larger transparent hitbox
        const handleTypes = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
        handleTypes.forEach(type => {
            const $handle = $imgContainer.find(".ui-resizable-" + type);
            const $hitbox = $("<div>")
                .addClass("resize-hitbox resize-hitbox-" + type)
                .css({
                    position: "absolute",
                    width: "24px",
                    height: "24px",
                    cursor: $handle.css("cursor"),
                    backgroundColor: "transparent",
                    zIndex: 89  // Just below the actual handle
                });
            
            // Position the hitbox
            switch(type) {
                case 'n':
                    $hitbox.css({
                        top: "-12px",
                        left: "50%",
                        transform: "translateX(-50%)"
                    });
                    break;
                case 's':
                    $hitbox.css({
                        bottom: "-12px",
                        left: "50%",
                        transform: "translateX(-50%)"
                    });
                    break;
                case 'e':
                    $hitbox.css({
                        right: "-12px",
                        top: "50%",
                        transform: "translateY(-50%)"
                    });
                    break;
                case 'w':
                    $hitbox.css({
                        left: "-12px",
                        top: "50%",
                        transform: "translateY(-50%)"
                    });
                    break;
                case 'ne':
                    $hitbox.css({
                        right: "-12px",
                        top: "-12px"
                    });
                    break;
                case 'nw':
                    $hitbox.css({
                        left: "-12px",
                        top: "-12px"
                    });
                    break;
                case 'se':
                    $hitbox.css({
                        right: "-12px",
                        bottom: "-12px"
                    });
                    break;
                case 'sw':
                    $hitbox.css({
                        left: "-12px",
                        bottom: "-12px"
                    });
                    break;
            }
            
            // Add event forwarding - when hitbox is interacted with, trigger the handle
            $hitbox.on("mousedown", function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Trigger a mousedown on the actual handle
                const event = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: e.clientX,
                    clientY: e.clientY
                });
                $handle[0].dispatchEvent(event);
            });
            
            // Add hitbox to image container
            $imgContainer.append($hitbox);
            
            // Initially hide the hitbox
            $hitbox.hide();
        });
    }, 100);
}

/**
 * Saves the current board state to local storage
 */
function saveBoard() {
    const $items = $(".muze-board-item");
    const boardData = {
        items: []
    };
    
    $items.each(function() {
        const $item = $(this);
        const position = $item.position();
        
        boardData.items.push({
            id: $item.attr("data-id"),
            src: $item.find("img").attr("src"),
            position: {
                x: position.left,
                y: position.top
            },
            size: {
                width: $item.width(),
                height: $item.height()
            }
        });
    });
    
    localStorage.setItem("muze-board", JSON.stringify(boardData));
}

/**
 * Gets the saved board state from local storage
 * @returns {Object} The saved board data
 */
function getSavedBoard() {
    const savedData = localStorage.getItem("muze-board");
    if (!savedData) return null;
    
    try {
        const parsedData = JSON.parse(savedData);
        
        // Process URLs in saved items to ensure they're valid
        if (parsedData.items && parsedData.items.length > 0) {
            for (const item of parsedData.items) {
                // Fix any problematic URLs
                if (item.src && !item.src.includes('http')) {
                    item.src = $path_to_backend + item.src;
                }
                
                // Check if the URL contains a double slash in the path
                if (item.src && item.src.includes('//images/')) {
                    item.src = item.src.replace('//images/', '/images/');
                }
            }
        }
        
        return parsedData;
    } catch (error) {
        console.error("Error parsing saved board data:", error);
        return null;
    }
}

/**
 * Clears the muze board in localStorage (for debugging)
 * Can be called from the browser console with clearMuzeBoard()
 */
function clearMuzeBoard() {
    localStorage.removeItem("muze-board");
    
    // If we're on the muze board page, update the UI immediately
    if (window.location.pathname.includes("/muze-board/")) {
        // Clear DOM elements
        $("#muze-board").empty().append('<div class="empty-board-message">Save images on posts to create your muze board</div>');
    }
    
    // Update all save button states
    updateSaveButtonsUI();
    
    return false;
}

/**
 * Makes an image draggable to the muze board
 * @param {string} id - The image ID
 * @param {string} src - The image source URL
 */
function makeImageDraggable(id, src) {
    // Find the image by ID
    const $img = $(`img[id="${id}"]`);
    const $parent = $img.parent();
    
    if (!$img.length) return;
    
    // Apply draggable attributes
    $parent.attr("draggable", "true");
    
    // Check if the image is already saved to the board
    const isAlreadySaved = isImageOnBoard(id);
    
    // Remove any existing button (in case state has changed)
    $parent.find(".save-to-board-btn").remove();
    
    // Ensure parent has relative positioning
    $parent.css("position", "relative");
    
    // Create button with appropriate state
    const $saveBtn = $("<button>")
        .addClass("save-to-board-btn");
    
    if (isAlreadySaved) {
        // Already saved - show X icon
        $saveBtn
            .addClass("saved")
            .html('<img src="../assets/cross-x-icon.svg" alt="Unsave" class="cross-icon">')
            .off('click') // Remove any previous click handlers
            .on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Remove from board and update server count
                removeImageFromBoard(id, false);
                
                // Update button to add icon
                $(this)
                    .html('<img src="../assets/add-icon.svg" alt="Add" class="add-icon">')
                    .removeClass("saved");
                    
                // Force global UI update
                updateSaveButtonsUI();
            });
    } else {
        // Not saved - show add icon
        $saveBtn
            .html('<img src="../assets/add-icon.svg" alt="Add" class="add-icon">')
            .off('click') // Remove any previous click handlers
            .on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Save the image to local storage
                saveImageToBoard(id, src);
                
                // Also directly update the saved count (increment)
                updateSavedCount(id, 1);
                
                // Update button to saved state without page refresh
                $(this)
                    .html('<img src="../assets/cross-x-icon.svg" alt="Unsave" class="cross-icon">')
                    .addClass("saved");
                    
                // Force global UI update
                updateSaveButtonsUI();
            });
    }
    
    // Add button to parent
    $parent.append($saveBtn);
    
    // Handle drag start
    $parent.on("dragstart", function(e) {
        // Set the drag data with the image info
        const imageData = {
            id: id,
            src: src
        };
        
        e.originalEvent.dataTransfer.setData("application/json", JSON.stringify(imageData));
        e.originalEvent.dataTransfer.effectAllowed = "copy";
    });
}

/**
 * Updates the UI elements across the site when the board changes
 * This ensures state consistency when items are added/removed
 */
function updateSaveButtonsUI() {
    // Force immediate UI refresh
    // This is needed because sometimes the DOM updates don't reflect immediately
    setTimeout(function() {
        // Update all thumbnail buttons directly
        $(".thumbnail").each(function() {
            const $img = $(this);
            const id = $img.attr("id");
            const $parent = $img.parent();
            const $saveBtn = $parent.find(".save-to-board-btn");
            
            if ($saveBtn.length && id) {
                const isAlreadySaved = isImageOnBoard(id);
                
                if (isAlreadySaved && !$saveBtn.hasClass("saved")) {
                    $saveBtn
                        .addClass("saved")
                        .html('<img src="../assets/cross-x-icon.svg" alt="Unsave" class="cross-icon">');
                } else if (!isAlreadySaved && $saveBtn.hasClass("saved")) {
                    $saveBtn
                        .removeClass("saved")
                        .html('<img src="../assets/add-icon.svg" alt="Add" class="add-icon">');
                }
            }
        });
        
        // Update detail button if on inspo page
        if (window.location.pathname.indexOf("/inspo/") !== -1) {
            const id = getUrlParams().id;
            const $saveBtn = $(".detail-save-btn");
            
            if ($saveBtn.length && id) {
                const isAlreadySaved = isImageOnBoard(id);
                
                if (isAlreadySaved && !$saveBtn.hasClass("saved")) {
                    $saveBtn
                        .addClass("saved")
                        .html('<img src="../assets/cross-x-icon.svg" alt="Unsave" class="cross-icon"> Unsave');
                } else if (!isAlreadySaved && $saveBtn.hasClass("saved")) {
                    $saveBtn
                        .removeClass("saved")
                        .html('<img src="../assets/add-icon.svg" alt="Add" class="add-icon"> Add to board');
                }
            }
        }
    }, 100);
}

/**
 * Removes an image from the muze board
 * @param {string} id - The image ID to remove
 * @param {boolean} skipServerUpdate - If true, skip updating the server count (used when server update is handled separately)
 * @returns {boolean} Whether the removal was successful
 */
function removeImageFromBoard(id, skipServerUpdate) {
    console.log(`[DEBUG] Removing image ${id} from board, skipServerUpdate=${skipServerUpdate}`);
    
    // Load the current board
    let savedBoard = getSavedBoard() || { items: [] };
    
    // Find the image index
    const imageIndex = savedBoard.items.findIndex(item => item.id === id);
    if (imageIndex === -1) {
        return false;
    }
    
    // If we're not skipping server update, decrement the count on the server
    if (!skipServerUpdate) {
        console.log(`[DEBUG] Updating server count for image ${id}`);
        
        // Directly update the saved count using the server method
        $.getJSON($path_to_backend + 'viewPhoto.php?grp_id=' + $grp_id + '&id=' + id)
            .then(data => {
                if (!data || data.length === 0) return;
                
                const postData = parsePostData(data[0]);
                console.log(`[DEBUG] Current count for image ${id} = ${postData.savedCount}`);
                postData.savedCount = Math.max(0, (postData.savedCount || 0) - 1);
                console.log(`[DEBUG] New count for image ${id} = ${postData.savedCount}`);
                
                return $.ajax({
                    url: $path_to_backend + 'updatePhoto.php',
                    type: 'POST',
                    data: {
                        grp_id: $grp_id,
                        id: id,
                        description: writePostDataToJson(postData)
                    }
                });
            })
            .then(() => {
                console.log(`[DEBUG] Server count update successful for image ${id}`);
            })
            .catch(error => {
                console.error(`[DEBUG] Error updating server count for image ${id}:`, error);
            });
    }
    
    // Remove the image from the array
    savedBoard.items.splice(imageIndex, 1);
    
    // Save the updated board
    localStorage.setItem("muze-board", JSON.stringify(savedBoard));
    
    // Immediately update UI after saving
    updateSaveButtonsUI();
    
    // Also remove from DOM if it exists on the current page
    const domElement = $(`.muze-board-item[data-id="${id}"]`);
    if (domElement.length > 0) {
        domElement.remove();
    }
    
    // Update UI to reflect changes
    updateSaveButtonsUI();
    
    // Show empty message if no images left on the board
    if ($(".muze-board-item").length === 0 && $("#muze-board").length > 0) {
        $("#muze-board").append('<div class="empty-board-message">Save images on posts to create your muze board</div>');
    }
    
    return true;
}

/**
 * Updates the saved count for an image
 * @param {string} id - The image ID
 * @param {number} increment - Amount to change the count by (1 for add, -1 for remove)
 */
function updateSavedCount(id, increment) {
    console.log(`[DEBUG] Updating saved count for image ${id} by ${increment}`);
    
    // Update the count on the server
    updateServerSavedCount(id, increment)
        .then(() => {
            console.log(`[DEBUG] Server update successful for image ${id}, fetching latest count`);
            // After successfully updating on the server, fetch the latest count
            return fetchLatestCount(id);
        })
        .then(count => {
            console.log(`[DEBUG] Latest count for image ${id} is ${count}`);
            // Update the UI with the latest count from the server
            updateSavedCountUI(id, count);
        })
        .catch(error => {
            console.error(`[DEBUG] Error updating saved count for image ${id}:`, error);
        });
}

/**
 * Fetches the latest saved count from the server
 * @param {string} id - The image ID
 * @returns {Promise<number>} Promise that resolves with the current saved count
 */
function fetchLatestCount(id) {
    return new Promise((resolve, reject) => {
        // Fetch the photo data
        const endpoint = $path_to_backend + 'viewPhoto.php?grp_id=' + $grp_id + '&id=' + id;
        
        $.getJSON(endpoint)
            .then(data => {
                if (!data || data.length === 0) {
                    reject(new Error("Post not found"));
                    return;
                }
                
                // Parse the post data
                const postData = parsePostData(data[0]);
                resolve(postData.savedCount || 0);
            })
            .catch(error => {
                reject(error);
            });
    });
}

/**
 * Gets the saved count for an image (async)
 * @param {string} id - The image ID
 * @returns {Promise<number>} Promise that resolves with the saved count
 */
function getSavedCount(id) {
    return fetchLatestCount(id).catch(() => 0);
}

/**
 * Updates the UI to show the saved count
 * @param {string} id - The image ID
 * @param {number} count - The current save count
 */
function updateSavedCountUI(id, count) {
    // Only update if we're on the detail page for this image
    const urlParams = getUrlParams();
    if (urlParams.id !== id) return;
    
    // Get the count wrapper
    const $countWrapper = $(".count-wrapper");
    if ($countWrapper.length === 0) return;
    
    // Clear existing content
    $countWrapper.empty();
    
    // Create the saved count display
    const $countDisplay = $("<div>")
        .addClass("saved-count-display")
        .attr("data-id", id);
    
    // Add an icon
    const $icon = $("<img>")
        .attr("src", "../assets/grid-save-icon.svg")
        .attr("height", "24px")
        .addClass("saved-count-icon")
    
    $countDisplay.append($icon);
    
    // Add to the wrapper
    $countWrapper.append($countDisplay);
    
    // Update the text with the current count
    const $text = $countDisplay.find("span");
    if ($text.length) {
        if (count == 1) {
            $text.text(`${count} person saved`);
        }
        else {
            $text.text(`${count} people saved`);
        }
    } else {
        if(count == 1) {
            $countDisplay.append($("<span>").text(`${count} person saved`));
        } else {
            $countDisplay.append($("<span>").text(`${count} people saved`));
        }
    }
}

/**
 * Saves an image to the muze board without navigating
 * @param {string} id - The image ID
 * @param {string} src - The image source URL
 * @returns {boolean} Whether the image was added (true) or already existed (false)
 */
function saveImageToBoard(id, src) {
    // Load the current board
    let savedBoard = getSavedBoard() || { items: [] };
    
    // Check if the image is already on the board
    if (isImageOnBoard(id)) {
        return false;
    }
    
    // Get staggered position
    const xPos = 50 + (savedBoard.items.length * 20);
    const yPos = 50 + (savedBoard.items.length * 20);
    
    // Make sure the source URL is valid
    const validSrc = src.includes('http') ? src : $path_to_backend + src;
    
    // Instead of using a fixed size, load the image to determine proper dimensions
    const tempImg = new Image();
    tempImg.onload = function() {
        const imgWidth = this.width;
        const imgHeight = this.height;
        const aspectRatio = imgWidth / imgHeight;
        
        // Determine appropriate size based on aspect ratio
        let displayWidth, displayHeight;
        
        if (aspectRatio > 1) {
            // Landscape image
            displayWidth = 280;
            displayHeight = displayWidth / aspectRatio;
        } else {
            // Portrait or square image
            displayHeight = 280;
            displayWidth = displayHeight * aspectRatio;
        }
        
        // Add the image with calculated position and size
        savedBoard.items.push({
            id: id,
            src: validSrc,
            position: {
                x: xPos,
                y: yPos
            },
            size: {
                width: displayWidth,
                height: displayHeight
            }
        });
        
        // Save the updated board
        localStorage.setItem("muze-board", JSON.stringify(savedBoard));
        
        // Immediately update UI after saving
        updateSaveButtonsUI();
    };
    
    // Start loading the image
    tempImg.src = validSrc;
    
    // In case the image fails to load or is cached, provide a fallback timeout
    setTimeout(function() {
        // Check if the board was updated
        const currentBoard = getSavedBoard() || { items: [] };
        const wasAdded = currentBoard.items.some(item => item.id === id);
        
        if (!wasAdded) {
            // Add with default dimensions
            currentBoard.items.push({
                id: id,
                src: validSrc,
                position: {
                    x: xPos,
                    y: yPos
                },
                size: {
                    width: 280,
                    height: 200
                }
            });
            
            localStorage.setItem("muze-board", JSON.stringify(currentBoard));
            
            // Update UI to reflect changes
            updateSaveButtonsUI();
        }
    }, 500);
    
    // Update UI to reflect changes immediately
    updateSaveButtonsUI();
    
    return true;
}

/**
 * Adds a save button to the detail page image
 */
// Track if we've already initialized the saved count display
let savedCountInitialized = false;

function addSaveButtonToDetail() {
    const $img = $("#inspo-image");
    const src = $img.attr("src");
    const id = getUrlParams().id;
    
    if (!id || !src) {
        return;
    }
    
    // Make sure the source URL is complete
    let fullSrc = src;
    
    // If the URL doesn't start with http, add the backend path
    if (!src.includes('http')) {
        fullSrc = $path_to_backend + src;
    }
    
    // Structure the user-actions div with a consistent layout
    // This ensures button is always on left and counter on right
    const $descriptionDiv = $("#user-actions");
    
    // Only initialize the layout and saved count once
    if (!savedCountInitialized) {
        savedCountInitialized = true;
        
        // Clear the div to ensure consistent order
        $descriptionDiv.empty();
        
        // Add a flex container for proper layout
        const $actionContainer = $("<div>")
            .addClass("action-container")
            .css({
                "display": "flex",
                "justify-content": "space-between",
                "align-items": "center",
                "width": "100%",
                "position": "relative",
                "margin-top": "15px"
            });
        
        // Create a wrapper for the button (left side)
        const $buttonWrapper = $("<div>")
            .addClass("board-button-wrapper");
        
        // Create a wrapper for the count (right side)
        const $countWrapper = $("<div>")
            .addClass("count-wrapper");
        
        // Add both to the container in correct order
        $actionContainer.append($buttonWrapper);
        $actionContainer.append($countWrapper);
        
        // Add the container to the user-actions
        $descriptionDiv.append($actionContainer);
        
        // Show current saved count in the UI (fetch from server)
        getSavedCount(id).then(count => {
            updateSavedCountUI(id, count);
        });
    }
    
    // Get the button wrapper for adding the save button
    const $buttonWrapper = $descriptionDiv.find(".board-button-wrapper");
    
    // Check if the image is already saved to the board
    const isAlreadySaved = isImageOnBoard(id);
    
    // Clear existing button (if any)
    $buttonWrapper.empty();
    
    // Create button with appropriate state
    const $saveBtn = $("<button>")
        .addClass("save-to-board-btn detail-save-btn");
    
    if (isAlreadySaved) {
        // Already saved - show X icon and "Unsave"
        $saveBtn
            .addClass("saved")
            .html('<img src="../assets/cross-x-icon.svg" alt="Unsave" class="cross-icon"> Unsave')
            .off('click') // Remove any previous click handlers
            .on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // First, directly decrement the saved count
                console.log("UNSAVE: Directly updating count before removing from board");
                
                // Create a direct AJAX call to the server to update the count
                $.getJSON($path_to_backend + 'viewPhoto.php?grp_id=' + $grp_id + '&id=' + id)
                    .then(data => {
                        if (!data || data.length === 0) return;
                        
                        const postData = parsePostData(data[0]);
                        console.log("UNSAVE: Current count = " + postData.savedCount);
                        postData.savedCount = Math.max(0, (postData.savedCount || 0) - 1);
                        console.log("UNSAVE: New count = " + postData.savedCount);
                        
                        return $.ajax({
                            url: $path_to_backend + 'updatePhoto.php',
                            type: 'POST',
                            data: {
                                grp_id: $grp_id,
                                id: id,
                                description: writePostDataToJson(postData)
                            }
                        });
                    })
                    .then(() => {
                        console.log("UNSAVE: Count updated, now removing from board");
                        
                        // After updating the count, remove from board (skip server update as we already did it)
                        removeImageFromBoard(id, true);
                        
                        // Update button to unsaved state without page refresh
                        $(this)
                            .html('<img src="../assets/add-icon.svg" alt="Add" class="add-icon"> Add to board')
                            .removeClass("saved");
                            
                        // Force global UI update but without recreating everything
                        updateSaveButtonsUI();
                        
                        // Fetch the new count and update the UI
                        return fetchLatestCount(id);
                    })
                    .then(count => {
                        console.log("UNSAVE: Fetched new count: " + count);
                        updateSavedCountUI(id, count);
                    })
                    .catch(error => {
                        console.error("UNSAVE: Error updating count:", error);
                    });
            });
    } else {
        // Not saved - show add icon and "Add to board"
        $saveBtn
            .html('<img src="../assets/add-icon.svg" alt="Add" class="add-icon"> Add to board')
            .off('click') // Remove any previous click handlers
            .on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Save the image to local storage
                saveImageToBoard(id, fullSrc);
                
                // Also directly update the saved count (increment)
                updateSavedCount(id, 1);
                
                // Update button to saved state without page refresh
                $(this)
                    .html('<img src="../assets/cross-x-icon.svg" alt="Unsave" class="cross-icon"> Unsave')
                    .addClass("saved");
                    
                // Force global UI update but without recreating everything
                updateSaveButtonsUI();
            });
    }
    
    // Add the button to the existing button wrapper
    $buttonWrapper.append($saveBtn);
}

/**
 * Processes URL parameters to handle auto-adding images from other pages
 */
function processUrlParams() {
    const params = getUrlParams();
    
    // Check if we need to add an image
    if (params.add) {
        const id = params.add;
        
        // Prevent duplicate additions by checking if the image is already on the board
        if (isImageOnBoard(id)) {
            // Already on board, remove the 'add' parameter to prevent re-adding on refresh
            removeUrlParameter('add');
            return;
        }
        
        // Fetch the image data
        const endpoint = $path_to_backend + 'viewPhoto.php?grp_id=' + $grp_id + '&id=' + id;
        $.getJSON(endpoint, function(data) {
            if (!data || data.length === 0) return;
            
            // Ensure the source URL includes the backend path
            const src = data[0].src.includes('http') ? data[0].src : $path_to_backend + data[0].src;
            
            // Default position in the center of the board
            const $board = $("#muze-board");
            const boardWidth = $board.width();
            const boardHeight = $board.height();
            
            // Position in the center with room to adjust for aspect ratio
            const position = {
                x: Math.max(20, (boardWidth / 2) - 140),
                y: Math.max(20, (boardHeight / 2) - 140)
            };
            
            // Default size placeholder - will be adjusted based on actual image dimensions
            const size = {
                width: 280,
                height: 280
            };
            
            addImageToBoard(id, src, position, size);
            
            // Remove the 'add' parameter from the URL to prevent re-adding on refresh
            removeUrlParameter('add');
        }).fail(function() {
            // Remove parameter even if fetch fails to prevent future errors
            removeUrlParameter('add');
        });
    }
}

/**
 * Removes a parameter from the URL without page refresh
 * @param {string} paramName - The name of the parameter to remove
 */
function removeUrlParameter(paramName) {
    const url = window.location.href;
    const urlParts = url.split('?');
    
    if (urlParts.length < 2) return;
    
    const baseUrl = urlParts[0];
    let queryParams = urlParts[1].split('&');
    
    // Filter out the parameter to remove
    queryParams = queryParams.filter(param => !param.startsWith(paramName + '='));
    
    // Rebuild the URL
    const newUrl = queryParams.length > 0 
        ? baseUrl + '?' + queryParams.join('&')
        : baseUrl;
    
    // Update the URL without refreshing
    window.history.replaceState({}, document.title, newUrl);
}

/**
 * Parses URL parameters
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