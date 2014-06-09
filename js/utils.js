/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * Utilities, singleton object
 * @return {Object} utilities
 */
var Utils = (function (window, document, undefined) {
  /**
   * Convert Data URI to blob.
   * Via http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
   * Via https://github.com/blueimp/JavaScript-Canvas-to-Blob/blob/master/js/canvas-to-blob.js
   */
  function blobFromDataURI(dataURI) {
    // Convert base64 to raw binary data held in a string.
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
      byteString = atob(dataURI.split(',')[1]);
    } else {
      // URLEncoded DataURIs
      byteString = unescape(dataURI.split(',')[1]);
    }

    // Write the bytes of the string to an ArrayBuffer.
    var arrayBuffer = new ArrayBuffer(byteString.length);
    var intArray = new Uint8Array(arrayBuffer);
    for (var i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }

    // Separate out the mime component.
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // Write the ArrayBuffer (or ArrayBufferView) to a blob.
    return new Blob([intArray], {type : mimeString});
  }

  /**
   * Fallback the options with default values.
   */
  function fallbackOptions(options, defaultOptions) {
    var mergedOptions = {};
    for (var key in defaultOptions) {
      if (defaultOptions.hasOwnProperty(key)) {
        mergedOptions[key] = defaultOptions[key];
      }
    }
    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        mergedOptions[key] = options[key];
      }
    }

    return mergedOptions;
  }

  /**
   * Format the input string, replace curly braces with responding variables.
   * Via http://joquery.com/2012/string-format-for-javascript
   */
  function format() {
    // The string containing the format items (e.g. "{0}")
    // will and always has to be the first argument.
    var string = arguments[0];
    // Start with the second argument (i = 1)
    for (var i = 1; i < arguments.length; i++) {
      // "gm" = RegEx options for Global search (more than one instance)
      // and for Multiline search.
      var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
      string = string.replace(regEx, arguments[i]);
    }

    return string;
  }

  return {
    blobFromDataURI: blobFromDataURI,
    fallbackOptions: fallbackOptions,
    format: format
  };
})(this, document);

