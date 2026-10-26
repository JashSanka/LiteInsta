const prisma = require("../src/db");
const { users, posts, likes } = require("./seed-data");

async function main() {
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const createdUsers = await prisma.user.createManyAndReturn({
    data: users.map((u) => ({
      username: u.username,
      email: u.email,
      fullname: u.fullname,
      bio: u.bio,
      isPrivate: u.isPrivate,
      createdAt: new Date(u.createdAt),
    })),
  });

  const userMap = new Map();
  for (const u of createdUsers) {
    userMap.set(u.username, u.id);
  }

  const createdPosts = await prisma.post.createManyAndReturn({
    data: posts.map((p) => ({
      imageUrl: p.imageUrl,
      caption: p.caption,
      location: p.location,
      authorId: userMap.get(p.author),
      createdAt: new Date(p.createdAt),
    })),
  });

  const postMap = new Map();
  for (const p of createdPosts) {
    const match = p.imageUrl.match(/insta\d+/);
    if (match) {
      postMap.set(match[0], p.id);
    }
  }

  const createdLikes = await prisma.like.createManyAndReturn({
    data: likes.map((l) => ({
      userId: userMap.get(l.user),
      postId: postMap.get(l.post),
    })),
  });

  console.log(
    `🌱 Seeded ${createdUsers.length} users, ${createdPosts.length} posts and ${createdLikes.length} likes`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
