const Helpers = require('../helpers/helpers')
const ConditionsUtil = require('../helpers/conditions-util')

class User {
    constructor(page, data) {
        this.page = page
        this.data = data
    }

    /**
     * Follow method
     *
     * @param username
     * @returns {Promise<*>}
     */
    async follow(username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.ProfileNav-list .user-actions .js-follow-btn')

            let response = {}
            response.username = username

            if (await this.page.$('.ProfileNav-list .user-actions.not-following') !== null) {
                await this.page.waitForSelector('.ProfileNav-list .user-actions .js-follow-btn')
                await this.page.click('.ProfileNav-list .user-actions .js-follow-btn')

                response.status = 'User followed'
            } else {
                response.status = 'Already Following'
                console.log(response.status)
            }

            return response
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Unfollow method
     *
     * @param username
     * @returns {Promise<*>}
     */
    async unfollow(username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.ProfileNav-list .user-actions .js-follow-btn')

            let response = {}
            response.username = username

            if (await this.page.$('.ProfileNav-list .user-actions.following') !== null) {
                await this.page.waitForSelector('.ProfileNav-list .user-actions .js-follow-btn')
                await this.page.click('.ProfileNav-list .user-actions .js-follow-btn')
            } else {
                response.status = 'Not following'
                console.log(response.status)
            }

            return response
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Tweet method
     *
     * @param text
     * @returns {Promise<*>}
     */
    async tweet(text) {
        try {
            if (!Helpers.urlsEqual(this.page.url(), this.data.baseurl)) {
                await this.page.goto(this.data.baseurl, {waitUntil: 'networkidle2'})
                await this.page.waitForSelector('.js-tweet-btn')
            }

            let tweet = {}
            tweet.text = text

            await this.page.waitForSelector('#tweet-box-home-timeline')
            await this.page.click('#tweet-box-home-timeline')
            await this.page.waitForSelector('#tweet-box-home-timeline.is-showPlaceholder')
            await this.page.type('#tweet-box-home-timeline', text)
            await this.page.waitForSelector('.js-tweet-btn')
            await this.page.click('.js-tweet-btn')

            // TODO assign tweetId

            return tweet
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Like method
     *
     * @param username
     * @param tweetId
     * @returns {Promise<*>}
     */
    async like(tweetId, username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username+'/status/'+tweetId, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.PermalinkOverlay-modal div.stream-item-footer .ProfileTweet-actionButton.js-actionFavorite')

            let response = {}
            response.tweetId = tweetId
            response.username = username

            try {
                await (await this.page.$('.PermalinkOverlay-modal div.stream-item-footer .ProfileTweet-actionButton.js-actionFavorite')).click()
                response.status = 'Tweet liked'
            } catch (e) {
                response.status = 'Already liked'
                console.log(response.status)
            }

            return response
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Like recent tweets method
     *
     * @param username
     * @returns {Promise<*>}
     */
    async likeRecentTweets(username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.ProfileTweet-action--favorite')

            let response = {}
            response.username = username

            for (let element of await this.page.$$('.ProfileTweet-actionButton.js-actionFavorite')) {
                try {
                    await element.click()
                } catch (e) {
                    console.log('Already liked')
                }
            }

            response.tweetIds = await this.page.$$eval('div[data-tweet-id]', elements => {
                let tweetIds = []

                for (let element of elements) {
                    tweetIds.push(element.getAttribute('data-tweet-id'))
                }

                return tweetIds
            })

            response.status = "Tweets liked"

            return response
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Like last tweet method
     * @param username
     * @returns {Promise<*>}
     */
    async likeLastTweet(username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.ProfileTweet-action--favorite')

            let response = {}
            response.username = username

            try {
                await (await this.page.$('.ProfileTweet-actionButton.js-actionFavorite')).click()
                response.status = 'Tweet liked'
            } catch (e) {
                response.status = 'Already liked'
                console.log(response.status)
            }

            response.tweetId = await this.page.$eval('div[data-tweet-id]', element => {
                return element.getAttribute('data-tweet-id')
            })

            return response
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Follow network method
     *
     * @param username
     * @returns {Promise<*>}
     */
    async followNetwork(username = '') {
        try {
            if (ConditionsUtil.isNotNullNorEmpty(username)) {
                await this.page.goto(this.data.baseurl+'/'+username+'/followers', {waitUntil: 'networkidle2'})
            } else {
                await this.page.goto(this.data.baseurl+'/followers', {waitUntil: 'networkidle2'})
            }

            let response = {}
            response.username = username === '' ? 'me' : username
            response.status = "Network followed"
            
            await this.page.waitForSelector('.AppContent-main')

            for (let element of await this.page.$$('.AppContent-main .js-follow-btn')) {
                await element.click()
            }

            response.users = await this.page.$$eval('div[data-screen-name]', elements => {
                let users = []

                for (let element of elements) {
                    users.push(element.getAttribute('data-screen-name'))
                }

                return users
            })

            return response
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Follow interests method
     *
     * @param username
     * @returns {Promise<*>}
     */
    async followInterests(username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username+'/following', {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.AppContent-main')

            let response = {}
            response.username = username
            response.status = "Interests followed"

            for (let element of await this.page.$$('.AppContent-main .js-follow-btn')) {
                await element.click()
            }

            response.users = await this.page.$$eval('div[data-screen-name]', elements => {
                let users = []

                for (let element of elements) {
                    users.push(element.getAttribute('data-screen-name'))
                }

                return users
            })

            return response
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Get followers method
     *
     * @param username
     * @returns {Promise<*>}
     */
    async followers(username = '') {
        try {
            if (ConditionsUtil.isNotNullNorEmpty(username)) {
                await this.page.goto(this.data.baseurl+'/'+username+'/followers', {waitUntil: 'networkidle2'})
            } else {
                await this.page.goto(this.data.baseurl+'/followers', {waitUntil: 'networkidle2'})
            }

            await this.page.waitForSelector('.AppContent-main')

            return await this.page.$$eval('.AppContent-main .username.u-dir .u-linkComplex-target', elements => {
                let followers = []

                for (let element of elements) {
                    followers.push(element.innerText)
                }
                followers.shift()

                return followers
            })
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Get interests method
     *
     * @param username
     * @returns {Promise<*>}
     */
    async interests(username = '') {
        try {
            if (ConditionsUtil.isNotNullNorEmpty(username)) {
                await this.page.goto(this.data.baseurl+'/'+username+'/following', {waitUntil: 'networkidle2'})
            } else {
                await this.page.goto(this.data.baseurl+'/following', {waitUntil: 'networkidle2'})
            }

            await this.page.waitForSelector('.AppContent-main')

            return await this.page.$$eval('.AppContent-main .username.u-dir .u-linkComplex-target', elements => {
                let followers = []

                for (let element of elements) {
                    followers.push(element.innerText)
                }
                followers.shift()

                return followers
            })
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Retweet last tweet method
     *
     * @param username
     * @returns {Promise<*>}
     */
    async retweetLastTweet(username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.ProfileTweet-action--retweet')

            let response = {}
            response.username = username

            try {
                await (await this.page.$('.ProfileTweet-actionButton.js-actionRetweet')).click()
                await (await this.page.$('.RetweetDialog-retweetActionLabel')).click()
                response.status = 'Retweeted'
            } catch (e) {
                response.status = 'Already retweeted'
                console.log(response.status)
            }

            response.tweetId = await this.page.$eval('div[data-tweet-id]', element => {
                return element.getAttribute('data-tweet-id')
            })

            return response
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Retweet method
     * @param username
     * @param tweetId
     * @returns {Promise<*>}
     */
    async retweet(tweetId, username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username+'/status/'+tweetId, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.PermalinkOverlay-modal div.stream-item-footer .ProfileTweet-actionButton.js-actionRetweet')

            let response = {}
            response.username = username

            try {
                await (await this.page.$('.PermalinkOverlay-modal div.stream-item-footer .ProfileTweet-actionButton.js-actionRetweet')).click()
                await (await this.page.$('.RetweetDialog-retweetActionLabel')).click()
                response.status = 'Retweeted'
            } catch (e) {
                response.status = 'Already retweeted'
                console.log(response.status)
            }

            response.tweetId = await this.page.$eval('div[data-tweet-id]', element => {
                return element.getAttribute('data-tweet-id')
            })

            return response
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }
}

module.exports = User
