/**
 * API Response Utilities
 */

const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

const created = (res, data, message = 'Created successfully') => success(res, data, message, 201);

const paginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true, message, data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  });
};

const error = (res, message = 'Error', statusCode = 500, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

const notFound = (res, message = 'Not found') => error(res, message, 404);
const badRequest = (res, message = 'Bad request', errors = null) => error(res, message, 400, errors);
const unauthorized = (res, message = 'Unauthorized') => error(res, message, 401);
const forbidden = (res, message = 'Forbidden') => error(res, message, 403);
const conflict = (res, message = 'Already exists') => error(res, message, 409);

module.exports = { success, created, paginated, error, notFound, badRequest, unauthorized, forbidden, conflict };
