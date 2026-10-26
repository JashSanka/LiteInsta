const postsService = require("../services/posts.service");
const usersService = require("../services/users.service");
const { parsePagination, formatPaginatedResponse } = require("../utils/pagination");

async function create(req, res) {
  const { imageUrl, authorId, caption, location } = req.body || {};
  if (!imageUrl || !authorId) {
    return res.status(400).json({ error: "imageUrl and authorId are required" });
  }

  const authorIdNum = parseInt(authorId, 10);
  if (isNaN(authorIdNum)) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const authorExists = await usersService.checkUserExists(authorIdNum);
    if (!authorExists) {
      return res.status(404).json({ error: "User not found" });
    }

    const post = await postsService.createPost({
      imageUrl,
      authorId: authorIdNum,
      caption,
      location,
    });
    return res.status(201).json(post);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function list(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  const { sortBy = "createdAt", order = "desc", location, search, from, to } = req.query;

  const allowedSortBy = ["createdAt", "updatedAt", "likes"];
  if (!allowedSortBy.includes(sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, updatedAt, likes" });
  }

  if (order !== "asc" && order !== "desc") {
    return res.status(400).json({ error: "order must be asc or desc" });
  }

  const where = {};

  if (location) {
    where.location = { equals: location, mode: "insensitive" };
  }

  if (search) {
    where.caption = { contains: search, mode: "insensitive" };
  }

  let fromDate;
  let toDate;

  if (from !== undefined) {
    fromDate = new Date(from);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ error: "from and to must be valid dates" });
    }
  }

  if (to !== undefined) {
    toDate = new Date(to);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ error: "from and to must be valid dates" });
    }
  }

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lt = toDate;
  }

  let orderBy;
  if (sortBy === "likes") {
    orderBy = [{ likes: { _count: order } }, { createdAt: "desc" }];
  } else {
    orderBy = [{ [sortBy]: order }];
  }

  try {
    const { data, total } = await postsService.listPosts({
      skip: pagination.skip,
      take: pagination.limit,
      where,
      orderBy,
    });

    return res.status(200).json(formatPaginatedResponse(data, total, pagination.page, pagination.limit));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getOne(req, res) {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const post = await postsService.getPostById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function update(req, res) {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) {
    return res.status(404).json({ error: "Post not found" });
  }

  const { caption, location } = req.body || {};
  const updateData = {};
  if (caption !== undefined) updateData.caption = caption;
  if (location !== undefined) updateData.location = location;

  try {
    const post = await postsService.updatePost(postId, updateData);
    return res.status(200).json(post);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(500).json({ error: error.message });
  }
}

async function remove(req, res) {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    await postsService.deletePost(postId);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
};
