/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * Singleton object that handles all miscellaneous methods related to the app.
 * require('requests.js')
 * require('utils.js')
 * require('indexeddb_util.js')
 * require('activities.js')
 */
var TapNote = (function (window, document, undefined) {
  /**
   * Returns an empyt note.
   */
  function emptyNote() {
    return {
      'title': '',
      'text': '',
      'posterBlob': undefined,
      'timeStamp': undefined
    };
  }

  var tapNoteDB;
  var currentNote = emptyNote();

  var tableView = document.getElementById('note-table');
  var detailView = document.getElementById('note-detail');
  var appbarTitle = document.getElementById('appbar-title');
  var title = document.getElementById('note-title');
  var text = document.getElementById('note-text');
  var poster = document.getElementById('note-poster');
  var deleteButton = document.getElementById('delete');
  var saveButton = document.getElementById('save');
  var transitionToDetailViewListener;

  /**
   * Initializes the app's settings,
   * including open the indexedDB and set up events.
   */
  function init(event) {
    tapNoteDB = new IndexedDBUtil({
      'dbName': 'notes',
      'storeName': 'note',
      'primaryKey': 'timeStamp',
      'renderListCallback': renderNotes,
      'clearListCallback': function () {
        var list = document.getElementById('note-list');
        var itemCollection = list.getElementsByTagName('li');
        var items = Array.prototype.slice.call(itemCollection);
        for (var i = 0; i < items.length; i++) {
          items[i].removeEventListener('click',
                                       transitionToDetailViewListener);
        }

        list.innerHTML = '';
      }
    });
    tapNoteDB.open();

    addEvents();
    setUpCamera();

    event.stopPropagation();
    window.removeEventListener('DOMContentLoaded', init);
  }
  window.addEventListener('DOMContentLoaded', init);

  /**
   * Renders all notes on the table view.
   * @param {Array} notes
   */
  function renderNotes(notes) {
    var ul = document.createElement('ul');
    notes.forEach(function (note) {
      ul.appendChild(renderNote(note));
    });

    ul.classList.add('overflow-visible');
    document.getElementById('note-list').appendChild(ul);
  }

  /**
   * Renders a note dynamically with a click event.
   * @param {Object} note
   */
  function renderNote(note) {
    var li = document.createElement('li');
    var polaroid = document.createElement('div');
    var img = document.createElement('img');
    var p = document.createElement('p');
    var titleText = document.createTextNode(note.title);
    transitionToDetailViewListener = function (event) {
      console.log('clicked note timeStamp: ' + note.timeStamp);
      transitionToDetailView(note);

      event.stopPropagation();
    };

    if (note.posterBlob) {
      var src = window.URL.createObjectURL(note.posterBlob);
      img.addEventListener('load', function loadListener() {
        window.URL.revokeObjectURL(src);
        img.removeEventListener('load', loadListener);
      });
      img.src = src;
    }

    polaroid.classList.add('polaroid');
    li.addEventListener('click', transitionToDetailViewListener);
    img.classList.add('border-top-radius');

    p.appendChild(titleText);
    polaroid.appendChild(img);
    polaroid.appendChild(p);
    li.appendChild(polaroid);

    return li;
  }

  /**
   * Saves or updates the current note, then back to the table view.
   */
  function updateNote() {
    var currentTime = new Date().getTime();
    tapNoteDB.update({
      'title': title.value || title.placeholder,
      'text': text.value,
      'posterBlob': currentNote.posterBlob ? currentNote.posterBlob : '',
      'timeStamp': currentNote.timeStamp ? currentNote.timeStamp : currentTime
    });

    transitionToTableView();
  }

  /**
   * Deletes the current note, then back to the table view.
   */
  function deleteNote() {
    if (!currentNote || !currentNote.timeStamp) {
      alert('Error occurs while trying to delete an note.');
      return;
    }
    tapNoteDB.delete(currentNote.timeStamp);

    transitionToTableView();
  }

  /**
   * Transition to the table view, and reset content on the detail view.
   */
  function transitionToTableView() {
    performTransition(detailView, tableView);

    resetContent();
  }

  /**
   * Transition to the detail view.
   * Requests the reversed geocode for the new noter;
   * otherwise, load clicked note content on the detail view.
   * @param {Object} note
   */
  function transitionToDetailView(note) {
    if (!note) {
      // Customizes some icons for the new note.
      appbarTitle.classList.remove('invisible');
      deleteButton.classList.add('hidden');
      saveButton.textContent = 'Save';

      getGeolocation();
    } else {
      appbarTitle.classList.add('invisible');
      deleteButton.classList.remove('hidden');
      saveButton.textContent = 'Update';

      title.value = note.title;
      text.value = note.text;
      if (note.posterBlob) {
        var src = window.URL.createObjectURL(note.posterBlob);
        poster.addEventListener('load', function loadListener() {
          window.URL.revokeObjectURL(src);
          poster.removeEventListener('load', loadListener);
        });
        poster.src = src;
      }
      currentNote = note;
    }

    performTransition(tableView, detailView);
  }

  /**
   * Performs the transition by toggling the hidden class.
   * @param {HTMLElement} soucreView
   * @param {HTMLElement} destinationView
   */
  function performTransition(sourceView, destinationView) {
    destinationView && destinationView.classList.remove('hidden');
    sourceView && sourceView.classList.add('hidden');
  }

  /**
   * Resets the current note and the detail view's content.
   */
  function resetContent() {
    currentNote = emptyNote();

    title.value = '';
    title.placeholder = 'Note';
    text.value = '';
    text.placeholder = '...';
    poster.src = 'app://:0/';
  }

  /**
   * Adds all buttons' click events.
   * Stops propagation or prevents default interaction if necessary.
   */
  function addEvents() {
    var addButton = document.getElementById('add');
    var cancelButton = document.getElementById('cancel');
    var dialog = document.getElementById('delete-dialog');
    var cancelDeleteButton = document.getElementById('cancel-delete');
    var confirmDeleteButton = document.getElementById('confirm-delete');

    addButton.addEventListener('click', function (event) {
      transitionToDetailView();

      event.stopPropagation();
    });

    cancelButton.addEventListener('click', function (event) {
      transitionToTableView();

      event.stopPropagation();
    });
    deleteButton.addEventListener('click', function (event) {
      performTransition(null, dialog);

      event.stopPropagation();
    });
    saveButton.addEventListener('click', function (event) {
      updateNote();

      event.stopPropagation();
    });

    cancelDeleteButton.addEventListener('click', function (event) {
      event.preventDefault();
      performTransition(dialog, null);

      event.stopPropagation();
    });
    confirmDeleteButton.addEventListener('click', function (event) {
      event.preventDefault();
      performTransition(dialog, null);
      deleteNote();

      event.stopPropagation();
    });
  }

  /**
   * Talks to camera by Web activity.
   * Adds the camera button's click event.
   * Automatically resizes and compresses the image from camera
   * by an off-screen canvas.
   */
  function setUpCamera() {
    var cameraButton = document.getElementById('camera');
    cameraButton.addEventListener('click', function (event) {
      Activities.getBlobFromPickActivity()
        .then(Activities.resizeBlob)
        .then(loadBlob);

      event.stopPropagation();
    });
  }

  /**
   * Uses the resized image blob URL object to create the poster as an URL.
   * @param {Blob} blob resized image blob
   */
  function loadBlob(resizedBlob) {
    currentNote.posterBlob = resizedBlob;
    // File {size: 100, type: 'image/png', name: ''...}
    console.log('Resized blob: ', resizedBlob);

    var src = window.URL.createObjectURL(resizedBlob);
    poster.addEventListener('load', function loadListener() {
      window.URL.revokeObjectURL(src);
      poster.removeEventListener('load', loadListener);
    });
    poster.src = src;
  }

  /**
   * Gets the geolocation by HTML5's nvaigator.
   * Do reverse geocoding while the geolocation.
   */
  function getGeolocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    function success(position) {
      var latitude  = position.coords.latitude;
      var longitude = position.coords.longitude;

      console.log('Latitude is ' + latitude + '° ' +
                  'Longitude is ' + longitude + '°');

      // FIXME: refactor here
      reverseGeocoding(latitude, longitude);
    }

    function error() {
      alert('Unable to retrieve your location.');
    }

    navigator.geolocation.getCurrentPosition(success, error);
  }

  /**
   * Google reverse geocoding request.
   */
  function reverseGeocoding(latitude, longitude) {
    var API_KEY = 'AIzaSyB-v0tp2N5uRPn2bYmiNGIR-XrBpMzhUm0';
    var GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/';
    var uri = Utils.format('{0}json?latlng={1},{2}&sensor=true&key={3}',
                           GEOCODE_URL,
                           latitude,
                           longitude,
                           API_KEY);
    Requests.getJSON(uri).then(function (json) {
      if (!json.results.length) {
        console.log('Got nothing from the URI: ', uri);
      } else {
        // In case the user is editing.
        if (!title.value) {
          title.placeholder = 'Note from ' + json.results[0].formatted_address;
        }

        console.log('Current Address: ', json.results[0].formatted_address);
      }
    });
  }
})(this, document);

