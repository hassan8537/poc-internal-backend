const { handlers } = require("../handlers/handlers");

const pagination = async ({
  res,
  table,
  model,
  filters = {},
  page = 1,
  limit = 10,
  sort = { createdAt: -1 },
  populate = null
}) => {
  try {
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;
    let data = [];
    let totalCount = 0;

    if (filters.location && filters.max_distance) {
      // Geo-based query
      const { location, max_distance } = filters;

      const geoQuery = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: location },
            distanceField: "distance",
            maxDistance: max_distance,
            spherical: true
          }
        }
      ];

      data = await model.aggregate([
        ...geoQuery,
        { $sort: sort },
        { $skip: skip },
        { $limit: pageSize }
      ]);

      totalCount = (await model.aggregate(geoQuery)).length;
    } else {
      // Standard pagination
      const query = model.find(filters).skip(skip).limit(pageSize).sort(sort);

      if (populate) {
        query.populate(populate);
      }

      data = await query.exec();
      totalCount = await model.countDocuments(filters);
    }

    if (!data.length) {
      handlers.logger.unavailable({
        message: `No ${table.toLowerCase()} found.`
      });

      return handlers.response.unavailable({
        res,
        message: `No ${table.toLowerCase()} found.`
      });
    }

    const responseData = {
      results: data,
      total_records: totalCount,
      total_pages: Math.ceil(totalCount / pageSize),
      current_page: pageNumber,
      page_size: pageSize
    };

    handlers.logger.success({
      message: `${table} retrieved successfully.`,
      data: responseData
    });

    return handlers.response.success({
      res,
      message: `${table} retrieved successfully.`,
      data: responseData
    });
  } catch (error) {
    handlers.logger.error({
      message: `Pagination error for ${table}: ${error.message}`
    });

    return handlers.response.error({
      res,
      message: "Failed to retrieve records."
    });
  }
};

module.exports = pagination;
