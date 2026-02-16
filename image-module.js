// ImageModule for docxtemplater v3.38.0 - proper implementation
(function(global) {
    'use strict';

    function ImageModule(options) {
        options = options || {};
        this.centered = options.centered !== false;
        this.fileType = options.fileType || 'docx';
    }

    // Parse method - identifies image placeholders (prefixed with %)
    ImageModule.prototype.parse = function(placeHolderContent) {
        if (placeHolderContent && placeHolderContent.charAt(0) === '%') {
            return {
                type: 'image',
                value: placeHolderContent.substring(1)
            };
        }
        return null;
    };

    // Replace method - processes image data
    ImageModule.prototype.replace = function(tagValue, tagInformation) {
        return;
    };

    // getReplacement method - returns the image element
    ImageModule.prototype.getReplacement = function(tagValue, tagInformation, docUtils) {
        if (!tagValue || typeof tagValue !== 'object') {
            return docUtils.createParagraph('');
        }

        let imageData = tagValue;
        let buffer = imageData.data;

        // Convert base64 string to buffer if needed
        if (typeof buffer === 'string') {
            if (buffer.startsWith('data:')) {
                // Handle data URL
                buffer = buffer.split(',')[1];
            }
            // Convert base64 to binary string then to array
            let binaryString = atob(buffer);
            let bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            buffer = bytes;
        }

        let width = imageData.width || 1828800;   // EMU units
        let height = imageData.height || 914400;  // EMU units
        let type = imageData.type || 'image/png';

        // Get media type for DOCX
        let mediaType = 'image/png';
        if (type.includes('jpeg') || type.includes('jpg')) {
            mediaType = 'image/jpeg';
        } else if (type.includes('gif')) {
            mediaType = 'image/gif';
        }

        // Create image element for docxtemplater
        let img = {
            type: 'image',
            rIdResolver: true,
            inlineShape: true,
            data: buffer,
            width: width,
            height: height,
            mediaType: mediaType
        };

        // Return image wrapped in a paragraph
        let paragraph = docUtils.createParagraph([]);
        paragraph.push(img);
        
        return [paragraph];
    };

    // onLoop and onResolve for array handling
    ImageModule.prototype.onLoop = function() {
        return this;
    };

    ImageModule.prototype.onResolve = function() {
        return this;
    };

    // Expose to window
    global.ImageModule = ImageModule;
    console.log('✅ ImageModule loaded successfully');

})(window);
