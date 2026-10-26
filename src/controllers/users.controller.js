const usersService = require("../services/users.service");

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
  try {
    const users = await usersService.listUsers();
    return res.status(200).json(users);
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
  update,
  remove,
};
