const { ValidationException, validateInput,
    getLocalDateObj, select, processException, findBook,
    compileResponse, checkBook,
    findBookIndex
} = require("./utils");
const { nanoid } = require('nanoid');

const books = require("./books")

const bookListsHander = (req, h) => {
    const response = {
        "status": "success",
        "data": {
            "books": select(books, ["id", "name", "publisher"])
        }
    };

    return h.response(response)
        .header('cache-control', 'no-cache')
        .type('application/json');
}

const bookDetailHandler = (req, h) => {
    const { id } = req.params;

    return checkBook(req, h, id, "Buku tidak ditemukan");
}
const addBookHandler = (req, h) => {
    try {
        const payload = validateInput(req.payload, [
            {
                "name": {
                    "error_if_empty": "Mohon isi nama buku"
                }
            },
            "year",
            "author",
            "summary",
            "publisher",
            "pageCount",
            {
                "readPage": {
                    "validator": (value, key, passedPayload, rawPayload) => {
                        if (value <= Number(passedPayload['pageCount'])) {
                            return true;
                        } else {
                            return new ValidationException("readPage tidak boleh lebih besar dari pageCount");
                        }
                    }
                }
            },
            "reading"
        ]);

        const newBookData = {
            id: nanoid(16),
            ...payload,
            finished: payload.readPage == payload.pageCount,
            insertedAt: getLocalDateObj(),
            updatedAt: getLocalDateObj(),
        }

        books.push(newBookData)

        return compileResponse(h, 201, {
            "status": "success",
            "message": "Buku berhasil ditambahkan",
            "data": {
                "bookId": newBookData['id']
            }
        })
    } catch (e) {
        return processException(e, "Gagal menambahkan buku", h);
    }
}

const editBookHandler = (req, h) => {
    const { bookId } = req.params;

    let book = checkBook(req, h, bookId, "Gagal memperbarui buku. Id tidak ditemukan");

    if (book.statusCode !== 200) return book;

    try {
        const payload = validateInput(req.payload, [
            {
                "name": {
                    "error_if_empty": "Nama buku harap diisi"
                }
            },
            "year",
            "author",
            "summary",
            "publisher",
            "pageCount",
            {
                "readPage": {
                    "validator": (value, key, passedPayload, rawPayload) => {
                        if (value < Number(passedPayload['pageCount'])) {
                            return true;
                        } else {
                            return new ValidationException("readPage tidak boleh lebih besar dari pageCount");
                        }
                    }
                }
            },
            "reading"
        ]);

        const bookIndex = findBookIndex(bookId)
        const updatedAt = getLocalDateObj();

        books[bookIndex] = {
            ...books[bookIndex],
            ...payload,
            finished: payload.readPage == payload.pageCount,
            updatedAt: updatedAt
        }

        return h.response({
            "status": "success",
            "message": "Buku berhasil diperbarui",
        })
            .header('cache-control', 'no-cache')
            .type('application/json');
    } catch (e) {
        return processException(e, "Gagal memperbarui buku", h);
    }
}

const deleteBookHandler = (req, h) => {
    const { bookId } = req.params;

    let book = checkBook(req, h, bookId, "Buku gagal dihapus. Id tidak ditemukan");

    if (book.statusCode !== 200) return book;

    const bookIndex = findBookIndex(bookId);

    books.splice(bookIndex, 1);

    return compileResponse(h, 200, {
        "status": "success",
        "message": "Buku berhasil dihapus.",
    })
}

module.exports = {
    bookListsHander, bookDetailHandler,
    addBookHandler, editBookHandler, deleteBookHandler
}