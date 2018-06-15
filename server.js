const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors')
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

require("./src/routes.js")(app);

const server = app.listen(3000, function () {
    console.log("NodeJS Twitter API Server listening on port %s...", server.address().port);
});
