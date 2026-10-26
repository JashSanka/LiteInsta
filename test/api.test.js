const app = require('../src/index');
const prisma = require('../src/db');
const { execSync } = require('child_process');

async function testAll() {
  console.log('--- Running LiteInsta Automated Verification Suite ---');

  // Seed database
  execSync('npm run seed', { stdio: 'inherit' });

  const port = 3099;
  const server = app.listen(port);
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
    passed++;
  }

  try {
    // 1. Health
    let res = await fetch(`${baseUrl}/health`);
    let json = await res.json();
    assert(res.status === 200 && json.status === 'OK', 'GET /health returns 200 { status: "OK" }');

    // Dynamic ID lookups
    const usersRes = await fetch(`${baseUrl}/users?limit=50`);
    const usersJson = await usersRes.json();
    const userMap = {};
    for (const u of usersJson.data) userMap[u.username] = u.id;

    const postsRes = await fetch(`${baseUrl}/posts?limit=50`);
    const postsJson = await postsRes.json();
    const postMap = {};
    for (const p of postsJson.data) {
      const match = p.imageUrl.match(/insta\d+/);
      if (match) postMap[match[0]] = p.id;
    }

    const riyaId = userMap['riya_travels'];
    const arjunId = userMap['arjun_clicks'];
    const devId = userMap['dev_shoots'];
    const adityaId = userMap['aditya_codes'];
    const nehaId = userMap['neha_designs'];

    const insta01Id = postMap['insta01'];
    const insta05Id = postMap['insta05'];
    const insta08Id = postMap['insta08'];
    const insta10Id = postMap['insta10'];
    const insta14Id = postMap['insta14'];
    const insta15Id = postMap['insta15'];
    const insta16Id = postMap['insta16'];
    const insta17Id = postMap['insta17'];
    const insta19Id = postMap['insta19'];
    const insta20Id = postMap['insta20'];
    const insta21Id = postMap['insta21'];
    const insta22Id = postMap['insta22'];
    const insta23Id = postMap['insta23'];
    const insta24Id = postMap['insta24'];

    // 2. User CRUD
    // POST /users
    res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_user', email: 'test@example.com', fullname: 'Test User', bio: 'Hello' })
    });
    let testUser = await res.json();
    assert(res.status === 201 && testUser.username === 'test_user' && testUser.bio === 'Hello', 'POST /users creates user');

    // POST /users duplicate username
    res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_user', email: 'other@example.com', fullname: 'Other' })
    });
    json = await res.json();
    assert(res.status === 409 && json.error === 'username or email already taken', 'POST /users detects duplicate username');

    // POST /users missing fields
    res = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'incomplete' })
    });
    json = await res.json();
    assert(res.status === 400 && json.error === 'username, email and fullname are required', 'POST /users requires username, email, fullname');

    // GET /users/:id
    res = await fetch(`${baseUrl}/users/${testUser.id}`);
    json = await res.json();
    assert(res.status === 200 && json.username === 'test_user' && json._count.posts === 0 && json._count.likes === 0, 'GET /users/:id returns user with counts');

    // PATCH /users/:id
    res = await fetch(`${baseUrl}/users/${testUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname: 'Updated Name', username: 'ignored_change', bio: 'Updated Bio' })
    });
    json = await res.json();
    assert(res.status === 200 && json.fullname === 'Updated Name' && json.username === 'test_user' && json.bio === 'Updated Bio', 'PATCH /users/:id updates allowed fields and ignores username');

    // DELETE /users/:id
    res = await fetch(`${baseUrl}/users/${testUser.id}`, { method: 'DELETE' });
    assert(res.status === 204, 'DELETE /users/:id returns 204');

    res = await fetch(`${baseUrl}/users/${testUser.id}`, { method: 'DELETE' });
    json = await res.json();
    assert(res.status === 404 && json.error === 'User not found', 'DELETE /users/:id on deleted user returns 404');

    // 3. User Pagination, Sorting, and Filtering
    res = await fetch(`${baseUrl}/users`);
    json = await res.json();
    assert(res.status === 200 && json.data.length === 10 && json.meta.total === 12 && json.meta.totalPages === 2, 'GET /users default pagination returns 10 users');

    res = await fetch(`${baseUrl}/users?page=2`);
    json = await res.json();
    assert(json.data.length === 2 && json.data[0].username === 'arjun_clicks' && json.data[1].username === 'riya_travels', 'GET /users page=2 returns remaining users');

    res = await fetch(`${baseUrl}/users?limit=100`);
    json = await res.json();
    assert(json.meta.limit === 50 && json.data.length === 12, 'GET /users limit capped at 50');

    res = await fetch(`${baseUrl}/users?page=0`);
    json = await res.json();
    assert(res.status === 400 && json.error === 'page and limit must be positive integers', 'GET /users validates positive integers for pagination');

    res = await fetch(`${baseUrl}/users?sortBy=username&order=asc`);
    json = await res.json();
    assert(json.data[0].username === 'aditya_codes', 'GET /users sort by username asc');

    res = await fetch(`${baseUrl}/users?sortBy=invalid`);
    json = await res.json();
    assert(res.status === 400 && json.error === 'sortBy must be one of: createdAt, username, fullname', 'GET /users validates sortBy');

    res = await fetch(`${baseUrl}/users?order=invalid`);
    json = await res.json();
    assert(res.status === 400 && json.error === 'order must be asc or desc', 'GET /users validates order');

    res = await fetch(`${baseUrl}/users?isPrivate=true`);
    json = await res.json();
    assert(json.meta.total === 4 && json.data.map(u => u.username).join(',') === 'dev_shoots,neha_designs,ananya_reads,meera.eats', 'GET /users isPrivate=true filter');

    res = await fetch(`${baseUrl}/users?search=sh`);
    json = await res.json();
    assert(json.meta.total === 3 && json.data.map(u => u.username).join(',') === 'dev_shoots,isha_dances,riya_travels', 'GET /users case-insensitive search on username or fullname');

    res = await fetch(`${baseUrl}/users?hasPosts=false`);
    json = await res.json();
    assert(json.meta.total === 2 && json.data.map(u => u.username).join(',') === 'aditya_codes,neha_designs', 'GET /users hasPosts=false');

    res = await fetch(`${baseUrl}/users?hasPosts=true`);
    json = await res.json();
    assert(json.meta.total === 10, 'GET /users hasPosts=true');

    // 4. Post CRUD & Author Relation
    res = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: 'https://picsum.photos/seed/testpost/600/600', caption: 'Test Post', location: 'Goa', authorId: riyaId })
    });
    let testPost = await res.json();
    assert(res.status === 201 && testPost.authorId === riyaId, 'POST /posts creates post with authorId');

    res = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: 'https://picsum.photos/seed/testpost2/600/600' })
    });
    json = await res.json();
    assert(res.status === 400 && json.error === 'imageUrl and authorId are required', 'POST /posts requires imageUrl and authorId');

    res = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: 'https://picsum.photos/seed/testpost3/600/600', authorId: 999999 })
    });
    json = await res.json();
    assert(res.status === 404 && json.error === 'User not found', 'POST /posts non-existent author returns 404');

    // Clean up test post
    await prisma.post.delete({ where: { id: testPost.id } });

    // 5. Post Pagination, Sorting, and Filtering
    res = await fetch(`${baseUrl}/posts/${insta01Id}`);
    json = await res.json();
    assert(res.status === 200 && json.author.username === 'riya_travels' && json.author.email === undefined && json._count.likes === 5, 'GET /posts/:id includes author summary without email and like count');

    res = await fetch(`${baseUrl}/posts?sortBy=likes&limit=5`);
    json = await res.json();
    assert(json.data.map(x => x.imageUrl.match(/insta\d+/)[0]).join(',') === 'insta24,insta01,insta15,insta10,insta08', 'GET /posts sortBy=likes with tie-breaker');

    res = await fetch(`${baseUrl}/posts?location=GOA`);
    json = await res.json();
    assert(json.meta.total === 4 && json.data.map(x => x.imageUrl.match(/insta\d+/)[0]).join(',') === 'insta23,insta16,insta10,insta01', 'GET /posts location filter is case-insensitive (matches goa and Goa)');

    res = await fetch(`${baseUrl}/posts?search=sunset`);
    json = await res.json();
    assert(json.meta.total === 3, 'GET /posts caption search filter');

    res = await fetch(`${baseUrl}/posts?from=2026-03-01&to=2026-04-01`);
    json = await res.json();
    assert(json.meta.total === 8, 'GET /posts date range from/to filter');

    res = await fetch(`${baseUrl}/posts?from=invalid`);
    json = await res.json();
    assert(res.status === 400 && json.error === 'from and to must be valid dates', 'GET /posts invalid date filter');

    // 6. User Posts & Likes
    res = await fetch(`${baseUrl}/users/${riyaId}/posts?limit=3`);
    json = await res.json();
    assert(json.meta.total === 7 && json.data.map(x => x.imageUrl.match(/insta\d+/)[0]).join(',') === 'insta23,insta19,insta16', 'GET /users/:id/posts returns user posts paginated newest first');

    res = await fetch(`${baseUrl}/posts/${insta01Id}/likes`);
    json = await res.json();
    assert(Array.isArray(json) && json.map(x => x.username).join(',') === 'arjun_clicks,isha_dances,meera.eats,neha_designs,vikram.trek', 'GET /posts/:id/likes returns sorted user summaries without email');

    // POST /posts/:id/likes
    res = await fetch(`${baseUrl}/posts/${insta05Id}/likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: riyaId })
    });
    json = await res.json();
    assert(res.status === 201 && json.userId === riyaId && json.postId === insta05Id, 'POST /posts/:id/likes creates like');

    // Duplicate like
    res = await fetch(`${baseUrl}/posts/${insta05Id}/likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: riyaId })
    });
    json = await res.json();
    assert(res.status === 409 && json.error === 'Already liked', 'POST /posts/:id/likes prevents duplicate like');

    // DELETE /posts/:id/likes/:userId
    res = await fetch(`${baseUrl}/posts/${insta05Id}/likes/${riyaId}`, { method: 'DELETE' });
    assert(res.status === 204, 'DELETE /posts/:id/likes/:userId returns 204');

    res = await fetch(`${baseUrl}/posts/${insta05Id}/likes/${riyaId}`, { method: 'DELETE' });
    json = await res.json();
    assert(res.status === 404 && json.error === 'Like not found', 'DELETE /posts/:id/likes/:userId not found returns 404');

    // 7. Bonus Endpoint: GET /users/:id/liked-posts
    res = await fetch(`${baseUrl}/users/${riyaId}/liked-posts`);
    json = await res.json();
    assert(json.meta.total === 4 && json.data.map(x => x.imageUrl.match(/insta\d+/)[0]).join(',') === 'insta24,insta20,insta10,insta03', 'GET /users/:id/liked-posts returns liked posts paginated');
    assert(json.data[0].author.username === 'dev_shoots' && json.data[0]._count.likes === 6, 'GET /users/:id/liked-posts includes author summary and likes count');

    // 8. Cascading Deletes
    res = await fetch(`${baseUrl}/users/${riyaId}`, { method: 'DELETE' });
    assert(res.status === 204, 'DELETE /users/:id for cascading test');

    res = await fetch(`${baseUrl}/users?limit=1`);
    json = await res.json();
    assert(json.meta.total === 11, 'Cascading delete: users count decreased by 1');

    res = await fetch(`${baseUrl}/posts?limit=1`);
    json = await res.json();
    assert(json.meta.total === 17, 'Cascading delete: 7 posts of riya deleted');

    res = await fetch(`${baseUrl}/users/${arjunId}`);
    json = await res.json();
    assert(json._count.posts === 4 && json._count.likes === 2, 'Cascading delete: arjun likes count dropped from 4 to 2');

    // Re-seed database after test run
    execSync('npm run seed', { stdio: 'inherit' });

    console.log(`\n🎉 Verification Complete: ${passed}/${total} assertions passed!`);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

testAll().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
