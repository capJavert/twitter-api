const Helpers = require('../helpers/helpers')

class DirectMessaging {
    constructor(page, data) {
        this.page = page
        this.data = data
    }

    /**
     * List all message threads
     *
     * @returns {Promise<*>}
     */
    async list() {
        try {
            await this.page.goto(this.data.baseurl+'/messages', {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.DMInbox-conversationItem')

            let elements = await this.page.$$('.DMInbox-conversationItem')
            let conversations = []

            for(let element of elements) {
                let conversation = {}
                conversation.full_name = await element.$eval('.fullname', meta => meta.innerText);
                conversation.username = await element.$eval('.username', meta => {
                    let handle = meta.innerText
                    return handle.replace('@', '')
                });
                conversation = {
                    ...conversation,
                    ...await element.$eval('.DMInboxItem', meta => {
                        let conversationMeta = {}
                        conversationMeta.thread_id = meta.getAttribute('data-thread-id')
                        conversationMeta.last_message_id = meta.getAttribute('data-last-message-id')
                        conversationMeta.is_muted = meta.getAttribute('data-is-muted') === 'true'

                        return conversationMeta
                    })
                }
                conversation.timestamp = await element.$eval('.DMInboxItem-timestamp ._timestamp', meta =>
                    meta.getAttribute('data-time')
                )

                conversations.push(conversation)
            }

            // console.log(conversations)

            return conversations
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Start new message thread
     *
     * @param text
     * @param usernames
     * @returns {Promise<{}>}
     */
    async create(text, usernames) {
        if (!Array.isArray(usernames)) {
            usernames = [usernames]
        }

        try {
            await this.page.goto(this.data.baseurl+'/messages', {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.DMComposeButton')
            await this.page.click('.DMComposeButton')

            await this.page.waitForSelector('textarea.twttr-directmessage-input')

            let hasRecipients = false

            for (let username of usernames.map(u => u.toLowerCase())) {
                await this.page.type('textarea.twttr-directmessage-input', username)

                let suggestions = await this.page.$$eval('.DMTypeaheadSuggestions .username', elements =>
                    elements.map(e => e.innerText.toLowerCase().replace('@', ''))
                )

                // console.log(suggestions)

                let selectedUserIndex = suggestions.indexOf(username)

                if (selectedUserIndex > -1) {
                    hasRecipients = true

                    let suggestionsList = await this.page.$$('.DMTypeaheadSuggestions-item')
                    await suggestionsList[selectedUserIndex].click()
                }


                // console.log(hasRecipients)
            }

            if (hasRecipients && await !!this.page.$eval('.dm-initiate-conversation', e => e.disabled)) {
                await this.page.click('.dm-initiate-conversation')
                await this.page.waitForSelector('.DMComposer-editor')
                await this.page.type('.DMComposer-editor', text)
                await this.page.click('.messaging-text')

                let conversation = {
                    status: 'Message sent',
                    recipients: usernames
                }

                conversation.thread_id = await this.page.$eval('.DMConversation', meta =>
                    meta.getAttribute('data-thread-id')
                )

                return conversation
            } else {
                return {
                    status: 'No valid recipients',
                    recipients: usernames
                }
            }
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Send message to thread
     *
     * @param text
     * @param threadId
     * @returns {Promise<{}>}
     */
    async reply(text, threadId) {
        try {
            await this.page.goto(this.data.baseurl+'/messages', {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.DMInbox-conversationItem')

            await this.page.click('.DMInboxItem[data-thread-id="' + threadId + '"]')

            await this.page.waitForSelector('.DMComposer-editor')
            await this.page.type('.DMComposer-editor', text)
            await this.page.click('.messaging-text')

            let conversation = { status: 'Message sent' }

            conversation.thread_id = await this.page.$eval('.DMConversation', meta =>
                meta.getAttribute('data-thread-id')
            )

            return conversation
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * List latest messages from thread
     *
     * @param threadId
     * @returns {Promise<*>}
     */
    async messages(threadId) {
        try {
            await this.page.goto(this.data.baseurl+'/messages', {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.DMInbox-conversationItem')

            await this.page.click('.DMInboxItem[data-thread-id="' + threadId + '"]')

            await this.page.waitForSelector('.DirectMessage')

            let elements = await this.page.$$('.DirectMessage')
            let messages = []

            for (let element of elements) {
                let message = {}
                message.content = Helpers.trimRight(
                    await element.$eval('.DirectMessage-text', e => e.innerText), '\n'
                )
                message.status = (await element._remoteObject.description).indexOf(
                    'DirectMessage--received') !== -1 ? 'received' : 'sent'

                messages.push(message)
            }

            return messages
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }

    /**
     * Delete message thread
     *
     * @param threadId
     * @returns {Promise<*>}
     */
    async delete(threadId) {
        try {
            await this.page.goto(this.data.baseurl+'/messages', {waitUntil: 'networkidle2'})

            await this.page.waitForSelector('.DMInbox-conversationItem')
            await this.page.click('.DMInboxItem[data-thread-id="' + threadId + '"]')

            await this.page.waitForSelector('.DMConversation-convoSettings')
            await this.page.click('.DMConversation-convoSettings')

            await this.page.waitForSelector('.js-actionDeleteConversation')
            await this.page.click('.js-actionDeleteConversation')

            await this.page.waitForSelector('#confirm_dialog_submit_button')
            await this.page.click('#confirm_dialog_submit_button')

            let response = {}
            response.status = 'Thread deleted'
            response.thread_id = threadId

            return response
        } catch(e) {
            console.log(e)

            return Helpers.wrapError(e)
        }
    }
}

module.exports = DirectMessaging