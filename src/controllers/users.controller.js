const usersService = require("../services/users.service");
const { parsePagination, formatPaginatedResponse } = require("../utils/pagination");

async function create(req, res) {
  const { username, email, fullname, bio } = req.body || {};
  if (!username || !email || !fullname) {
    return res.status(400).json({ error: "username, email and fullname are required" });
  }

  try {
    const user = await usersService.createUser({ username, email, fullname, bio });
    return res.status(201).json(user);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "username or email already taken" });
    }
    return res.status(500).json({ error: error.message });
  }
}

async function list(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  const { sortBy = "createdAt", order = "desc", isPrivate, search, hasPosts } = req.query;

  const allowedSortBy = ["createdAt", "username", "fullname"];
  if (!allowedSortBy.includes(sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, username, fullname" });
  }

  if (order !== "asc" && order !== "desc") {
    return res.status(400).json({ error: "order must be asc or desc" });
  }

  const where = {};

  if (isPrivate !== undefined) {
    if (isPrivate === "true") {
      where.isPrivate = true;
    } else if (isPrivate === "false") {
      where.isPrivate = false;
    } else {
      return res.status(400).json({ error: "isPrivate must be true or false" });
    }
  }

  if (hasPosts !== undefined) {
    if (hasPosts === "true") {
      where.posts = { some: {} };
    } else if (hasPosts === "false") {
      where.posts = { none: {} };
    } else {
      return res.status(400).json({ error: "hasPosts must be true or false" });
    }
  }

  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { fullname: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy = { [sortBy]: order };

  try {
    const { data, total } = await usersService.listUsers({
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
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const user = await usersService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getUserPosts(req, res) {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(404).json({ error: "User not found" });
  }

  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  try {
    const exists = await usersService.checkUserExists(userId);
    if (!exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const { data, total } = await usersService.getUserPosts(userId, {
      skip: pagination.skip,
      take: pagination.limit,
    });

    return res.status(200).json(formatPaginatedResponse(data, total, pagination.page, pagination.limit));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getUserLikedPosts(req, res) {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(404).json({ error: "User not found" });
  }

  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  try {
    const exists = await usersService.checkUserExists(userId);
    if (!exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const { data, total } = await usersService.getUserLikedPosts(userId, {
      skip: pagination.skip,
      take: pagination.limit,
    });

    return res.status(200).json(formatPaginatedResponse(data, total, pagination.page, pagination.limit));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function update(req, res) {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(404).json({ error: "User not found" });
  }

  const { fullname, bio, isPrivate } = req.body || {};
  const updateData = {};
  if (fullname !== undefined) updateData.fullname = fullname;
  if (bio !== undefined) updateData.bio = bio;
  if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

  try {
    const user = await usersService.updateUser(userId, updateData);
    return res.status(200).json(user);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: error.message });
  }
}

async function remove(req, res) {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    await usersService.deleteUser(userId);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  create,
  list,
  getOne,
  getUserPosts,
  getUserLikedPosts,
  update,
  remove,
};
