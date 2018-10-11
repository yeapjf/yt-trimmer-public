// Injected function which executes trim and ui steps.
function trim() {
  // Used in player overlay ui.
  const BAR_BG = 'linear-gradient(to right, transparent {0}%, rgba(129, 236, 236, 0.40) {0}%, rgba(129, 236, 236, 0.40) {1}%, transparent {1}%)';
  const PLAYED_BG = 'linear-gradient(to right, rgba(255, 0, 0, 0.25) {0}%, #d63031 {0}%, #d63031 {1}%, rgba(255, 0, 0, 0.25) {1}%)';
  const LOADED_BG = 'linear-gradient(to right, transparent {0}%, rgba(188, 188, 188, 0.88) {0}%, rgba(188, 188, 188, 0.88) {1}%, transparent {1}%)';
  // Used as notification text.
  const TRIMMED = '<i class="material-icons">info</i>&nbsp;&nbsp;Video is trimmed. Set start and end to -1 to delete entry.';
  const UNTRIMMED = '<i class="material-icons">info</i>&nbsp;&nbsp;Video is not trimmed. Set start and end time to trim.';
  const SAVED = '<i class="material-icons">done</i>&nbsp;&nbsp;Trim successfully saved!';
  const DELETED = '<i class="material-icons">delete</i>&nbsp;&nbsp;Trim Successfully deleted!';
  const INVALID = '<i class="material-icons">report_problem</i>&nbsp;&nbsp;Invalid input, please try again.';
  const LIVE = '<i class="material-icons">report_problem</i>&nbsp;&nbsp;Unable to trim live videos.';
  // Used to select container element on page.
  const SLCTR1 = '#yt-masthead-content';
  const SLCTR2 = 'ytd-searchbox.style-scope';
  const SLCTR3 = 'div.center-content';

  let extUi = false;
  let dict = {};
  let layoutType, container, searchBar, widgetElem, statusElem, formElem,
      inputStart, inputEnd, boxElem, boxTimeOut;

  // Update extUi or dict when receiving message from content scope.
  window.addEventListener('message', event => {
    if (event.source == window && event.data.subj == 'contentUi') {
      extUi = event.data.load;
    } else if (event.source == window && event.data.subj == 'contentDict') {
      dict = event.data.load;
    }
  });

  setInterval(trimStep, 125);
  setInterval(playerStep, 125);
  onElemLoad([SLCTR1, SLCTR2, SLCTR3].join(','), initWidget);

  // Function which handles the trim logic.
  function trimStep() {
    let player = document.getElementById('movie_player');
    let vidId = null;
    let seekEnd = NaN;

    if (player) {
      vidId = player.getVideoData().video_id;
      seekEnd = player.getProgressState().seekableEnd;
    }

    // Trim video if video's trim entry exists in dict.
    if (dict[vidId] && seekEnd) {
      let currTime = player.getCurrentTime();
      let startTime = dict[vidId].sTime;
      let endTime = dict[vidId].eTime;

      if (currTime < startTime) player.seekTo(startTime);
      if (currTime >= endTime && currTime < seekEnd) player.seekTo(seekEnd);
    }
  }

  // Function which handles the player overlay ui.
  function playerStep() {
    let player = document.getElementById('movie_player');
    let vidId = null;
    let vidBar = document.querySelector('.ytp-progress-list') ||
      document.getElementById('sliderBar');
    let vidPlayed = document.querySelector('.ytp-play-progress') ||
      document.getElementById('primaryProgress');
    let vidLoaded = document.querySelector('.ytp-load-progress') ||
      document.getElementById('secondaryProgress');

    if (player) vidId = player.getVideoData().video_id;
    // Do not load player overlay ui when extUi flag is set to false.
    // Load player overlay ui only if video's trim entry exists in dict.
    if (!extUi && vidBar && vidPlayed && vidLoaded) {
      hidePlayerUi();
    } else if (dict[vidId] && player.getAdState() !== 1) {
      let vidLength = player.getDuration();
      let currTime = player.getCurrentTime();
      let loadedFrc = vidLoaded.style.transform.replace(/scaleX\((.*)\)/, '$1');
      let loadedTime = parseFloat(loadedFrc) * vidLength;
      let startTime = dict[vidId].sTime;
      let endTime = dict[vidId].eTime;
      let barStart = startTime / vidLength * 100;
      let barEnd = endTime / vidLength * 100;
      let playedStart = startTime / currTime  * 100;
      let playedEnd = 100;
      let loadedStart = startTime / loadedTime * 100;
      let loadedEnd = 100;

      if (currTime  >= endTime) playedEnd = endTime / currTime  * 100;
      if (loadedTime >= endTime) loadedEnd = endTime / loadedTime * 100;

      vidBar.style.background = BAR_BG.format(barStart, barEnd);
      vidPlayed.style.background = PLAYED_BG.format(playedStart, playedEnd);
      vidLoaded.style.background = LOADED_BG.format(loadedStart, loadedEnd);
    } else if (player) {
      hidePlayerUi();
    }

    // Function which hides all player overlay ui elements.
    function hidePlayerUi() {
      vidBar.style.background = '';
      vidPlayed.style.background = '';
      vidLoaded.style.background = '';
    }
  }

  // Function which initialises the widget ui.
  function initWidget() {
    initLayoutInfo();

    widgetElem = document.createElement('span');
    widgetElem.id = 'trim-widget';
    widgetElem.classList = layoutType;
    widgetElem.innerHTML = //
      `
        <span id="trim-status" class="tooltip-bottom"></span>
        <form id="trim-form">
            <label for="trim-start" class="trim-label">Start: </label>
            <input id="trim-start" class="trim-input" type="text" style="color: var(--yt-searchbox-text-color)" autocomplete="off" required="required" />
            <label for="trim-end" class="trim-label">End: </label>
            <input id="trim-end" class="trim-input" type="text" style="color: var(--yt-searchbox-text-color)" autocomplete="off" required="required" />
            <button id="trim-button" type="submit">Confirm</button>
        </form>
        <div id="trim-box"></div>
      `;

    container.append(widgetElem);
    // Assign top level variables for DOM elements.
    statusElem = document.getElementById('trim-status');
    formElem = document.getElementById('trim-form');
    inputStart = document.getElementById('trim-start');
    inputEnd = document.getElementById('trim-end');
    boxElem = document.getElementById('trim-box');

    initWidgetListeners();
    setInterval(widgetStep, 125);
  }

  // Function which initialises the page layout info and returns layout type.
  function initLayoutInfo() {
    if (document.querySelector(SLCTR1)) {
      layoutType = 'old-layout';
      container = document.querySelector(SLCTR1);
      searchBar = document.getElementById('masthead-search');
    } else if (document.querySelector(SLCTR2)) {
      layoutType = 'new-layout';
      container = document.querySelector(SLCTR2);
      searchBar = document.getElementById('search-form');
    } else if (document.querySelector(SLCTR3)) {
      layoutType = 'music-layout';
      container = document.querySelector(SLCTR3);
      searchBar = document.querySelector('.search-container');
    }
  }

  // Function which initialises the listeners on widget elements.
  function initWidgetListeners() {
    statusElem.onmouseover = showStatus;
    statusElem.onmouseout = hideBox;
    formElem.onsubmit = updateEntry;
    boxElem.onclick = hideBox;
    boxElem.onmouseenter = pendBox;
    boxElem.onmouseout = unpendBox;

    // Function which shows video's trim status in trim-box.
    function showStatus(event) {
      let player = document.getElementById('movie_player');
      let vidId = player.getVideoData().video_id;
      let boxHtml = 'Oops, something went wrong!';

      // Show correct status text in box based on video's trim status.
      if (dict[vidId]) boxHtml = TRIMMED;
      else boxHtml = UNTRIMMED;

      boxElem.style.background = 'rgba(42, 45, 50, 0.85)';
      boxElem.innerHTML = boxHtml
      boxElem.classList.remove('show-noti');
      boxElem.classList.add('show-status');
    }

    // Function which makes changes to trim list based on user input.
    function updateEntry(event) {
      event.preventDefault();

      let player = document.getElementById('movie_player');
      let vidId = player.getVideoData().video_id;
      let vidTitle = player.getVideoData().title;
      let vidLength = player.getDuration();
      let startTime = timeToSec(inputStart.value, vidLength);
      let endTime = timeToSec(inputEnd.value, vidLength);

      // Disallow trimming of live videos. Handle deletion, addition, and
      // updation of trim entries. Reject bad inputs.
      if (player.getVideoData.isLive) {
        showNoti(3);
      } else if (startTime == -1 && endTime == -1) {
        showNoti(1);
        delete dict[vidId];
        dict.lastUpdated = new Date().getTime();
        messageContent('pageDict', dict);
      } else if (startTime >= 0 && startTime <= endTime) {
        showNoti(0);
        let vidEntry = {
          'sTime': startTime,
          'eTime': endTime,
          'title': vidTitle,
          'stamp': new Date().getTime()
        };
        dict[vidId] = vidEntry;
        dict.lastUpdated = new Date().getTime();
        messageContent('pageDict', dict);
      } else {
        showNoti(2);
      }

      // Clear input field after submission.
      inputStart.value = '';
      inputEnd.value = '';

      // Function which sets the styles and displays notifications on trim-box.
      function showNoti(code) {
        let boxBgrd = 'transparent';
        let boxHtml = 'Oops, something went wrong!';

        if (code == 0) {
          boxBgrd = 'rgba(46, 213, 115, 0.85)';
          boxHtml = SAVED;
        } else if (code == 1) {
          boxBgrd = 'rgba(214, 48, 49, 0.85)';
          boxHtml = DELETED;
        } else if (code == 2) {
          boxBgrd = 'rgba(253, 203, 110, 0.85)';
          boxHtml = INVALID;
        } else if (code == 3) {
          boxBgrd = 'rgba(253, 203, 110, 0.85)';
          boxHtml = LIVE;
        }

        boxElem.style.background = boxBgrd;
        boxElem.innerHTML = boxHtml
        boxElem.classList.remove('show-status');
        boxElem.classList.add('show-noti');

        clearTimeout(boxTimeOut);
        boxTimeOut = setTimeout(hideBox, 1250);
      }
    }

    // Function which hides trim-box.
    function hideBox(event) {
      boxElem.classList.remove('show-status', 'show-noti');
    }

    // Function which clears timeout event on trim-box.
    function pendBox(event) {
      clearTimeout(boxTimeOut);
    }

    // Function which sets timeout event on trim-box.
    function unpendBox(event) {
      boxTimeOut = setTimeout(hideBox, 1250);
    }
  }

  // Function which handles the widget ui.
  function widgetStep() {
    let player = document.getElementById('movie_player');
    let vidId = null;
    let vidLength = NaN;

    if (player) {
      vidId = player.getVideoData().video_id;
      vidLength = player.getDuration();
    }
    // Do not load widget ui when extUi flag is set to false, and when no
    // video is playing.
    if (!extUi && widgetElem) {
      widgetElem.style.display = 'none';
    } else if (!vidId || !vidLength) {
      hideWidget();
    } else {
      let ctWidth = container.offsetWidth;
      let sbWidth = searchBar.offsetWidth;
      let wgWidth = widgetElem.offsetWidth;

      if (!container || !searchBar) {
        hideWidget();
      } else if (layoutType == 'music-layout') {
        if (sbWidth > ctWidth / 2 || window.innerWidth < 860) {
          hideWidget();
        } else {
          showWidget();
        }
      } else if (ctWidth - sbWidth < wgWidth) {
        hideWidget();
      } else {
        showWidget();
      }
      // Display trimmed times as input fields placeholders if video is
      // trimmed. Otherwise, set placeholders to mm:ss
      if (dict[vidId]) {
        inputStart.placeholder = secToTime(dict[vidId].sTime);
        inputEnd.placeholder = secToTime(dict[vidId].eTime);
        statusElem.style.background = '#2ecc71';
      } else {
        inputStart.placeholder = 'mm:ss';
        inputEnd.placeholder = 'mm:ss';
        statusElem.style.background = '#888888';
      }
    }

    // Function which makes the widget visible.
    function showWidget() {
      widgetElem.style.display = '';
      widgetElem.style.visibility = 'visible';
      widgetElem.style.opacity = 1;
      widgetElem.style.pointerEvents = '';
    }

    // Function which hides the widget.
    function hideWidget() {
      widgetElem.style.opacity = 0;
      widgetElem.style.pointerEvents = 'none';
      boxElem.classList.remove('show-status', 'show-noti');
    }
  }

  // Function which sends message to content scope.
  function messageContent(subj, load) {
    window.postMessage({
      subj: subj,
      load: load
    }, '*');
  }

  // Auxiliary function which executes callback when selected element is loaded.
  function onElemLoad(selector, callback) {
    if (document.querySelector(selector)) {
      callback();
    } else {
      setTimeout(() => { onElemLoad(selector, callback); }, 100);
    }
  }

  // Auxiliary function which replaces parts of String with formatted data.
  String.prototype.format = function() {
    let args = arguments;
    return this.replace(/{(\d+)}/g, (match, number) => (
      typeof args[number] != 'undefined' ? args[number] : match
    ));
  }
}
