const CONFIG = {
  apiKey: 'REDACTED_API_KEY',
  authDomain: 'REDACTED_AUTH_DOMAIN',
  databaseURL: 'REDACTED_URL' 
};
const STO = chrome.storage;

chrome.runtime.onInstalled.addListener(function() {
    STO.local.set({ 'auth'     : '' });
    STO.local.set({ 'extUi'    : true });
    STO.local.set({ 'localDict': {} });
    STO.local.set({ 'cloudDict': {} });
  });

chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
  chrome.declarativeContent.onPageChanged.addRules([{
    conditions: [new chrome.declarativeContent.PageStateMatcher({
      pageUrl: { hostContains: 'www.youtube.com' },
    })],
    actions: [new chrome.declarativeContent.ShowPageAction()]
  }]);
});

firebase.initializeApp(CONFIG);

window.onload = function() {
  let prevUpdated = localStorage.getItem('prevUpdated');
  let db          = firebase.database();
  let userId, userRef;

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      console.log('A user is signed in.');
      STO.local.set({ 'auth': user.displayName });

      userId  = firebase.auth().currentUser.uid;
      userRef = db.ref('/users/' + userId);

      userRef.on('value', (snapshot) => {
        let newVal = snapshot.val();
        if (newVal['lastUpdated'] != prevUpdated) {
          console.log('Database changed remotely.');
          renewUpdated(newVal['lastUpdated']);
          STO.local.set({ 'cloudDict': newVal });
        }
      });

      STO.onChanged.addListener(function(changes) {
        for (let key in changes) {
          let newVal = changes[key].newValue;
          if (key == 'cloudDict' && newVal['lastUpdated'] != prevUpdated) {
            console.log('Updating dict to database.');
            renewUpdated(newVal['lastUpdated']);
            userRef.set(newVal);
          }
        }
      });
    }
    else {
      console.log('No user is signed in.');
      STO.local.set({ 'auth': '' });
    }
  });

    function renewUpdated(newUpdated) {
    prevUpdated = newUpdated;
    localStorage.setItem('lastUpdated', prevUpdated);
  }
}
