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

}

const editBookHandler = (req, h) => {

}

const deleteBookHandler = (req, h) => {

}

module.exports = {
    bookListsHander, bookDetailHandler,
    addBookHandler, editBookHandler, deleteBookHandler
}