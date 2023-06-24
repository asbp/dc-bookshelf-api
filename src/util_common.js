/* eslint-disable max-depth */
/* eslint-disable object-curly-spacing */
/* eslint-disable indent */
const { HttpError,
    HttpPayloadNotValidError,
    HttpNotFoundError,
} = require('./errors');

const validateInput = (payloadObj, propNames = []) => {
    let result = {};
    let index = 0;

    const handleStringProp = prop => {
        const key = prop;
        const value = payloadObj[key];

        if (typeof value === 'undefined') {
            throw new HttpPayloadNotValidError(`Kolom ${key} harap diisi`);
        }

        addToResult(key, value);
    };

    const addToResult = (key, value) => {
        let valueReal = value;

        if (Number.isNaN(parseInt(value, 10))) {
            valueReal = (value === 'true') || (value === 'false' ? false : value);
        } else {
            valueReal = parseInt(value, 10);
        }

        result = {
            ...result,
            [key]: valueReal,
        };
    };

    // eslint-disable-next-line no-eq-null, eqeqeq
    if (payloadObj == null) {
        throw new HttpPayloadNotValidError('Tidak ada payload');
    }

    for (const prop of propNames) {
        if (typeof prop === 'string') {
            handleStringProp(prop);
        } else if (typeof prop === 'object') {
            const key = Object.keys(prop)[0];
            let value = payloadObj[key];
            const config = Object.values(prop)[0];
            const { validator } = config;
            const transformCallback = config.transform;
            const defaultVal = config.default;
            const optionalFlag = config.optional;
            const errorIfEmpty = config.error_if_empty;
            let alreadyAdded = false;

            if (!key) {
                throw new HttpPayloadNotValidError(`No validation column name at index ${index}`);
            }

            if (!value) {
                if (optionalFlag) {
                    value = defaultVal;
                } else {
                    let errMsg = `${key} must be present in the request payload!`;

                    errMsg = errorIfEmpty ?? errMsg;

                    throw new HttpPayloadNotValidError(errMsg);
                }
            }

            if (typeof transformCallback !== 'undefined') {
                const validResult = transformCallback(value, key, result, payloadObj);

                if (typeof validResult === 'undefined') {
                    throw new HttpPayloadNotValidError(`${key} value is rejected for unknown reason!`);
                } else {
                    addToResult(key, validResult);
                    alreadyAdded = true;
                }
            }

            if (typeof validator !== 'undefined') {
                const validResult = validator(value, key, result, payloadObj);

                if (typeof validResult === 'boolean') {
                    if (validResult === true) {
                        addToResult(key, value);
                        alreadyAdded = true;
                    } else {
                        throw new HttpPayloadNotValidError(`${key} value is rejected for unknown reason!`);
                    }
                } else if (validResult instanceof HttpPayloadNotValidError) {
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
    const hoursOffset = new Date().getTimezoneOffset() / 60;

    const dateInstance = new Date();
    dateInstance.setHours(dateInstance.getHours() - hoursOffset);

    return dateInstance;
};

const select = (arrayOfObj, keys = []) => {
    // eslint-disable-next-line no-eq-null , eqeqeq
    if (keys.length < 1 || arrayOfObj == null) {
        return [];
    }

    const result = [];

    for (const data of arrayOfObj) {
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

    return result;
};

const processException = (e, prependMsg, _) => {
    if (e instanceof HttpNotFoundError || e instanceof HttpPayloadNotValidError || e instanceof HttpError) {
        if (prependMsg) {
            e.message = `${prependMsg}. ${e.message}`;
        }
    }

    throw e;
};

const compileResponse = (h, code, data) => h.response(data)
    .header('cache-control', 'no-cache')
    .type('application/json')
    .code(code);

const compileHttp200 = (h, data) => compileResponse(h, 200, data);

const compileHttp200fromContent = (h, content) => compileResponse(h, 200, {
    status: 'success',
    data: content,
});

const compileHttp200fromMessage = (h, msg) => compileHttp200(h, {
    status: 'success',
    message: String(msg),
});

const compileHttp201fromMessage = (h, msg) => compileResponse(h, 201, {
    status: 'success',
    message: String(msg),
});

const findBook = (booksArray, id) => {
    const findBookIdx = findBookIndex(booksArray, id);

    return findBookIdx > -1 ? booksArray[findBookIdx] : undefined;
};

const findBookIndex = (booksArray, id) => booksArray.findIndex(v => v.id === id);

// eslint-disable-next-line max-params
const checkBook = (req, books, h, bookId, msgIfNotFound = 'ID tidak ditemukan') => {
    const book = findBook(books, bookId);

    if (!book) {
        throw new HttpNotFoundError(msgIfNotFound);
    }

    return compileResponse(h, 200, {
        status: 'success',
        data: {
            book,
        },
    });
};

const findBookOrThrow404 = (booksArray, id, msgIfNotFound = 'ID tidak ditemukan') => {
    const result = findBook(booksArray, id);

    if (!result) {
        throw new HttpNotFoundError(msgIfNotFound);
    }

    return result;
};

const findBookIndexOr404 = (booksArray, id, msgIfNotFound = 'ID tidak ditemukan') => {
    const findBookIdx = findBookIndex(booksArray, id);

    if (findBookIdx < 0) {
        throw new HttpNotFoundError(msgIfNotFound);
    }

    return findBookIdx;
};

const withErrorHandling = (callback, req, h) => {
    try {
        return callback(req, h);
    } catch (e) {
        const data = {
            status: 'fail',
            message: e.message,
        };
        let code = 500;

        if (e instanceof HttpNotFoundError) {
            code = 404;
        }

        if (e instanceof HttpPayloadNotValidError) {
            code = 400;
        }

        if (e instanceof HttpError) {
            code = e.code;
        }

        return compileResponse(h, code, data);
    }
};

const getBookPayload = req => validateInput(req.payload, [
    {
        name: {
            // eslint-disable-next-line camelcase
            error_if_empty: 'Mohon isi nama buku',
        },
    },
    'year',
    'author',
    'summary',
    'publisher',
    'pageCount',
    {
        readPage: {
            validator(value, _, passedPayload) {
                if (value <= Number(passedPayload.pageCount)) {
                    return true;
                }

                throw new HttpPayloadNotValidError('readPage tidak boleh lebih besar dari pageCount');
            },
        },
    },
    'reading',
]);

module.exports = {
    HttpPayloadNotValidError, validateInput,
    getLocalDateObj, select, processException, findBook,
    compileResponse, compileHttp200, compileHttp200fromContent,
    compileHttp200fromMessage,
    checkBook,
    findBookIndex, findBookOrThrow404, findBookIndexOr404,
    compileHttp201fromMessage,
    getBookPayload,
    withErrorHandling,
};
