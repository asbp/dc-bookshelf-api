/* eslint-disable eqeqeq */

/* eslint-disable indent */
class ArrayOfObjectQueryBuilder {
    #arrayOfObj;
    #arrayOrig;

    constructor(arrOfObjs) {
        this.#arrayOfObj = arrOfObjs;
        this.#arrayOrig = [];
    }

    get contents() {
        return this.#arrayOfObj;
    }

    getContents() {
        return this.#arrayOfObj;
    }

    _backupOriginal() {
        this.#arrayOrig = this.#arrayOfObj;
    }

    reset() {
        this.#arrayOfObj = this.#arrayOrig;
        return this;
    }

    select(keys) {
        const result = [];

        for (const data of this.#arrayOfObj) {
            let newObj = {};

            for (const key of keys) {
                const value = data[key];

                if (typeof value === 'undefined') {
                    continue;
                }

                newObj = {
                    ...newObj,
                    [key]: value,
                };
            }

            result.push(newObj);
        }

        this._backupOriginal();

        this.#arrayOfObj = result;

        return this;
    }

    where(column, term) {
        let result = [];

        result = this.#arrayOfObj.filter(value => value[column] == term);

        this.#arrayOfObj = result;

        return this;
    }
}

module.exports = ArrayOfObjectQueryBuilder;
