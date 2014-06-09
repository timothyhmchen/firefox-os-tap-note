/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * Singleton object that promisifies XMLHttpRequest.
 * @return {Object} Asynchronous JSON request
 */
var Requests = (function (window, document, undefined) {
  /**
   * Promisifying XMLHttpRequest
   * @return {Promise} promise with the response
   */
  function get(url) {
    return new Promise(function (resolve, reject) {
      var req = new XMLHttpRequest();
      req.open('GET', url);

      req.onload = function () {
        if (req.status === 200) {
          resolve(req.response);
        } else {
          reject(Error(req.statusText));
        }
      };

      req.onerror = function () {
        reject(Error("Network Error"));
      };

      req.send();
    });
  }

  /**
   * Asynchronous JSON request
   */
  function getJSON(url) {
    return get(url).then(JSON.parse).catch(function (err) {
      console.log("getJSON failed for", url, err);
      throw err;
    });
  }

  return {
    getJSON: getJSON
  };
})(this, document);

