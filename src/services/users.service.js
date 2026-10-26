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

async function listUsers({ skip, take, where = {}, orderBy = {} } = {}) {
  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total };
}

async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      _count: {
        select: {
          posts: true,
          likes: true,
        },
      },
    },
  });
}

async function checkUserExists(id) {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id, 10) },
    select: { id: true },
  });
  return !!user;
}

async function getUserPosts(userId, { skip, take } = {}) {
  const where = { authorId: parseInt(userId, 10) };
  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        _count: {
          select: { likes: true },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total };
}

async function getUserLikedPosts(userId, { skip, take } = {}) {
  const where = {
    likes: {
      some: {
        userId: parseInt(userId, 10),
      },
    },
  };

  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
          select: { likes: true },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total };
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
  checkUserExists,
  getUserPosts,
  getUserLikedPosts,
  updateUser,
  deleteUser,
};
