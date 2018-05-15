import browser from 'webextension-polyfill';

var config = {
    google: {
        client_id: "722597016924-1e17rascr0ru5usmlolufui11u9vobqb.apps.googleusercontent.com",
        authURL: 'https://accounts.google.com/o/oauth2/auth',
        revokeURL: 'https://accounts.google.com/o/oauth2/revoke',
        redirectURL: 'https://vsync.ch/_oauth',
        validationBaseURL: 'https://www.googleapis.com/oauth2/v3/tokeninfo',
        scopes: browser.runtime.getManifest().oauth2.scopes,
        storageKey: 'google_token',
        authURLFilled() {
            return `${this.authURL}?client_id=${this.client_id}&response_type=token&redirect_uri=${encodeURIComponent(this.redirectURL)}&scope=${encodeURIComponent(this.scopes.join(' '))}`
        },

        extractAccessToken(redirectUri) {
            console.debug('extractToken');
            let m = redirectUri.match(/[#?](.*)/);
            if (!m || m.length < 1)
                return null;
            let params = new URLSearchParams(m[1].split("#")[0]);
            return params.get("access_token");
        },
        
        validate(redirectURL) {
            console.debug('validate');
            const instance = config.google;
            const accessToken = instance.extractAccessToken(redirectURL);
            if (!accessToken) {
                throw "No access token could be extracted";
            }

            const validationURL = `${instance.validationBaseURL}?access_token=${accessToken}`;
            const validationRequest = new Request(validationURL, {
                method: "GET"
            });
        
            function checkResponse(response, instance) {
                console.debug('checkResponse');
                return new Promise((resolve, reject) => {
                    if (response.status != 200) {
                        reject("Token validation error");
                    }
                    response.json().then((json) => {
                        if (json.aud && (json.aud === config.google.client_id)) {
                            resolve(accessToken);
                        } else {
                            reject("Token validation error");
                        }
                    });
                });
            }
        
            return new Promise((resolve, reject) => {
                fetch(validationRequest).then(checkResponse).then(resolve).catch(reject);
            });
        },

        fetchToken() {
            return new Promise((resolve, reject) => {
                console.debug('fetchToken');

                const instance = this;

                function innerLegacyFetch() {
                    instance.fetchTokenLegacy({
                        authURL: instance.authURLFilled(),
                        redirectURL: instance.redirectURL
                    }).then(instance.validate).then(resolve).catch(reject);
                }

                if(browser.identity && browser.identity.launchWebAuthFlow) {
                    try {
                        browser.identity.launchWebAuthFlow({
                            interactive: true,
                            url: instance.authURLFilled()
                        }).then(instance.validate).then(resolve).catch(reject);
                    } catch(err) {
                        innerLegacyFetch();
                    }
                } else {
                    innerLegacyFetch();
                }
            });
        },

        fetchTokenLegacy(urls) {
            console.debug('fetchTokenLegacy');
            const authURL = urls.authURL;
            const redirectURL = urls.redirectURL;
            return new Promise((resolve, reject) => {

                // just open a new window with the authURL, background page will catch webrequest to redirectURL and login
                if(browser.runtime.getBrowserInfo) {
                    browser.runtime.getBrowserInfo().then((info) => {
                        console.log('BROWSER INFO', info);
                    });
                }
                
                if(browser.windows) {
                    browser.windows.create({url: authURL}).then(resolve).catch(reject);
                } else {
                    console.error('No windows object');
                    reject('No windows object VVV');
                }
            });
        },

        revokeToken(token) {
            console.debug('revokeToken');
            const revokeRequest = new Request(this.revokeURL + '?token='+token, {
                method: "GET"
            });
            return fetch(revokeRequest);
        },

        fetchAndStoreToken() {
            console.debug('fetchAndStoreToken');
            const instance = this;
            return new Promise((resolve, reject) => {
                instance.fetchToken().then((token) => {
                    instance.storeLocalToken(token).then(() => {
                        resolve(token);
                    }).catch((err) => {
                        reject(err);
                    });
                }).catch((err) => {
                    reject(err);
                });
            });
        },

        storeLocalToken(token) {
            console.debug('storeLocalToken');
            var tokenObject = {};
            tokenObject[this.storageKey] = token;
            return browser.storage.local.set(tokenObject);
        },
        removeLocalToken() {
            console.debug('removeLocalToken');
            return browser.storage.local.remove(this.storageKey);
        },
        getLocalToken() {
            console.debug('getLocalToken');
            const instance = this;
            return new Promise((resolve, reject) => {
                browser.storage.local.get(instance.storageKey).then((result) => {
                    if(result[instance.storageKey]) {
                        resolve(result[instance.storageKey]);
                    } else {
                        reject({message: 'No OAuth key found'})
                    }
                }).catch((err) => {
                    reject(err);
                })
            });
        },
        revokeAndRemoveLocalToken() {
            console.debug('revokeAndRemoveLocalToken');
            const instance = this;
            return new Promise((resolve, reject) => {
                instance.getLocalToken().then((token) => {
                    instance.removeLocalToken().then(() => { // remove local token
                        instance.revokeToken(token).then(() => { // asynchronously revoke token
                            resolve();
                        }).catch((err) => {
                            reject(err);
                        });
                    }).catch((err) => {
                        reject(err);
                    });
                }).catch(() => { // if no token was found no need to remove it
                    resolve();
                });
            });
        }
    }
};

export default config;