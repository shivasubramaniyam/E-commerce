export const validate =
  (schema, property = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      return res.status(400).json({
        message: "Validate failed",
        errors: result.error.flatItem().fieldErrors,
      });
    }

    req[property] = result.data;
    next();
  };
