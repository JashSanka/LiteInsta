const prisma = require("../db");

async function createUser(data) {
  return await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      fullname: data.fullname,
      bio: data.bio !== undefined ? data.bio : null,
    },
  });
}

async function listUsers() {
  return await prisma.user.findMany();
}

async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id: parseInt(id, 10) },
  });
}

async function updateUser(id, data) {
  const updateData = {};
  if (data.fullname !== undefined) updateData.fullname = data.fullname;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;

  return await prisma.user.update({
    where: { id: parseInt(id, 10) },
    data: updateData,
  });
}

async function deleteUser(id) {
  return await prisma.user.delete({
    where: { id: parseInt(id, 10) },
  });
}

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};
