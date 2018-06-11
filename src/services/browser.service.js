const axios = require('axios');

/**
 * BrowserService
 *
 * manages browser instances through devtools WS endpoints
 * endpoints are saved and fetched from gist file
 *
 */
class BrowserService {
    constructor(authToken, gistId, file) {
        this.gistId = gistId
        this.file = file
        this.http = axios.create({
            baseURL: 'https://api.github.com'
        });
        this.http.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;

        this.sessionKey = null
    }

    /**
     * Save new session/wsUrl to gist
     *
     * @param sessionKey
     * @returns {Promise<void>}
     */
    async saveSessionKey(sessionKey) {
        let gist = (await this.http.get('/gists/' + this.gistId)).data
        let browsers = JSON.parse(gist.files[this.file].content)

        if (browsers.indexOf(sessionKey) === -1) {
            browsers.unshift(sessionKey)
        }

        gist.files[this.file].content = JSON.stringify(browsers)

        await this.http.patch('/gists/' + this.gistId, {files: gist.files})
    }

    /**
     * Load specific sessionKey/wsUrl to service
     * Default is the latest saved key
     *
     * @param index
     * @returns {Promise<*>}
     */
    async loadSessionKey(index = 0) {
        let browsers = JSON.parse(
            (await this.http.get('/gists/' + this.gistId))
                .data.files[this.file]
                .content
        )

        if (browsers.length > index) {
            this.sessionKey = browsers[index]
            return this.sessionKey
        }

        return null;
    }

    /**
     * Clear all saved sessionKeys/wsUrls from gist
     * @returns {Promise<void>}
     */
    async clearAllKeys() {
        let files = {}
        files[this.file] = {content: "[]"}

        await this.http.patch('/gists/' + this.gistId, {files: files})
    }
}

module.exports = BrowserService