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
        createdAt: new Date().toISOString() // Adding timestamp for future sorting options
    };
    
    return JSON.stringify(jsonData);
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
                isLegacyFormat: true,
                isValid: false
            };
        }
    }
    
    return defaultData;
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