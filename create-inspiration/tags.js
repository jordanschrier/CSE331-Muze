/**
 * Tag Selection Functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    const tagToggle = document.getElementById('tag-toggle');
    const tagList = document.getElementById('tag-list');
    const tagSearch = document.getElementById('tag-search');
    const tagItems = document.querySelectorAll('.tag-item');
    const selectedTags = document.getElementById('selected-tags');
    const tag1 = document.getElementById('tag1');
    const tag2 = document.getElementById('tag2');
    
    // toggle for tag expandable
    tagToggle.addEventListener('click', function() {
        if (tagList.style.display === 'block') {
            tagList.style.display = 'none';
            tagToggle.innerHTML = '<i class="bi bi-plus-circle"></i>Select Tags (up to 2)';
        } else {
            tagList.style.display = 'block';
            tagToggle.innerHTML = '<i class="bi bi-dash-circle"></i>Close Tag Selection';
        }
    });

    // searching for tags in expandable
    tagSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        tagItems.forEach(item => {
            const tagName = item.dataset.tag.toLowerCase();
            if (tagName.includes(searchTerm)) {
                item.style.display = 'inline-block';
            } else {
                item.style.display = 'none';
            }
        });
    });
    
    // highlights selected tags
    function updateTagHighlights() {
        tagItems.forEach(item => {
            item.classList.remove('selected');
        });
        
        // gets the selcted tags and adds highlight to them
        const selectedElements = selectedTags.querySelectorAll('.selected-tag');
        const selectedTagNames = Array.from(selectedElements).map(el => el.dataset.name);
    
        tagItems.forEach(item => {
            if (selectedTagNames.includes(item.dataset.tag)) {
                item.classList.add('selected');
            }
        });
    }

    // select tags
    tagItems.forEach(item => {
        item.addEventListener('click', function() {
            const tagName = this.dataset.tag;
            addTag(tagName);
        });
    });
    
    // add to list
    function addTag(tagName) {
        const existingTags = selectedTags.querySelectorAll('.selected-tag');
        let isDuplicate = false;
        
        existingTags.forEach(tag => {
            if (tag.dataset.name === tagName) {
                isDuplicate = true;
            }
        });
        
        if (isDuplicate) {
            return;
        }
        
        // checks if 2 tags
        if (existingTags.length >= 2) {
            alert('You can only select up to 2 tags.');
            return;
        }
        
        // Create tag element
        const tagElement = document.createElement('div');
        tagElement.className = 'selected-tag';
        tagElement.dataset.name = tagName;
        tagElement.innerHTML = tagName + ' <span class="remove-tag">&times;</span>';
        
        // remove tags
        tagElement.querySelector('.remove-tag').addEventListener('click', function() {
            tagElement.remove();
            updateTags();
        });
        
        selectedTags.appendChild(tagElement);
        updateTags();
        updateTagHighlights();
    }
    
    // update space below with tags
    function updateTags() {
        const tags = selectedTags.querySelectorAll('.selected-tag');
        tag1.value = tags[0] ? tags[0].dataset.name : '';
        tag2.value = tags[1] ? tags[1].dataset.name : '';
    }
});