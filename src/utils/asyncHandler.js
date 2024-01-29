/*const asyncHandler = (requestHandler) => {
    return (err,req, res, next) => {
        Promise.resolve(requestHandler(err,req, res, next))
            .catch((err) => next(err)); // Propagate the error to the express error handling middleware
    };
};*/

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err)); // Propagate the error to the express error handling middleware
    };
};

export { asyncHandler };

