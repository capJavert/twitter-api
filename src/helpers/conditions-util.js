/**
 * Utils used for condition checking
 */
class ConditionsUtil {
    static isNull(value) {
        return value === null || value === undefined
    }

    static isNotNull(value) {
        return value !== null && value !== undefined
    }

    static isTrue(value) {
        return value === true
    }

    static isFalse(value) {
        return value === false
    }

    static isNullOrEmpty(value) {
        return value === null
            || value === undefined
            || ((typeof value === 'string' || value instanceof String) && value.trim().length === 0)
    }

    static isNotNullNorEmpty(values) {
        if (this.isNull(values)) {
            return false
        }
        for (let i = 0; i < values.length; i++) {
            let value = values[i]
            if (value === null) { return false }
            if (value === undefined) { return false }
            if ((typeof value === 'string' || value instanceof String) && value.trim().length === 0) { return false }
            if (Array.isArray(value) && value.length === 0) { return false }
        }
        return true
    }
}

module.exports = ConditionsUtil
