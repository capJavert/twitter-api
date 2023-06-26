const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors')
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

let headless = process.argv[2] ?? 'new'

if (headless === 'false') {
    headless = false
}

require("./src/routes.js")(app, '', headless);

const server = app.listen(3000, function () {
    console.log("NodeJS Twitter API Server listening on port %s...", server.address().port);
});
