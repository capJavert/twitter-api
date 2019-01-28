const puppeteer = require('puppeteer')
const Twitter = require('./twitter/twitter')
const DevicesProfiles = require('./devices.profiles')
const ConditionsUtil = require('./helpers/conditions-util')
const ApiService = require('./services/api.service')

const apiService = new ApiService();
const sessions = [];

/**
 * Install twitter API to express app
 * @param  {express.Application}  app             Express App instance
 * @param  {String}  [baseRoute=''] Base route for twitter API
 * @param  {Boolean} [headless=true] Should Chromium browser be run in headless mode
 * @return {undefined}
 */
const appRouter = function (app, baseRoute = '', headless = true) {
    /**
     * Check if user is authenticated
     * @param request
     * @param response
     * @returns {*}
     */
    const isAuth = (request, response) => {
        const auth = request.header("authorization");

        if (!ConditionsUtil.isNullOrEmpty(auth)) {
            const key = auth.replace('Bearer ', '')

            return apiService.isKeyValid(key)
        } else {
            return false
        }
    }

    /**
     * Restrict access to methods
     *
     * @param request
     * @param response
     * @returns {*}
     */
    const restricted = (request, response) => {
        if (!isAuth(request, response)) {
            return response.status(401).wrap({
                status: 401,
                name: 'Unauthorized',
                message: 'Authorization Required'
            })
        }
    }

    /**
     * Loads session according to provided API key
     *
     * @param authorization
     * @param browser
     * @returns {Promise<*>}
     */
    const loadSession = async (authorization, browser) => {
        const key = authorization.replace('Bearer ', '')

        if (ConditionsUtil.isNullOrEmpty(sessions[key])) {
            const session = {}
            session.context = await browser.createIncognitoBrowserContext()
            session.page = await session.context.newPage()

            /**
             * Set request filters
             * Resources like images and fonts do not need to be loaded
             */
            await session.page.setRequestInterception(true);

            session.page.on('request', request => {
                if (request.resourceType() === 'image' || request.resourceType() === 'font') {
                    request.abort()
                } else if(request.resourceType() === 'stylesheet' &&
                    request.url().indexOf('twitter_core.bundle.css') === -1) {
                    request.abort()
                } else {
                    request.continue()
                }
            });

            session.page.emulate(DevicesProfiles.desktop)
            session.twitter = {
                core: await new Twitter(session.page),
            }
            session.twitter.user = session.twitter.core.user()
            session.twitter.directMessaging = session.twitter.core.directMessaging()

            sessions[key] = session
        }

        return sessions[key]
    }

    puppeteer.launch({headless: headless, timeout: 0}).then(async browser => {

        /**
         * Keys management methods
         */
        app.get(baseRoute + '/twitter', function (req, res) {
            const authStatus = isAuth(req, res)
            console.log(authStatus)

            res.wrap({
                name: 'NodeJS Twitter API',
                scope: ['twitter-api'],
                auth: authStatus
            })
        })

        app.get(baseRoute + '/twitter/keys/register', function (req, res) {
            res.wrap({
                scope: ['twitter-api'],
                key: apiService.createKey()
            })
        })

        app.delete(baseRoute + '/twitter/keys/remove', async function (req, res) {
            if(!req.body.key) {
                return res.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: key'})
            } else if(!apiService.isKeyValid(req.body.key)) {
                return res.wrap({'isError': true, 'status': 'error', 'message': 'Provided key is not valid'})
            } else {
                apiService.deleteKey(req.body.key)

                const session = sessions[req.body.key]

                if (!ConditionsUtil.isNullOrEmpty(session)) {
                    await session.context.close()
                }

                return res.wrap({'isError': true, 'status': 'ok', 'message': 'Provided key is deleted and session is closed'})
            }
        })

        /**
         * Twitter User methods
         */

        app.post(baseRoute + '/twitter/follow/:username', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.params.username) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await session.twitter.user.follow(request.params.username))
            }
        })

        app.post(baseRoute + '/twitter/unfollow/:username', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.params.username) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await session.twitter.user.unfollow(request.params.username))
            }
        })

        app.post(baseRoute + '/twitter/tweet', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.body.text) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: text'})
            } else {
                return response.wrap(await session.twitter.user.tweet(request.body.text))
            }
        })

        app.post(baseRoute + '/twitter/like-recent-tweets/:username', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.params.username) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await session.twitter.user.likeRecentTweets(request.params.username))
            }
        })

        app.post(baseRoute + '/twitter/like-tweet/:username/status/:id', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.params.username || !request.params.id) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameters: username or status id'})
            } else {
                return response.wrap(await session.twitter.user.like(request.params.username, request.params.id))
            }
        })

        app.post(baseRoute + '/twitter/like-last-tweet/:username', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.params.username) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await session.twitter.user.likeLastTweet(request.params.username))
            }
        })

        app.post(baseRoute + '/twitter/follow-network/:username', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.params.username) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await session.twitter.user.followNetwork(request.params.username))
            }
        })

        app.post(baseRoute + '/twitter/follow-interests/:username', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.params.username) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await session.twitter.user.followInterests(request.params.username))
            }
        })

        app.get(baseRoute + '/twitter/:username/followers', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.params.username) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await session.twitter.user.followers(request.params.username))
            }
        })

        app.get(baseRoute + '/twitter/followers', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!session.twitter.user.data.username) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await session.twitter.user.followers())
            }
        })

        app.get(baseRoute + '/twitter/:username/interests', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.params.username) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await session.twitter.user.interests(request.params.username))
            }
        })

        app.get(baseRoute + '/twitter/interests', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!session.twitter.user.data.username) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await session.twitter.user.interests())
            }
        })

        app.post(baseRoute + '/twitter/retweet/:username/status/:id', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.params.username || !request.params.id) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameters: username or status id'})
            } else {
                return response.wrap(await session.twitter.user.retweet(request.params.username, request.params.id))
            }
        })

        app.post(baseRoute + '/twitter/retweet-last/:username', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.params.username) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await session.twitter.user.retweetLastTweet(request.params.username))
            }
        })

        /**
         * Twitter Core methods
         */

        app.post(baseRoute + '/twitter/login', async function (request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.body.username || !request.body.password) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameters: username or password'})
            } else {
                return response.wrap(await session.twitter.core.login(request.body.username, request.body.password))
            }
        })

        app.get(baseRoute + '/twitter/logout', async function (request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            return response.wrap(await session.twitter.core.logout())
        })

        /**
         * Twitter DM methods
         */

        app.get(baseRoute + '/twitter/messages/threads', async function (request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            return response.wrap(await session.twitter.directMessaging.list())
        })

        app.get(baseRoute + '/twitter/messages/:threadid/list', async function (request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.params.threadid) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: thread id'})
            } else {
                return response.wrap(await session.twitter.directMessaging.messages(request.params.threadid))
            }
        })

        app.post(baseRoute + '/twitter/messages', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.body.text || !request.body.username) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameters: text or username'})
            } else {
                return response.wrap(await session.twitter.directMessaging.create(request.body.text))
            }
        })

        app.put(baseRoute + '/twitter/messages/:threadid', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.body.text || !request.param.threadid) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameters: text or thread id'})
            } else {
                return response.wrap(await session.twitter.directMessaging.reply(request.body.text, request.params.threadid))
            }
        })

        app.delete(baseRoute + '/twitter/messages/:threadid', async function(request, response) {
            restricted(request, response)
            const session = await loadSession(
                request.header("authorization"),
                browser
            )

            if(!request.param.threadid) {
                return response.wrap({'isError': true, 'status': 'error', 'message': 'missing a parameter: thread id'})
            } else {
                return response.wrap(await session.twitter.directMessaging.delete(request.params.threadid))
            }
        })

        /**
         * Wrap responses to data attribute inside parent object
         *
         * @param data
         * @returns {*}
         */
        app.response.wrap = function (data) {
            if (data.isError) {
                delete data.isError;
                return this.status(500).send({data: data})
            } else {
                return this.send({data: data})
            }
        }
    })
}

module.exports = appRouter
