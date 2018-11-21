const express = require("express"),
  app = express(),
  mongoose = require("mongoose"),
  bodyparser = require("body-parser"),
  User = require("./models/user"),
  Blog = require("./models/blogs"),
  Comment = require("./models/comments"),
  expressSanitizer = require("express-sanitizer"),
  passport = require("passport"),
  LocalStrategy = require("passport-local");
mongoose.connect(
  "mongodb://sanjai:sanjai@localhost/Abi?authSource=admin",
  { useNewUrlParser: true }
);
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(expressSanitizer());
app.use(
  require("express-session")({
    secret: "Abi",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
  res.locals.CurrentUser = req.user;
  next();
});

//middleware to check user login
function isHelogedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.redirect("/login");
}

//Index Route
app.get("/", (req, res) => {
  Blog.find({}, (err, blogs) => {
    if (err) {
      console.log("Home Page cannot loaded");
      return res.redirect("/");
    }
    return res.render("home", { blogs: blogs });
  });
});

//individual blog
app.get("/blog/:id", (req, res) => {
  Blog.findById(req.params.id)
    .populate("comments")
    .exec(function(err, foundblog) {
      if (err) {
        res.redirect("/blogs");
      } else {
        res.render("show", { blog: foundblog });
      }
    });
});

//Registration Route
app.get("/register", (req, res) => res.render("register"));
app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        return res.redirect("/register");
      }
      // console.log(user);
      return res.render("home");
    }
  );
});

//Login Route
app.get("/login", (req, res) => res.render("login"));

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    // successMessage: ,
    failureRedirect: "/login"
    // failureMessage:
  })
);

//Adding blog
app.get("/addblog", (req, res) => res.render("newblog"));
app.post("/addblog", (req, res) => {
  // console.log(req.body);
  req.body.blog.body = req.sanitize(req.body.blog.body);
  Blog.create(req.body.blog, (err, blog) => {
    if (err) {
      return res.redirect("/addblog");
    }
    // console.log(blog);
    return res.redirect("/");
  });
});

//comments
app.get("/addcomments/:id", isHelogedIn, (req, res) => {
  // console.log("entered");
  Blog.findById(req.params.id, (err, blog) => {
    if (err) {
      return res.redirect("/");
    }
    // console.log(blog);
    return res.render("comment", { blog: blog });
  });
  // res.render("comment");
});
app.post("/addcomments/:id", isHelogedIn, (req, res) => {
  Blog.findById(req.params.id, (err, blog) => {
    if (err) {
      console.log(err);
      res.redirect("/addcomments");
    } else {
      Comment.create(req.body.comment, (err, comment) => {
        if (err) {
          console.log(err);
          res.redirect("/addcomments");
        } else {
          //add username and id to comment
          console.log(req.user);
          comment.author.id = req.user._id;
          comment.author.username = req.user.username;
          //save comment
          // console.log(comment);
          comment.save();
          blog.comments.push(comment);
          blog.save();
          console.log(blog);
          res.redirect("/blog/" + blog._id);
        }
      });
    }
  });
});

app.get("/logout", (req, res) => {
  req.logout();
  console.log("LoggedOut Successfully");
  res.redirect("/");
});
const PORT = 3001 || process.env.PORT;
app.listen(PORT, () => console.log(`server started at ${PORT}`));
