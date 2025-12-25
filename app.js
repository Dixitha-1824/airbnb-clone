require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listingM");
const Review = require("./models/reviewM");
const User = require("./models/users");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const wrapAsync = require("./utils/wrapAsync");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const {
  isLoggedIn,
  isReviewAuthor,
  isListingOwner,
} = require("./middleware");

/* ======================
   MIDDLEWARE
====================== */
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ======================
   DATABASE
====================== */
async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}
main()
  .then(() => console.log("Connected to DB"))
  .catch(err => console.log(err));

/* ======================
   VIEW ENGINE
====================== */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

/* ======================
   SESSION & FLASH
====================== */
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

/* ======================
   PASSPORT CONFIG
====================== */
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* ======================
   GLOBAL VARIABLES
====================== */
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  res.locals.currentPath = req.path;
  next();
});

/* ======================
   ROUTES
====================== */

app.get("/", (req, res) => {
  res.redirect("/listings");
});

/* -------- LISTINGS -------- */

// INDEX
app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings });
  })
);

// NEW FORM
app.get("/listings/new", isLoggedIn, (req, res) => {
  res.render("listings/new");
});

// CREATE
app.post(
  "/listings",
  isLoggedIn,
  wrapAsync(async (req, res) => {

    const listing = new Listing({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      location: req.body.location,
      country: req.body.country,

      // ✅ owner MUST be set here
      owner: req.user._id,

      // temporary image (until Cloudinary)
      image: {
        url: "https://via.placeholder.com/800",
        filename: "placeholder"
      }
    });

    await listing.save();

    req.flash("success", "Listing created successfully!");
    res.redirect("/listings");
  })
);



// SHOW
app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Invalid listing ID.");
      return res.redirect("/listings");
    }

    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author" },
      })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/listings");
    }

    res.render("listings/show", { Listing: listing });
  })
);

// EDIT FORM
app.get(
  "/listings/:id/edit",
  isLoggedIn,
  isListingOwner,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    res.render("listings/edit", { Listing: listing });
  })
);

// UPDATE
app.put(
  "/listings/:id",
  isLoggedIn,
  isListingOwner,
  wrapAsync(async (req, res) => {
    await Listing.findByIdAndUpdate(req.params.id, req.body);
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${req.params.id}`);
  })
);

// DELETE
app.delete(
  "/listings/:id",
  isLoggedIn,
  isListingOwner,
  wrapAsync(async (req, res) => {
    await Listing.findByIdAndDelete(req.params.id);
    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
  })
);

/* -------- REVIEWS -------- */

// CREATE REVIEW
app.post(
  "/listings/:id/reviews",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    const review = new Review(req.body.review);
    review.author = req.user._id;

    await review.save();
    listing.reviews.push(review);
    await listing.save();

    req.flash("success", "Review added successfully!");
    res.redirect(`/listings/${req.params.id}`);
  })
);

// DELETE REVIEW
app.delete(
  "/listings/:id/reviews/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {
      $pull: { reviews: reviewId },
    });

    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review deleted successfully!");
    res.redirect(`/listings/${id}`);
  })
);

/* -------- AUTH -------- */

// SIGNUP
app.get("/signup", (req, res) => {
  res.render("users/signup");
});

app.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      req.flash("error", "An account with this email already exists.");
      return res.redirect("/signup");
    }

    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, err => {
      if (err) return next(err);
      req.flash("success", "Welcome! Your account has been created.");
      res.redirect("/listings");
    });
  } catch (err) {
    if (err.name === "UserExistsError") {
      req.flash("error", "Username already taken.");
    } else {
      req.flash("error", "Something went wrong.");
    }
    res.redirect("/signup");
  }
});

// LOGIN
app.get("/login", (req, res) => {
  res.render("users/login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect("/listings");
  }
);

// LOGOUT
app.get("/logout", isLoggedIn, (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    res.redirect("/listings");
  });
});

/* ======================
   ERROR HANDLER
====================== */
app.use((err, req, res, next) => {
  console.error(err);

  let message = "Something went wrong.";
  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map(e => e.message).join(", ");
  }

  req.flash("error", message);
  res.redirect("/listings");
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
