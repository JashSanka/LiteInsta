const prisma = require("../db");

async function getLikesByPostId(postId) {
  const likes = await prisma.like.findMany({
    where: { postId: parseInt(postId, 10) },
    select: {
      user: {
        select: {
          id: true,
          username: true,
          fullname: true,
        },
      },
    },
    orderBy: {
      user: {
        username: "asc",
      },
    },
  });

  return likes.map((l) => l.user);
}

async function createLike(postId, userId) {
  return await prisma.like.create({
    data: {
      postId: parseInt(postId, 10),
      userId: parseInt(userId, 10),
    },
  });
}

async function deleteLike(postId, userId) {
  return await prisma.like.delete({
    where: {
      userId_postId: {
        userId: parseInt(userId, 10),
        postId: parseInt(postId, 10),
      },
    },
  });
}

module.exports = {
  getLikesByPostId,
  createLike,
  deleteLike,
};
