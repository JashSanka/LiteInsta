const likesService = require("../services/likes.service");
const postsService = require("../services/posts.service");
const usersService = require("../services/users.service");

async function list(req, res) {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const postExists = await postsService.checkPostExists(postId);
    if (!postExists) {
      return res.status(404).json({ error: "Post not found" });
    }

    const likes = await likesService.getLikesByPostId(postId);
    return res.status(200).json(likes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function create(req, res) {
  const postId = parseInt(req.params.id, 10);
  const { userId } = req.body || {};

  // 1. Missing userId
  if (userId === undefined || userId === null || userId === "") {
    return res.status(400).json({ error: "userId is required" });
  }

  const userIdNum = parseInt(userId, 10);

  try {
    // 2. Missing post
    if (isNaN(postId)) {
      return res.status(404).json({ error: "Post not found" });
    }
    const postExists = await postsService.checkPostExists(postId);
    if (!postExists) {
      return res.status(404).json({ error: "Post not found" });
    }

    // 3. Missing user
    if (isNaN(userIdNum)) {
      return res.status(404).json({ error: "User not found" });
    }
    const userExists = await usersService.checkUserExists(userIdNum);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    // 4. Duplicate like or create
    const like = await likesService.createLike(postId, userIdNum);
    return res.status(201).json({
      userId: like.userId,
      postId: like.postId,
      createdAt: like.createdAt,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Already liked" });
    }
    return res.status(500).json({ error: error.message });
  }
}

async function remove(req, res) {
  const postId = parseInt(req.params.id, 10);
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(postId) || isNaN(userId)) {
    return res.status(404).json({ error: "Like not found" });
  }

  try {
    await likesService.deleteLike(postId, userId);
    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Like not found" });
    }
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  list,
  create,
  remove,
};
