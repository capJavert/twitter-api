const User = require('./user')
const DirectMessaging = require('./direct-messaging')
const Helpers = require('../helpers/helpers')

class Twitter {
    /**
     * Init page and data from puppeteer Page
     * @param page
     */
    constructor(page) {
        this.page = page
        this.data = {
            'baseurl': 'https://twitter.com',
            'session': null
        }

        this.page.on('dialog', async dialog => {
            await dialog.accept()
        })
    }

    /**
     * Login method
     *
     * @param username
     * @param password
     * @returns {Promise<*>}
     */
    async login(username, password) {
        this.data.username = username

        try {
            await this.page.goto(this.data.baseurl+'/login', {waitUntil: 'networkidle2'})

            let response = {}
            response.username = username

            if(this.data.session === null) {
                await this.page.waitForSelector('button.submit')

                await this.page.type('.js-username-field', username)
                await this.page.waitForFunction(
                    'document.querySelector(\'.js-username-field\').value.length === ' + username.length
                )
                await this.page.type('.js-password-field', password)
                await this.page.waitForFunction(
                    'document.querySelector(\'.js-password-field\').value.length === ' + password.length
                )
                await this.page.click('button.submit')

                console.log('Submit clicked')

                await this.page.waitForSelector('.dashboard-left')

                this.data.session = 'SESSION_KEY'

                response.status = 'Logged in'
                console.log(response.status)
            } else {
                await this.page.evaluate(session => {
                    for (let key in session) {
                        if (session.hasOwnProperty(key)) {
                            sessionStorage.setItem(key, JSON.stringify(session[key]))
                        }
                    }
                }, this.data.session)

                response.status = 'Logged from session'
                console.log(response.status)
            }

            return response
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }

    }

    /**
     * Logout method
     *
     * @returns {Promise<*>}
     */
    async logout() {
        if (this.data.session === null) {
            console.log('Not logged in')

            return false
        }

        try {
            await this.page.goto(this.data.baseurl+'/logout', {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('button.js-submit')
            await this.page.click('button.js-submit')
            this.data.session = null

            let response = {}
            response.username = this.data.username
            response.status = 'Logged out'

            console.log(response.status)

            return response
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Return user's object and methods
     *
     * @returns {User}
     */
    user() {
        return new User(this.page, this.data)
    }

    /**
     * Return direct messaging's object and methods
     *
     * @returns {DirectMessaging}
     */
    directMessaging() {
        return new DirectMessaging(this.page, this.data)
    }

}

module.exports = Twitter