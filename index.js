import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import serverless from 'serverless-http';



const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
app.use(express.static("public"));
const posts = [];
let latestPost = null;  // ⬅️ Track the latest submitted post

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});
app.get('/register', (req, res) => {
  res.send('Register Page');
});

export const handler = serverless(app);
app.get('/register', (req, res) => {
  res.render('register'); // Or res.sendFile(__dirname + '/register.html') if it's a static file
});

app.post("/register", (req, res) => {
  res.sendFile(__dirname + "/public/index2.html");
})
app.post("/register/submit", (req, res) => {
  const postData = req.body.post;
  posts.push(postData);

  // ✅ Set latestPost only on new submission
  latestPost = postData;

  fs.appendFile("postdata.txt", postData + "\n", "utf8", (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return;
    }
    console.log("Post added to file successfully!");
  });

  res.render("index.ejs", {
    latestPost: latestPost,
    postContent: posts
  });
});


// ✅ DELETE ROUTE (move this here)
app.post("/delete", (req, res) => {
  const id = parseInt(req.body.id);
  if (!isNaN(id) && id >= 0 && id < posts.length) {
    const deleted = posts.splice(id, 1); // remove from array

    // ✅ If the deleted post was the latest, recalculate
    if (deleted[0] === latestPost) {
      latestPost = posts.length > 0 ? posts[posts.length - 1] : null;
    }

    // Rewrite the file with updated posts
    fs.writeFile("postdata.txt", posts.join("\n"), "utf8", (err) => {
      if (err) {
        console.error("Error writing file:", err);
      }
    });

    console.log("Deleted:", deleted[0]);
  }

  res.render("index.ejs", {
    latestPost: latestPost,
    postContent: posts
  });
});

// Route to render edit form
app.get("/edit", (req, res) => {
  const id = parseInt(req.query.id);
  if (!isNaN(id) && id >= 0 && id < posts.length) {
    res.render("edit.ejs", {
      id: id,
      content: posts[id]
    });
  } else {
    res.redirect("/");
  }
});

// Route to handle edit submission
app.post("/edit", (req, res) => {
  const id = parseInt(req.body.id);
  const newContent = req.body.newContent;

  if (!isNaN(id) && id >= 0 && id < posts.length && newContent.trim() !== "") {
    posts[id] = newContent.trim();

    // ✅ Do NOT update latestPost here

    fs.writeFile("postdata.txt", posts.join("\n"), "utf8", (err) => {
      if (err) {
        console.error("Error updating file:", err);
      }
    });
  }

  res.render("index.ejs", {
  latestPost: posts[id],  // show the edited post
  postContent: posts
});

});


app.post("/edit/cancel", (req, res) => {
  res.render("index.ejs", {
    latestPost: latestPost,
    postContent: posts
  });
});




fs.readFile("postdata.txt", "utf8", (err, data) => {
  if (!err && data) {
    data.split("\n").forEach(line => {
      if (line.trim() !== "") posts.push(line.trim());
    });
  }
});

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });