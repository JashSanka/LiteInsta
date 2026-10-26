const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());

const usersRoutes = require("./routes/users.routes");
const postsRoutes = require("./routes/posts.routes");

app.get('/health', (req, res) => {
    return res.status(200).json({ status: "OK" });
});

app.use('/users', usersRoutes);
app.use('/posts', postsRoutes);

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
}

module.exports = app;
