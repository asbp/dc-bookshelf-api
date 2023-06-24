const hapi = require("@hapi/hapi");

const {
    bookListsHander, bookDetailHandler,
    addBookHandler, editBookHandler, deleteBookHandler
} = require("./handlers");

const main = async () => {
    const server = hapi.server({
        port: 9000,
        host: process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0',
    });

    server.route([
        {
            path: "/books",
            method: "GET",
            handler: bookListsHander
        },
        {
            method: 'GET',
            path: '/books/{id}',
            handler: bookDetailHandler
        },
        {
            path: "/books",
            method: "POST",
            handler: addBookHandler
        },
        {
            path: "/books/{bookId}",
            method: "PUT",
            handler: editBookHandler
        }, {
            path: "/books/{bookId}",
            method: "DELETE",
            handler: deleteBookHandler
        }
    ])

    await server.start();
    console.log(`Server running on ${server.info.uri}`);
}

main();