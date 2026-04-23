export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });
  if (!result.success) {
    return res.status(422).json({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: result.error.issues.map((i) => ({
        field: i.path.slice(1).join('.'),
        issue: i.message,
      })),
    });
  }
  if (result.data.body !== undefined) req.body = result.data.body;
  if (result.data.params !== undefined) req.params = { ...req.params, ...result.data.params };
  if (result.data.query !== undefined) req.query = result.data.query;
  next();
};
