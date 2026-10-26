const prisma = require("../db");

async function createPost(data) {
  return await prisma.post.create({
    data: {
      imageUrl: data.imageUrl,
      authorId: parseInt(data.authorId, 10),
      caption: data.caption !== undefined ? data.caption : null,
      location: data.location !== undefined ? data.location : null,
    },
  });
}

async function listPosts({ skip, take, where = {}, orderBy = [] } = {}) {
  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total };
}

async function getPostById(id) {
  return await prisma.post.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          fullname: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });
}

async function checkPostExists(id) {
  const post = await prisma.post.findUnique({
    where: { id: parseInt(id, 10) },
    select: { id: true },
  });
  return !!post;
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
  checkPostExists,
  updatePost,
  deletePost,
};
