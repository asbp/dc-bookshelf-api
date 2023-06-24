/* eslint-disable indent */
const { HttpError,
    HttpPayloadNotValidError,
    HttpNotFoundError } = require('./errors');

const validateInput = (payloadObj, propNames = []) => {
    let result = {};
    let index = 0;

    const handleStringProp = (prop) => {
        const key = prop;
        const value = payloadObj[key];

        if (typeof value === "undefined") {
            throw new ValidationException(`Kolom ${key} harap diisi`);
        }

        addToResult(key, value);
    };

    const addToResult = (key, value) => {
        let valueReal = value;

        if (!Number.isNaN(parseInt(value))) {
            valueReal = parseInt(value)
        } else {
            valueReal = (value === 'true') || (value === 'false' ? false : value);
        }

        result = { ...result, [key]: valueReal };
    };

    if (payloadObj == null) {
        throw new ValidationException("Tidak ada payload");
    }

    for (let prop of propNames) {
        if (typeof prop === "string") {
            handleStringProp(prop);

        } else if (typeof prop === "object") {
            const key = Object.keys(prop)[0];
            let value = payloadObj[key];
            const config = Object.values(prop)[0];
            const validator = config['validator'];
            const transformCallback = config['transform'];
            const defaultVal = config['default'];
            const optionalFlag = config['optional'];
            const errorIfEmpty = config['error_if_empty'];
            let alreadyAdded = false;

            if (!key) {
                throw new ValidationException(`No validation column name at index ${index}`);
            }

            if (!value) {
                if (optionalFlag) {
                    value = defaultVal;
                }
                else {
                    let errMsg = `${key} must be present in the request payload!`;

                    if (errorIfEmpty) {
                        errMsg = errorIfEmpty;
                    }

                    throw new ValidationException(errMsg);
                }
            }

            if (typeof transformCallback !== "undefined") {
                let validResult = transformCallback(value, key, result, payloadObj);

                if (typeof validResult !== "undefined") {
                    addToResult(key, validResult);
                    alreadyAdded = true;
                } else {
                    throw new ValidationException(`${key} value is rejected for unknown reason!`);
                }
            }

            if (typeof validator !== "undefined") {
                let validResult = validator(value, key, result, payloadObj);

                if (typeof validResult === "boolean") {
                    if (validResult === true) {
                        addToResult(key, value);
                        alreadyAdded = true;
                    }
                    else {
                        throw new ValidationException(`${key} value is rejected for unknown reason!`);
                    }
                }
                else if (validResult instanceof ValidationException) {
                    throw validResult;
                }
            }

            if (!alreadyAdded) {
                addToResult(key, value);
            }
        }
        index++;
    }
    return result;
};

const getLocalDateObj = () => {
    let hoursOffset = new Date().getTimezoneOffset() / 60

    let dateInstance = new Date();
    dateInstance.setHours(dateInstance.getHours() - hoursOffset);

    return dateInstance;
}

const select = (arrayOfObj, keys = []) => {
    if (keys.length < 1 || arrayOfObj == null) return [];
    let result = [];

    for (let data of arrayOfObj) {
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
    return result;
};

const processException = (e, prependMsg, h) => {
    let data = {
        "status": "fail",
        "message": "Error while processing. Please try again."
    };
    let statusCode = 500;

    if (e instanceof ValidationException) {
        data = {
            "status": "fail",
            "message": `${prependMsg}. ${e.message}`
        }
        statusCode = 400;
    }

    return compileResponse(h, statusCode, data)
}

const compileResponse = (h, code, data) => {
    return h.response(data)
        .header('cache-control', 'no-cache')
        .type('application/json')
        .code(code);
}

const findBook = (booksArray, id) => {
    let findBookIdx = findBookIndex(booksArray, id);

    return findBookIdx > -1 ? booksArray[findBookIdx] : undefined;
}

const findBookIndex = (booksArray, id) => booksArray.findIndex(v => v.id === id)

const checkBook = (req, books, h, bookId, msgIfNotFound = "ID tidak ditemukan") => {
    let book = findBook(books, bookId);

    if (!book) {
        throw new HttpNotFoundError(msgIfNotFound);
    }

    return compileResponse(h, 200, {
        "status": "success",
        "data": {
            "book": book
        }
    });
}

//
const __checkBook = (req, books, h, bookId, msgIfNotFound = "ID tidak ditemukan") => {
    let book = findBook(books, bookId);

    if (!book) {
        return compileResponse(h, 404, {
            "status": "fail",
            "message": msgIfNotFound
        })
    }

    return compileResponse(h, 200, {
        "status": "success",
        "data": {
            "book": book
        }
    });
}

module.exports = {
    ValidationException, validateInput,
    getLocalDateObj, select, processException, findBook,
    compileResponse,
    checkBook, findBookIndex
}