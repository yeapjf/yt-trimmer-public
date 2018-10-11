const CONFIG = {
  apiKey: 'AIzaSyDzxE2FdxB4vJNaxmdCus7vyNBc9RaJQ-M',
  authDomain: 'trimmer-d839f.firebaseapp.com',
  databaseURL: 'https://trimmer-d839f.firebaseio.com'
};
const STO = chrome.storage;

firebase.initializeApp(CONFIG);
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

document.addEventListener('DOMContentLoaded', function() {
  let extUiOption    = document.getElementById('ext-ui-option');
  let authIcon       = document.getElementById('auth-icon');
  let authStatus     = document.getElementById('auth-status');
  let showListButton = document.getElementById('show-list-button');
  let signInButton   = document.getElementById('sign-in-out-button');
  let user           = 'Signed In';

  STO.onChanged.addListener(function(changes) {
    for (let key in changes) {
      if (key === 'auth') {
        let newVal = changes[key].newValue;
        user = newVal;
        if (newVal) authChange(0);
        else authChange(-1);
      }
    }
  });

  STO.local.get('extUi', (result) => { extUiOption.checked = result['extUi']; });
  STO.local.get('auth', function(result) {
    user = result['auth'];
    if (result['auth']) authChange(0);
    else authChange(-1);
  });

  extUiOption.onclick    = toggleExtUi;
  showListButton.onclick = showList;
  signInButton.onclick   = startSignIn;

  function authChange(status) {
    signInButton.disabled    = false;
    signInButton.classList.remove('is-loading');
    if (status === 0) {
      authIcon.innerHTML       = 'cloud_done';
      authIcon.style.color     = '#00C853';
      authStatus.innerHTML     = user;
      authStatus.title         = 'User ' + user + ' signed into YouTube Trimmer'
      signInButton.style.color = '#E53935';
      signInButton.innerHTML   = 'Sign Out'
      signInButton.classList.replace('is-success', 'is-danger');
    }
    else if (status === -1) {
      authIcon.innerHTML       = 'cloud_off';
      authIcon.style.color     = '#E53935';
      authStatus.innerHTML     = 'Signed Out';
      authStatus.title         = 'No user is signed into YouTube Trimmer'
      signInButton.style.color = '#00C853';
      signInButton.innerHTML   = 'Sign In'
      signInButton.classList.replace('is-danger', 'is-success');
    }
  }

  function changePlayerUi(event) {
    let playerUiOption = document.getElementById('player-ui-option');
    let checked        = playerUiOption.checked;
    STO.local.set({ 'playerUi': checked });
  }

  function toggleExtUi(event) {
    let checked = extUiOption.checked;
    STO.local.set({ 'extUi': checked });
  }

  function showList(event) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'showList' });
      close();
    });
  }

  function startSignIn() {
    signInButton.disabled = true;
    signInButton.classList.add('is-loading');
    if (firebase.auth().currentUser) {
      firebase.auth().signOut();
    } else {
      startAuth(true);
    }
  }

  function startAuth(interactive) {
    // Request an OAuth token from the Chrome Identity API.
    chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {
      if (chrome.runtime.lastError && !interactive) {
        console.log('It was not possible to get a token programmatically.');
      } else if(chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else if (token) {
        // Authorize Firebase with the OAuth Access Token.
        let credential = firebase.auth.GoogleAuthProvider.credential(null, token);
        firebase.auth().signInAndRetrieveDataWithCredential(credential).catch(function(error) {
          // The OAuth token might have been invalidated. Lets' remove it from cache.
          if (error.code === 'auth/invalid-credential') {
            chrome.identity.removeCachedAuthToken({token: token}, function() {
              startAuth(interactive);
            });
          }
        });
      } else {
        console.error('The OAuth Token was null');
      }
    });
  }
});
