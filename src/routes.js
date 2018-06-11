const puppeteer = require('puppeteer')
const Twitter = require('./twitter/twitter')
const DevicesProfiles = require('./devices.profiles')
const ConditionsUtil = require('./helpers/conditions-util')
const ApiService = require('./services/api.service')

const headless = true; // set to false for visual mode
const apiService = new ApiService();

/**
 * Run web app for Twitter API
 *
 * @param app
 */
const appRouter = function (app) {
    const isAuth = (request, response) => {
        const auth = request.header("authorization");

        if (!ConditionsUtil.isNullOrEmpty(auth)) {
            const key = auth.replace('Bearer ', '')

            return apiService.isKeyValid(key)
        } else {
            return false
        }
    }

    const restricted = (request, response) => {
        if (!isAuth(request, response)) {
            return response.status(401).send({
                status: 401,
                name: 'Unauthorized',
                message: 'Authorization Required'
            })
        }
    }

    puppeteer.launch({headless: headless, timeout: 0}).then(async browser => {
        const page = await browser.newPage()
        await page.emulate(DevicesProfiles.desktop)

        const twitter = await new Twitter(page)
        let twitterUser = twitter.user();

        app.get('/', function (req, res) {
            const authStatus = isAuth(req, res)
            console.log(authStatus)

            res.send({
                name: 'NodeJS Twitter API',
                scope: ['twitter-api'],
                auth: authStatus
            })
        })

        app.get('/api/register', function (req, res) {
            res.send({
                scope: ['twitter-api'],
                key: apiService.createKey()
            })
        })

        app.post('/follow/:username', async function(request, response) {
            restricted(request, response)

            if(!request.params.username) {
                return response.wrap({'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await twitterUser.follow(request.params.username))
            }
        })

        app.post('/unfollow/:username', async function(request, response) {
            restricted(request, response)

            if(!request.params.username) {
                return response.wrap({'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await twitterUser.unfollow(request.params.username))
            }
        })

        app.post('/tweet', async function(request, response) {
            restricted(request, response)

            if(!request.body.text) {
                return response.wrap({'status': 'error', 'message': 'missing a parameter: text'})
            } else {
                return response.wrap(await twitterUser.tweet(request.body.text))
            }
        })

        app.post('/like-recent-tweets/:username', async function(request, response) {
            restricted(request, response)

            if(!request.params.username) {
                return response.wrap({'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await twitterUser.likeRecentTweets(request.params.username))
            }
        })

        app.post('/like-tweet/:username/status/:id', async function(request, response) {
            restricted(request, response)

            if(!request.params.username || !request.params.id) {
                return response.wrap({'status': 'error', 'message': 'missing a parameters: username or status id'})
            } else {
                return response.wrap(await twitterUser.like(request.params.username, request.params.id))
            }
        })

        app.post('/like-last-tweet/:username', async function(request, response) {
            restricted(request, response)

            if(!request.params.username) {
                return response.wrap({'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await twitterUser.likeLastTweet(request.params.username))
            }
        })

        app.post('/follow-network/:username', async function(request, response) {
            restricted(request, response)

            if(!request.params.username) {
                return response.wrap({'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await twitterUser.followNetwork(request.params.username))
            }
        })

        app.post('/follow-interests/:username', async function(request, response) {
            restricted(request, response)

            if(!request.params.username) {
                return response.wrap({'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await twitterUser.followInterests(request.params.username))
            }
        })

        app.get('/:username/followers', async function(request, response) {
            restricted(request, response)

            if(!request.params.username) {
                return response.wrap({'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await twitterUser.followers(request.params.username))
            }
        })

        app.get('/followers', async function(request, response) {
            restricted(request, response)

            if(!twitterUser.data.username) {
                return response.wrap({'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await twitterUser.followers())
            }
        })

        app.get('/:username/interests', async function(request, response) {
            restricted(request, response)

            if(!request.params.username) {
                return response.wrap({'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await twitterUser.interests(request.params.username))
            }
        })

        app.get('/interests', async function(request, response) {
            restricted(request, response)

            if(!twitterUser.data.username) {
                return response.wrap({'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await twitterUser.interests())
            }
        })

        app.post('/retweet/:username/status/:id', async function(request, response) {
            restricted(request, response)

            if(!request.params.username || !request.params.id) {
                return response.wrap({'status': 'error', 'message': 'missing a parameters: username or status id'})
            } else {
                return response.wrap(await twitterUser.retweet(request.params.username, request.params.id))
            }
        })

        app.post('/retweet-last/:username', async function(request, response) {
            restricted(request, response)

            if(!request.params.username) {
                return response.wrap({'status': 'error', 'message': 'missing a parameter: username'})
            } else {
                return response.wrap(await twitterUser.retweetLastTweet(request.params.username))
            }
        })

        app.post('/login', async function (request, response) {
            restricted(request, response)

            if(!request.body.username || !request.body.password) {
                return response.wrap({'status': 'error', 'message': 'missing a parameters: username or password'})
            } else {
                return response.wrap(await twitter.login(request.body.username, request.body.password))
            }
        })

        app.get('/logout', async function (request, response) {
            return response.wrap(await twitter.logout())
        })

        app.response.wrap = function (data) {
            return this.send({data: data})
        }
    })
}

module.exports = appRouter