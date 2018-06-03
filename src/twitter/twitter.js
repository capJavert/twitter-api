const User = require('./user')
const ConditionsUtil = require('../helpers/conditions-util')

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
     * @returns {Promise.<boolean>}
     */
    async login(username, password) {
        this.data.username = username

        try {
            await this.page.goto(this.data.baseurl+"/login", {waitUntil: 'networkidle2'})

            if(this.data.session === null) {
                await this.page.waitForSelector('button.submit')

                await this.page.type(".js-username-field", username)
                await this.page.type('.js-password-field', password)
                await this.page.click('button.submit')

                console.log("Submit clicked")

                await this.page.waitForSelector('.dashboard-left')

                this.data.session = "SESSION_KEY"

                console.log("Logged in")
            } else {
                await this.page.evaluate(session => {
                    for (let key in session) {
                        if (session.hasOwnProperty(key)) {
                            sessionStorage.setItem(key, JSON.stringify(session[key]))
                        }
                    }
                }, this.data.session)

                console.log("Logged from session")
            }

            return true
        } catch(e) {
            console.log(e)

            return false
        }

    }

    /**
     * Logout method
     *
     * @returns {Promise.<boolean>}
     */
    async logout() {
        if (this.data.session === null) {
            console.log("Not logged in")

            return false
        }

        try {
            await this.page.goto(this.data.baseurl+"/logout", {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('button.js-submit')
            await this.page.click("button.js-submit")
            this.data.session = null

            console.log("Logged out")

            return true
        } catch(e) {
            console.log(e)

            return false
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

}

module.exports = Twitter