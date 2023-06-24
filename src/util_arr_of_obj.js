class ArrayOfObjectQueryBuilder {
    #arrayOfObj;
    #arrayOrig;

    constructor(arrOfObjs) {
        this.#arrayOfObj = arrOfObjs;
        this.#arrayOrig = [];
    }

    get contents() {
        return this.#arrayOfObj
    }

    _backupOriginal() {
        this.#arrayOrig = this.#arrayOfObj;
    }

    reset() {
        this.#arrayOfObj = this.#arrayOrig;
        return this;
    }

    select(keys) {
        //if (keys.length < 1 || this.#arrayOfObj == null) return [];

        let result = [];

        for (let data of this.#arrayOfObj) {
            let newObj = {};

            for (let key of keys) {
                let value = data[key];

                if (typeof value === "undefined") continue;

                newObj = {
                    ...newObj,
                    [key]: value
                };
            }
            result.push(newObj);
        }

        this._backupOriginal();

        this.#arrayOfObj = result;

        return this;
    }

    where(column, term) {
        //if (keys.length < 1 || this.#arrayOfObj == null) return [];

        let result = [];

        this.#arrayOfObj = this.#arrayOfObj.filter((value, index, array) => value[column] === term);

        return this;
    }
}

module.exports = ArrayOfObjectQueryBuilder;