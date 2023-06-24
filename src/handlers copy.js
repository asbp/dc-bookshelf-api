const { ValidationException, validateInput,
    getLocalDateObj, select, processException, findBook,
    compileResponse, checkBook,
    findBookIndex
} = require("./util_common");
const { nanoid } = require('nanoid');
const ArrayOfObjectQueryBuilder = require("./util_arr_of_obj")

const books = require("./books")

const bookListsHander = (req, h) => {
    const { reading, finished } = req.query;

    let myBooks = new ArrayOfObjectQueryBuilder(books);

    if (reading != null || reading == "0") {
        myBooks.where("reading", Boolean(reading));
    }

    if (finished != null || finished == "0") {
        myBooks.where("finished", Boolean(finished));
    }

    myBooks.select(["id", "name", "publisher"]);

    const response = {
        "status": "success",
        "data": {
            "books": myBooks.contents
        }
    };

    return compileResponse(h, 200, response);
}

const bookDetailHandler = (req, h) => {
    const { id } = req.params;

    return checkBook(req, books, h, id, "Buku tidak ditemukan");
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

    let book = checkBook(req, books, h, bookId, "Gagal memperbarui buku. Id tidak ditemukan");

    if (book.statusCode !== 200) return book;

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

        const bookIndex = findBookIndex(books, bookId)
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

    let book = checkBook(req, books, h, bookId, "Buku gagal dihapus. Id tidak ditemukan");

    if (book.statusCode !== 200) return book;

    const bookIndex = findBookIndex(books, bookId);

    books.splice(bookIndex, 1);

    return compileResponse(h, 200, {
        "status": "success",
        "message": "Buku berhasil dihapus",
    })
}

module.exports = {
    bookListsHander, bookDetailHandler,
    addBookHandler, editBookHandler, deleteBookHandler
}
