const REDIRECT_URL = browser.identity.getRedirectURL();
const CLIENT_ID = '580127753188-5rflj59k2r29ebtod8h3hhtp6m4gtibe.apps.googleusercontent.com';
const SCOPES = ['openid', 'email', 'profile'];
const AUTH_URL =
`https://accounts.google.com/o/oauth2/auth\
?client_id=${CLIENT_ID}\
&response_type=token\
&redirect_uri=${encodeURIComponent(REDIRECT_URL)}\
&scope=${encodeURIComponent(SCOPES.join(' '))}`;
const VALIDATION_BASE_URL = 'https://www.googleapis.com/oauth2/v3/tokeninfo';

function getAccessToken(interactive) {
  return authorize(interactive).then(validate);
}

function authorize(interactive) {
  return browser.identity.launchWebAuthFlow({
    interactive: interactive,
    url: AUTH_URL
  });
}

function validate(redirectURL) {
  let accessToken = extractAccessToken(redirectURL);
  if (!accessToken) throw 'Authorization failure';
  let validationURL = `${VALIDATION_BASE_URL}?access_token=${accessToken}`;
  let validationRequest = new Request(validationURL, {method: 'GET'});

  function checkResponse(response) {
    return new Promise(function(resolve, reject) {
      if (response.status != 200) reject('Token validation error');
      response.json().then(function(json) {
        if (json.aud && (json.aud === CLIENT_ID)) {
          resolve(accessToken);
        } else {
          reject('Token validation error');
        }
      });
    });
  }

  return fetch(validationRequest).then(checkResponse);
}

function extractAccessToken(redirectUri) {
  let m = redirectUri.match(/[#?](.*)/);
  if (!m || m.length < 1) return null;
  let params = new URLSearchParams(m[1].split('#')[0]);
  return params.get('access_token');
}
