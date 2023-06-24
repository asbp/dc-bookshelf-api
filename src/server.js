/* eslint-disable indent */

const hapi = require('@hapi/hapi');

const {
    bookListsHander, bookDetailHandler,
    addBookHandler, editBookHandler, deleteBookHandler,
} = require('./handlers');

const {
    withErrorHandling,
} = require('./util_common');

const main = async () => {
    const server = hapi.server({
        port: 9000,
        host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
        routes: {
            cors: {
                origin: ['*'],
            },
        },
    });

    server.route([
        {
            path: '/books',
            method: 'GET',
            handler: (req, h) => withErrorHandling(bookListsHander, req, h),
        },
        {
            method: 'GET',
            path: '/books/{id}',
            handler: (req, h) => withErrorHandling(bookDetailHandler, req, h),
        },
        {
            path: '/books',
            method: 'POST',
            handler: (req, h) => withErrorHandling(addBookHandler, req, h),
        },
        {
            path: '/books/{bookId}',
            method: 'PUT',
            handler: (req, h) => withErrorHandling(editBookHandler, req, h),
        },
        {
            path: '/books/{bookId}',
            method: 'DELETE',
            handler: (req, h) => withErrorHandling(deleteBookHandler, req, h),
        },
    ]);

    await server.start();
    console.log(`Server running on ${server.info.uri}`);
};

main();
