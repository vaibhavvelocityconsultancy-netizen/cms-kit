const asyncHandler = (requestHandler) => {
  return async (...args) => {
    try {
      return await requestHandler(...args);
    } catch (err) {
      console.error("🔥 BACKEND ERROR:", err);

      let message = err?.message || "Internal Server Error";
      let statusCode = err?.statusCode || 500;
      let errors = [];

      if (Array.isArray(err?.errors) && err.errors.length) {
        errors = err.errors;
      }

      const lowerMessage = message.toLowerCase();

      // Prisma readable errors
      if (
        lowerMessage.includes("expected int") ||
        lowerMessage.includes("invalid value provided")
      ) {
        message = "Invalid data type provided";
      } else if (lowerMessage.includes("foreign key constraint")) {
        message = "Related record not found";
      } else if (
        lowerMessage.includes("unique constraint") ||
        lowerMessage.includes("already exists") ||
        err?.code === "P2002" ||
        (lowerMessage.includes("slug") &&
          lowerMessage.includes("already taken"))
      ) {
        message = "A record with the same value already exists.";
        statusCode = 409;
      }

      return Response.json(
        {
          success: false,
          message,
          errors: process.env.NODE_ENV === "development" ? errors : [],
          data: null,
        },
        {
          status: statusCode,
        },
      );
    }
  };
};

export { asyncHandler };
