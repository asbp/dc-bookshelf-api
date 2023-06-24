/* eslint-disable indent */
class HttpError extends Error {
    constructor(code, message) {
        super(message);

        this.code = code;
        this.name = 'HttpError';
    }
}

class HttpPayloadNotValidError extends HttpError {
    constructor(message) {
        super(400, message);

        this.name = 'HttpNotFoundError';
    }
}

class HttpNotFoundError extends HttpError {
    constructor(message) {
        super(404, message);

        this.name = 'HttpNotFoundError';
    }
}

module.exports = {
    HttpError, HttpPayloadNotValidError, HttpNotFoundError,
};
