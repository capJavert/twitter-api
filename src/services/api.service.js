/**
 * ApiService
 *
 * manages API keys issued by server
 *
 */
class ApiService {
    constructor() {
        this.keys = [
            '41872b21-08aa-4a0b-8623-dc1fac0e1fae' // TODO hardcoded API key for dev purposes
        ]
    }

    createKey() {
        const key = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function ( c ) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString( 16 );
        })
        this.keys.push(key)

        return key
    }

    deleteKey(key) {
        const keyIndex = this.keys.indexOf(key)

        if (keyIndex > -1) {
            this.keys.splice(keyIndex, 1)

            return true
        } else {
            return false
        }
    }

    isKeyValid(key) {
        return this.keys.indexOf(key) !== -1
    }
}

module.exports = ApiService