const STO = browser.storage;
const BASE_SRC = browser.runtime.getURL('css/base.css');
const TIME_SRC = browser.runtime.getURL('utils/time-conversion.js');
const MAIN_STMT = [[trim, FN_EXEC]];

document.addEventListener('DOMContentLoaded', () => {
  let auth, extUi, dict;
  let targetOrigin = window.location.protocol + '//' + window.location.hostname;

  injectCssSrc('https://fonts.googleapis.com/icon?family=Material+Icons');
  injectCssSrc(BASE_SRC);
  injectJsSrc(TIME_SRC);
  injectJs(MAIN_STMT);
  initStorage();

  // Update dict when receiving message from page scope.
  window.addEventListener('message', event => {
    if (event.source == window && event.data.subj == 'pageDict') {
      dict = event.data.load;
      let dictType = 'localDict';
      if (auth) dictType = 'cloudDict';
      STO.local.set({[dictType]: dict});
    }
  });

  // Handle message to show modal.
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let modalElem = document.getElementById('trim-modal');
    if (request.action == 'showList') {
      /* modalElem.classList.add('modal-visible'); */
      console.log(dict);
    } else {
      console.log('Modal not loaded yet!');
    }
  });

  // Listen for changes in storage and send message to page scope.
  STO.onChanged.addListener(changes => {
    let authKey = 'auth';
    let extUiKey = 'extUi';
    let dictKeys = ['localDict', 'cloudDict'];
    let authChg = uiChg = dictChg = false;

    for (let key in changes) {
      let nv = changes[key].newValue;
      if (key == authKey) {
        auth = nv;
        authChg = true;
      } else if (key == extUiKey) {
        extUi = nv;
        uiChg = true;
      } else if (dictKeys.includes(key) && nv.lastUpdated != dict.lastUpdated) {
        dict = nv;
        dictChg = true;
      }
    }

    if (authChg) updateDict(auth);
    if (uiChg) messagePage('contentUi', extUi);
    if (dictChg) messagePage('contentDict', dict);
  });

  // Function which initialises variables based on storage.
  function initStorage() {
    STO.local.get(['auth', 'extUi']).then(result => {
      auth = result.auth;
      extUi = result.extUi;
      updateDict(auth);
      messagePage('contentUi', extUi);
    });
  }

  // Function which updates dict on storage change.
  function updateDict(authState) {
    let dictType = 'localDict';
    if (authState) dictType = 'cloudDict';
    STO.local.get(dictType).then(result => {
      dict = result[dictType];
      messagePage('contentDict', dict);
    });
  }

  // Function which sends message to page scope.
  function messagePage(subj, load) {
    window.postMessage({
      subj: subj,
      load: load
    }, targetOrigin);
  }
});
