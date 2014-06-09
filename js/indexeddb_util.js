/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * Create a new indexedDB helper.
 * @constructor
 * require('utils.js')
 */
function IndexedDBUtil(options) {
  var emptyFunction = function () {
    return undefined;
  };
  options = Utils.fallbackOptions(options, {
    'dbName': '',
    'storeName': '',
    'primaryKey': '',
    'renderList': emptyFunction,
    'clearListCallback': emptyFunction,
    'onerror': function (event) {
      console.log(event);
    }
  });

  this.db = {};
  this.dbName = options.dbName;
  this.storeName = options.storeName;
  this.primaryKey = options.primaryKey;
  this.renderList = options.renderListCallback;
  this.clearList = options.clearListCallback;
  this.onerror = options.onerror;
}

/**
 * Initializes the indexedDB.
 * @param {Number} version related to the onupgradeneeded event.
 */
IndexedDBUtil.prototype.open = function (version) {
  if (!version) {
    version = 1;
  }
  var request = indexedDB.open(this.dbName, version);

  request.onupgradeneeded = (function (event) {
    var db = event.target.result;
    // A versionchange transaction is started automatically.
    event.target.transaction.onerror = this.onerror;

    if (db.objectStoreNames.contains(this.storeName)) {
      db.deleteObjectStore(this.storeName);
    }

    var objectStore = db.createObjectStore(this.storeName, {
      keyPath: this.primaryKey
    });
  }).bind(this);

  request.onsuccess = (function (event) {
    // Initial database
    this.db = event.target.result;
    this.list();
    console.log('The db just opened.');
  }).bind(this);
  request.onerror = this.onerror;
};

/**
 * Adds or updates data
 * @param {Object} data
 */
IndexedDBUtil.prototype.update = function (data) {
  var transaction = this.db.transaction([this.storeName], 'readwrite');
  var objectStore = transaction.objectStore(this.storeName);

  var request = objectStore.put(data);
  request.onsuccess = (function () {
    this.list();
  }).bind(this);
  request.onerror = function (event) {
    console.log("Error Updating: ", event);
  };
};

/**
 * Deletes a data by its time stamp.
 * @param {Number} timeStamp primary key
 */
IndexedDBUtil.prototype.delete = function (timeStamp) {
  var transaction = this.db.transaction([this.storeName], 'readwrite');
  var objectStore = transaction.objectStore(this.storeName);

  var request = objectStore.delete(timeStamp);
  request.onsuccess = (function () {
    this.list();
  }).bind(this);
  request.onerror = function (event) {
    console.log("Error Deleting: ", event);
  };
};

/**
 * Lists all data from the indexedDB.
 */
IndexedDBUtil.prototype.list = function () {
  var transaction = this.db.transaction([this.storeName], 'readonly');
  var objectStore = transaction.objectStore(this.storeName);

  var keyRange = IDBKeyRange.lowerBound(0);
  // Descending order
  var cursorRequest = objectStore.openCursor(keyRange,  'prev');
  var items = [];
  cursorRequest.onsuccess = (function (event) {
    var result = event.target.result;
    if (!!result === false) {
      return;
    }

    items.push(result.value);
    result.continue();
  }).bind(this);
  cursorRequest.onerror = this.onerror;

  transaction.oncomplete = (function () {
    this.clearList();
    this.renderList(items);
  }).bind(this);
};

