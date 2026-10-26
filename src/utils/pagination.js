function parsePagination(query) {
  let { page = "1", limit = "10" } = query;

  // Convert to string in case numbers were passed
  const pageStr = String(page).trim();
  const limitStr = String(limit).trim();

  const isPositiveInteger = (str) => /^[1-9]\d*$/.test(str);

  if (!isPositiveInteger(pageStr) || !isPositiveInteger(limitStr)) {
    return {
      error: "page and limit must be positive integers",
    };
  }

  let pageNum = parseInt(pageStr, 10);
  let limitNum = parseInt(limitStr, 10);

  if (limitNum > 50) {
    limitNum = 50;
  }

  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip,
  };
}

function formatPaginatedResponse(data, total, page, limit) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

module.exports = {
  parsePagination,
  formatPaginatedResponse,
};
