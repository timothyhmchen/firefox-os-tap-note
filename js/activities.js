/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * Web activities helpers, singleton object
 * @return {Object} web activitiy utilities
 * require('utils.js')
 */
var Activities = (function (window, document, undefined) {
  /**
   * Get the image blob from camera through web activiity.
   * @return {Promise} promise with the image blob
   */
  function getBlobFromPickActivity() {
    return new Promise(function(resolve, reject) {
      var pick = new MozActivity({
        name: 'pick',
        data: {
          type: ['image/png', 'image/jpg', 'image/jpeg']
        }
      });

      pick.onsuccess = function () {
        resolve(this.result.blob);
      };

      pick.onerror = function (event) {
        if (event.target.error &&
            event.target.error.name === 'ActivityCanceled') {

          reject();
        }

        reject(Error('There was an error retrieving the image.'));
      };
    });
  }

  /**
   * Resizes the blob/file by an off-screen canvas.
   * Limits its maximum width.
   * @param {Blob} blob incoming image blob
   * @return {Promise} promise with resized blob
   */
  function resizeBlob(blob) {
    return new Promise(function (resolve, reject) {

      var MAX_WIDTH = 300;
      var COMPRESSION_RATIO = 0.6;

      var src = window.URL.createObjectURL(blob);
      var offScreenCanvas = document.createElement('canvas');
      var image = new Image();
      image.addEventListener('load', function resize() {
        var context;
        var resizedDataURI;
        var resizedBlob;

        // Remove unused URL object ASAP.
        window.URL.revokeObjectURL(src);

        if (image.width > MAX_WIDTH) {
          image.height *= (MAX_WIDTH / image.width);
          image.width = MAX_WIDTH;
        }

        context = offScreenCanvas.getContext('2d');
        context.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);
        offScreenCanvas.width = image.width;
        offScreenCanvas.height = image.height;
        context.drawImage(image, 0, 0, image.width, image.height);

        resizedDataURI = offScreenCanvas.toDataURL('image/jpeg',
                                                   COMPRESSION_RATIO);
        resizedBlob = Utils.blobFromDataURI(resizedDataURI);

        resolve(resizedBlob);

        image.removeEventListener('load', resize);
      });
      image.src = src;
    });
  }

  return {
    getBlobFromPickActivity: getBlobFromPickActivity,
    resizeBlob: resizeBlob
  };
})(this, document);

