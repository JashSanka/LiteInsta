const prisma = require("../db");

async function createPost(data) {
  return await prisma.post.create({
    data: {
      imageUrl: data.imageUrl,
      caption: data.caption !== undefined ? data.caption : null,
      location: data.location !== undefined ? data.location : null,
    },
  });
}

async function listPosts() {
  return await prisma.post.findMany();
}

async function getPostById(id) {
  return await prisma.post.findUnique({
    where: { id: parseInt(id, 10) },
  });
}

async function updatePost(id, data) {
  const updateData = {};
  if (data.caption !== undefined) updateData.caption = data.caption;
  if (data.location !== undefined) updateData.location = data.location;

  return await prisma.post.update({
    where: { id: parseInt(id, 10) },
    data: updateData,
  });
}

async function deletePost(id) {
  return await prisma.post.delete({
    where: { id: parseInt(id, 10) },
  });
}

module.exports = {
  createPost,
  listPosts,
  getPostById,
  updatePost,
  deletePost,
};
