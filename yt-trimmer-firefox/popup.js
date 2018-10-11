const STO = browser.storage;

document.addEventListener('DOMContentLoaded', () => {
  let user = 'Signed In';
  let authIcon = document.getElementById('auth-icon');
  let authStatus = document.getElementById('auth-status');
  let extUiOption = document.getElementById('ext-ui-option');
  let showListButton = document.getElementById('show-list-button');
  let signInButton = document.getElementById('sign-in-out-button');

  extUiOption.onclick = toggleExtUi;
  showListButton.onclick = showList;
  signInButton.onclick = toggleSignIn;

  // Initialise variables from storage.
  STO.local.get(['extUi', 'auth', 'loading']).then(result => {
    extUiOption.checked = result.extUi;
    changeAuth(result.auth);
    changeLoading(result.loading);
  });

  // Update ui elements on storage change.
  STO.onChanged.addListener(changes => {
    for (let key in changes) {
      let nv = changes[key].newValue;
      if (key == 'auth') {
        changeAuth(nv);
      } else if (key == 'loading') {
        changeLoading(nv);
      }
    }
  });

  // Function which changes auth ui elements.
  function changeAuth(auth) {
    user = auth;
    if (auth) {
      authIcon.innerHTML = 'cloud_done';
      authIcon.style.color = '#00C853';
      authStatus.innerHTML = user;
      authStatus.title = 'User ' + user + ' signed into YouTube Trimmer'
      signInButton.innerHTML = 'Sign Out'
      signInButton.classList.replace('is-success', 'is-danger');
    } else {
      authIcon.innerHTML = 'cloud_off';
      authIcon.style.color = '#E53935';
      authStatus.innerHTML = 'Signed Out';
      authStatus.title = 'No user is signed into YouTube Trimmer'
      signInButton.innerHTML = 'Sign In'
      signInButton.classList.replace('is-danger', 'is-success');
    }
  }

  // Function which changes loading ui on button.
  function changeLoading(loading) {
    if (loading) {
      signInButton.disabled = true;
      signInButton.classList.add('is-loading');
    } else {
      signInButton.disabled = false;
      signInButton.classList.remove('is-loading');
    }
  }

  // Function which handles extUiOption check event.
  function toggleExtUi(event) {
    let checked = extUiOption.checked;
    STO.local.set({extUi: checked});
  }

  // Function which displays trim list on content scope.
  function showList(event) {
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
      browser.tabs.sendMessage(tabs[0].id, {action: 'showList'});
      close();
    });
  }

  // Function which toggles Firebase auth on background.
  function toggleSignIn() {
    browser.runtime.sendMessage({action: 'toggleFbAuth'});
  }
});
