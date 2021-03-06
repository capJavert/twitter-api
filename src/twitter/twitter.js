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
            let response = {}
            response.username = username

            if(this.data.session === null) {
                await this.page.goto(this.data.baseurl+'/login', {waitUntil: 'networkidle2'})

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
        let response = {}

        if (this.data.session === null) {
            response.username = null
            response.status = 'Not logged in'
            console.log(response.status)

            return response
        }

        try {
            const waitForNavigation = this.page.waitForNavigation()
            await this.page.goto(this.data.baseurl+'/logout', {waitUntil: 'networkidle2'})

            await waitForNavigation
            await this.page.click('button.js-submit')

            await this.page.waitForSelector('a[href="/login"]')

            this.data.session = null

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