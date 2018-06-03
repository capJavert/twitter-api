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
     * @returns {Promise.<boolean>}
     */
    async follow(username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.ProfileNav-list .user-actions .js-follow-btn')

            if (await this.page.$('.ProfileNav-list .user-actions.not-following') !== null) {
                await this.page.waitForSelector('.ProfileNav-list .user-actions .js-follow-btn')
                await this.page.click('.ProfileNav-list .user-actions .js-follow-btn')
            } else {
                console.log('Already Following')
            }

            return true
        } catch(e) {
            console.log(e)

            return false
        }
    }

    /**
     * Unfollow method
     *
     * @param username
     * @returns {Promise.<boolean>}
     */
    async unfollow(username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.ProfileNav-list .user-actions .js-follow-btn')

            if (await this.page.$('.ProfileNav-list .user-actions.following') !== null) {
                await this.page.waitForSelector('.ProfileNav-list .user-actions .js-follow-btn')
                await this.page.click('.ProfileNav-list .user-actions .js-follow-btn')
            } else {
                console.log('Not following')
            }

            return true
        } catch(e) {
            console.log(e)

            return false
        }
    }

    /**
     * Tweet method
     *
     * @param text
     * @returns {Promise.<boolean>}
     */
    async tweet(text) {
        try {
            if (!Helpers.urlsEqual(this.page.url(), this.data.baseurl)) {
                await this.page.goto(this.data.baseurl, {waitUntil: 'networkidle2'})
                await this.page.waitForSelector('.js-tweet-btn')
            }

            await this.page.waitForSelector('#tweet-box-home-timeline')
            await this.page.click('#tweet-box-home-timeline')
            await this.page.waitForSelector('#tweet-box-home-timeline.is-showPlaceholder')
            await this.page.type('#tweet-box-home-timeline', text)
            await this.page.waitForSelector('.js-tweet-btn')
            await this.page.click('.js-tweet-btn')

            return true
        } catch(e) {
            console.log(e)

            return false
        }
    }

    /**
     * Like method
     *
     * @param username
     * @param tweetId
     * @returns {Promise.<boolean>}
     */
    async like(tweetId, username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username+'/status/'+tweetId, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.PermalinkOverlay-modal div.stream-item-footer .ProfileTweet-actionButton.js-actionFavorite')

            try {
                await (await this.page.$('.PermalinkOverlay-modal div.stream-item-footer .ProfileTweet-actionButton.js-actionFavorite')).click()
            } catch (e) {
                console.log('Already liked')
            }

            return true
        } catch(e) {
            console.log(e)

            return false
        }
    }

    /**
     * Like recent tweets method
     *
     * @param username
     * @returns {Promise.<*>}
     */
    async likeRecentTweets(username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.ProfileTweet-action--favorite')

            for (let element of await this.page.$$('.ProfileTweet-actionButton.js-actionFavorite')) {
                try {
                    await element.click()
                } catch (e) {
                    console.log('Already liked')
                }
            }

            return await this.page.$$eval('div[data-tweet-id]', elements => {
                let tweetIds = []

                for (let element of elements) {
                    tweetIds.push(element.getAttribute('data-tweet-id'))
                }

                return tweetIds
            })
        } catch(e) {
            console.log(e)

            return []
        }
    }

    /**
     * Like last tweet method
     * @param username
     * @returns {Promise.<*>}
     */
    async likeLastTweet(username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.ProfileTweet-action--favorite')

            try {
                await (await this.page.$('.ProfileTweet-actionButton.js-actionFavorite')).click()
            } catch (e) {
                console.log('Already liked')
            }

            return await this.page.$eval('div[data-tweet-id]', element => {
                return element.getAttribute('data-tweet-id')
            })
        } catch(e) {
            console.log(e)

            return false
        }
    }

    /**
     * Follow network method
     *
     * @param username
     * @returns {Promise.<boolean>}
     */
    async followNetwork(username = '') {
        try {
            if (ConditionsUtil.isNotNullNorEmpty(username)) {
                await this.page.goto(this.data.baseurl+'/'+username+'/followers', {waitUntil: 'networkidle2'})
            } else {
                await this.page.goto(this.data.baseurl+'/followers', {waitUntil: 'networkidle2'})
            }
            
            await this.page.waitForSelector('.AppContent-main')

            for (let element of await this.page.$$('.AppContent-main .js-follow-btn')) {
                await element.click()
            }

            return true
        } catch(e) {
            console.log(e)

            return false
        }
    }

    /**
     * Follow interests method
     *
     * @param username
     * @returns {Promise.<boolean>}
     */
    async followInterests(username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username+'/following', {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.AppContent-main')

            for (let element of await this.page.$$('.AppContent-main .js-follow-btn')) {
                await element.click()
            }

            return true
        } catch(e) {
            console.log(e)

            return false
        }
    }

    /**
     * Get followers method
     *
     * @param username
     * @returns {Promise.<*>}
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

            return []
        }
    }

    /**
     * Get interests method
     *
     * @param username
     * @returns {Promise.<*>}
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

            return []
        }
    }

    /**
     * Retweet last tweet method
     *
     * @param username
     * @returns {Promise.<*>}
     */
    async retweetLastTweet(username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.ProfileTweet-action--retweet')

            try {
                await (await this.page.$('.ProfileTweet-actionButton.js-actionRetweet')).click()
                await (await this.page.$('.RetweetDialog-retweetActionLabel')).click()
            } catch (e) {
                console.log('Already retweeted')
            }

            return await this.page.$eval('div[data-tweet-id]', element => {
                return element.getAttribute('data-tweet-id')
            })
        } catch(e) {
            console.log(e)

            return false
        }
    }

    /**
     * Retweet method
     * @param username
     * @param tweetId
     * @returns {Promise.<boolean>}
     */
    async retweet(tweetId, username) {
        try {
            await this.page.goto(this.data.baseurl+'/'+username+'/status/'+tweetId, {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.PermalinkOverlay-modal div.stream-item-footer .ProfileTweet-actionButton.js-actionRetweet')

            try {
                await (await this.page.$('.PermalinkOverlay-modal div.stream-item-footer .ProfileTweet-actionButton.js-actionRetweet')).click()
                await (await this.page.$('.RetweetDialog-retweetActionLabel')).click()
            } catch (e) {
                console.log('Already retweeted')
            }

            return true
        } catch(e) {
            console.log(e)

            return false
        }
    }
}

module.exports = User
