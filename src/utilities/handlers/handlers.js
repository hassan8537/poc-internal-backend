exports.handlers = {
  logger: {
    success: ({
      object_type,
      code = 200,
      status = 1,
      message,
      data = null
    }) => {
      console.info({ object_type, code, status, message, data });
    },
    failed: ({ object_type, code = 400, status = 0, message, data = null }) => {
      console.info({ object_type, code, status, message, data });
    },
    error: ({ object_type, code = 500, status = 0, message, data = null }) => {
      console.info({ object_type, code, status, message, data });
    },
    unavailable: ({
      object_type,
      code = 404,
      status = 0,
      message,
      data = null
    }) => {
      console.info({ object_type, code, status, message, data });
    },
    unauthorized: ({
      object_type,
      code = 403,
      status = 1,
      message,
      data = null
    }) => {
      console.info({ object_type, code, status, message, data });
    }
  },
  response: {
    success: ({ res, code = 200, status = 1, message, data = null }) => {
      return res.status(code).send({
        status,
        message,
        data
      });
    },
    failed: ({ res, code = 400, status = 0, message, data = null }) => {
      return res.status(code).send({
        status,
        message,
        data
      });
    },
    error: ({ res, code = 500, status = 0, message, data = null }) => {
      return res.status(code).send({
        status,
        message,
        data
      });
    },
    unavailable: ({ res, code = 404, status = 0, message, data = null }) => {
      return res.status(code).send({
        status,
        message,
        data
      });
    },
    unauthorized: ({ res, code = 403, status = 1, message, data = null }) => {
      return res.status(code).send({
        status,
        message,
        data
      });
    }
  },
  event: {
    success: ({
      object_type,
      code = 200,
      status = 1,
      message,
      data = null
    }) => {
      return {
        object_type,
        code,
        status,
        message,
        data
      };
    },
    failed: ({ object_type, code = 400, status = 0, message, data = null }) => {
      return {
        object_type,
        code,
        status,
        message,
        data
      };
    },
    error: ({ object_type, code = 500, status = 0, message, data = null }) => {
      return {
        object_type,
        code,
        status,
        message,
        data
      };
    },
    unavailable: ({
      object_type,
      code = 404,
      status = 0,
      message,
      data = null
    }) => {
      return {
        object_type,
        code,
        status,
        message,
        data
      };
    },
    unauthorized: ({
      object_type,
      code = 403,
      status = 1,
      message,
      data = null
    }) => {
      return {
        object_type,
        code,
        status,
        message,
        data
      };
    }
  }
};
