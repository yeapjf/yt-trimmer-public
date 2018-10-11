const STO       = chrome.storage;
const BASE_SRC  = chrome.runtime.getURL('css/base.css');
const TIME_SRC  = chrome.runtime.getURL('utils/time-conversion.js')
const MAIN_STMT = [[trim, FN_EXEC]];

document.addEventListener('DOMContentLoaded', function() {
  let auth, extUi, dict;

  injectCssSrc('https://fonts.googleapis.com/icon?family=Material+Icons');
  injectCssSrc(BASE_SRC);
  injectJsSrc(TIME_SRC);
  injectJs(MAIN_STMT);
  setupDict();
  setupUi();

  window.addEventListener('message', function(event) {
    if (event['source'] == window && event.data['subj'] == 'pageDict') {
      dict = event.data['load'];
      let dictType = 'localDict';
      if (auth) dictType = 'cloudDict';
      STO.local.set({ [dictType]: dict });
    }
  });

  /* Handle message to show modal. */
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    let modalElem = document.getElementById('trim-modal');
    if (request.action == 'showList') {
      // modalElem.classList.add('modal-visible');
      console.log(dict);
    }
    else console.log('Modal not loaded yet!');
  });

  /* Listen for changes in storage and send message to page level code. */
  STO.onChanged.addListener(function(changes) {
    let authKey  = 'auth';
    let extUiKey = 'extUi';
    let dictKeys = ['localDict', 'cloudDict'];
    let authChg  = uiChg = dictChg = false;

    for (let key in changes) {
      let newVal = changes[key].newValue;
      if (key == authKey) {
        auth    = newVal;
        authChg = true;
      }
      else if (key == extUiKey) {
        extUi = newVal;
        uiChg = true;
      }
      else if (dictKeys.includes(key) &&
               newVal['lastUpdated'] != dict['lastUpdated']) {
        dict    = newVal;
        dictChg = true;
      }
    }

    if (authChg) updateDict(auth);
    if (uiChg) messagePage('contentUi', extUi);
    if (dictChg) messagePage('contentDict', dict);
  });

  function setupDict() {
    STO.local.get('auth', (res) => {
      auth = res['auth'];
      updateDict(auth);
    });
  }

  function setupUi() {
    STO.local.get(['playerUi', 'widgetUi'], function(res) {
      extUi = res;
      messagePage('contentUi', extUi);
    });
  }

  function updateDict(authState) {
    let dictType = 'localDict';
    if (authState) dictType = 'cloudDict';
    STO.local.get(dictType, function(res) {
      dict = res[dictType];
      messagePage('contentDict', dict);
    });
  }

  function messagePage(subj, load) {
    window.postMessage({
      'subj': subj,
      'load': load
    }, 'https://www.youtube.com');
  }
});
