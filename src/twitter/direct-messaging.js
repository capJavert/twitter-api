
class DirectMessaging {
    constructor(page, data) {
        this.page = page
        this.data = data
    }

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
                        conversationMeta.id = meta.getAttribute('data-thread-id')
                        conversationMeta.last_message_id = +meta.getAttribute('data-last-message-id')
                        conversationMeta.is_muted = meta.getAttribute('data-is-muted') === 'true'

                        return conversationMeta
                    })
                }
                conversation.timestamp = await element.$eval('.DMInboxItem-timestamp ._timestamp', meta =>
                    +meta.getAttribute('data-time')
                )

                conversations.push(conversation)
            }

            // console.log(conversations)

            return conversations
        } catch(e) {
            console.log(e)

            return false
        }
    }

    async create(text, username) {

    }

    async reply(text, messageId) {

    }

    async delete(messageId) {

    }
}

module.exports = DirectMessaging