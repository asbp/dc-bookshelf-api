/* eslint-disable no-eq-null */
/* eslint-disable eqeqeq */
/* eslint-disable object-curly-spacing */
/* eslint-disable indent */

const {
    getLocalDateObj, processException,
    compileResponse,
    findBookOrThrow404,
    compileHttp200fromContent,
    compileHttp200fromMessage,
    getBookPayload,
    findBookIndexOr404,
} = require('./util_common');
const { nanoid } = require('nanoid');
const ArrayOfObjectQueryBuilder = require('./util_arr_of_obj');

const books = require('./books');

const bookListsHander = (req, h) => {
    const { reading, finished } = req.query;

    const myBooks = new ArrayOfObjectQueryBuilder(books);

    if (reading != null) {
        myBooks.where('reading', Boolean(reading == '1'));
    }

    if (finished != null) {
        myBooks.where('finished', Boolean(finished == '1'));
    }

    myBooks.select(['id', 'name', 'publisher']);

    return compileHttp200fromContent(h, {
        books: myBooks.getContents(),
    });
};

const bookDetailHandler = (req, h) => {
    const { id } = req.params;

    const book = findBookOrThrow404(books, id, 'Buku tidak ditemukan');

    return compileHttp200fromContent(h, {
        book,
    });
};

const addBookHandler = (req, h) => {
    try {
        const payload = getBookPayload(req);

        const newBookData = {
            id: nanoid(16),
            ...payload,
            finished: payload.readPage == payload.pageCount,
            insertedAt: getLocalDateObj(),
            updatedAt: getLocalDateObj(),
        };

        books.push(newBookData);

        return compileResponse(h, 201, {
            status: 'success',
            message: 'Buku berhasil ditambahkan',
            data: {
                bookId: newBookData.id,
            },
        });
    } catch (e) {
        processException(e, 'Gagal menambahkan buku', h);
    }
};

const editBookHandler = (req, h) => {
    const { bookId } = req.params;

    const bookIdx = findBookIndexOr404(books, bookId, 'Gagal memperbarui buku. Id tidak ditemukan');

    try {
        const payload = getBookPayload(req);

        const updatedAt = getLocalDateObj();

        books[bookIdx] = {
            ...books[bookIdx],
            ...payload,
            finished: payload.readPage == payload.pageCount,
            updatedAt,
        };

        return compileHttp200fromMessage(h, 'Buku berhasil diperbarui');
    } catch (e) {
        processException(e, 'Gagal memperbarui buku', h);
    }
};

const deleteBookHandler = (req, h) => {
    const { bookId } = req.params;

    const bookIdx = findBookIndexOr404(books, bookId, 'Buku gagal dihapus. Id tidak ditemukan');

    books.splice(bookIdx, 1);

    return compileHttp200fromMessage(h, 'Buku berhasil dihapus');
};

module.exports = {
    bookListsHander, bookDetailHandler,
    addBookHandler, editBookHandler, deleteBookHandler,
};
