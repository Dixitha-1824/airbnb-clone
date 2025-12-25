const Review = require("./models/reviewM");
const Listing = require("./models/listingM");

// 🔐 AUTHENTICATION
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You are not logged in. Please login to continue.");
    return res.redirect("/login");
  }
  next();
};

// 🔐 REVIEW AUTHORIZATION
module.exports.isReviewAuthor = async (req, res, next) => {
  const { reviewId } = req.params;
  const review = await Review.findById(reviewId);

  if (!review) {
    req.flash("error", "Review not found.");
    return res.redirect("/listings");
  }

  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You are not allowed to do this.");
    return res.redirect("/listings");
  }

  next();
};

// 🔐 LISTING AUTHORIZATION
module.exports.isListingOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }

  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You are not allowed to do this.");
    return res.redirect("/listings");
  }

  next();
};
