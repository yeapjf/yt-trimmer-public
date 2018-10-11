const CONFIG = {
  apiKey: 'REDACTED_API_KEY',
  authDomain: 'READACTED_AUTH_DOMAIN',
  databaseURL: 'REDACTED_URL' 
};
const STO = browser.storage;

// Initialise storage on extension install.
browser.runtime.onInstalled.addListener(() => {
  STO.local.set({extUi: true});
  STO.local.set({auth: ''});
  STO.local.set({loading: false});
  STO.local.set({localDict: {}});
  STO.local.set({cloudDict: {}});
});

window.onload = () => {
  let prevUpdated = localStorage.getItem('prevUpdated');
  let userId, userRef;

  // Log in/out from Firebase on message from popup.
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action == 'toggleFbAuth') {
      STO.local.set({loading: true});
      if (firebase.auth().currentUser) {
        firebase.auth().signOut().then(() => {
          STO.local.set({loading: false})
        });
      } else {
        startAuth(true).finally(() => {
          STO.local.set({loading: false});
        });
      }
    }
  });

  firebase.initializeApp(CONFIG);
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

  // Update storage based on Firebase auth change.
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      console.log('A user is signed in.');
      STO.local.set({auth: user.displayName});
      userId = user.uid;
      userRef = firebase.database().ref('/users/' + userId);
      userRef.on('value', snapshot => {
        let nv = snapshot.val();
        if (nv.lastUpdated != prevUpdated) {
          console.log('Database changed remotely.');
          renewUpdated(nv.lastUpdated);
          STO.local.set({cloudDict: nv});
        }
      });
      STO.onChanged.addListener(changes => {
        for (let key in changes) {
          let nv = changes[key].newValue;
          if (key == 'cloudDict' && nv.lastUpdated != prevUpdated) {
            console.log('Updating dict to database.');
            renewUpdated(nv.lastUpdated);
            userRef.set(nv);
          }
        }
      });
    } else {
      console.log('No user is signed in.');
      STO.local.set({auth: ''});
    }
  });

  // Function which starts the Firebase authentication.
  function startAuth(interactive) {
    return getAccessToken(interactive).then(token => {
      if (browser.runtime.lastError && !interactive) {
        console.log('It was not possible to get a token programmatically.');
      } else if (browser.runtime.lastError) {
        console.log(browser.runtime.lastError);
      } else if (token) {
        let creds = firebase.auth.GoogleAuthProvider.credential(null, token);
        let logIn = firebase.auth().signInAndRetrieveDataWithCredential(creds);
        logIn.catch(error => {
          if (error.code === 'auth/invalid-credential') {
            console.log('Invalid cached credentials.');
          }
        });
      } else {
        console.log('The OAuth Token was null.');
      }
    });
  }

  // Function which renews prevUpdated in localStorage.
  function renewUpdated(newUpdated) {
    prevUpdated = newUpdated;
    localStorage.setItem('lastUpdated', prevUpdated);
  }
}
