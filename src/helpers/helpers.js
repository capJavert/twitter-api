class Helpers {
    /**
     * Trim URL to the left
     *
     * @param string
     * @param charlist
     * @returns {XML|*|void}
     */
    static trimLeft(string, charlist) {
        if (charlist === undefined)
            charlist = '\s'

        return string.replace(new RegExp('^[' + charlist + ']+'), '')
    }

    /**
     * Trim URL to the right
     *
     * @param string
     * @param charlist
     * @returns {XML|*|void}
     */
    static trimRight(string, charlist) {
        if (charlist === undefined)
            charlist = '\s'

        return string.replace(new RegExp('[' + charlist + ']+$'), '')
    }

    /**
     * Check if two URLs are equal
     *
     * @param url1
     * @param url2
     * @returns {boolean}
     */
    static urlsEqual(url1, url2) {
        return this.trimRight(url1, '/') === this.trimRight(url2, '/')
    }

    /**
     * Async sleep for @param ms
     *
     * @param ms
     * @returns {Promise}
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    static stripTags(html){
        return html.replace(/<[^>]+>/g, '')
    }

    static wrapError(error) {
        return {
            name: error.name,
            message: error.message
        }
    }
}

module.exports = Helpers
