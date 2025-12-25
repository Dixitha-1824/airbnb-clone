const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    minlength: [3, "Title must be at least 3 characters"],
    trim: true
  },

  description: {
    type: String,
    required: [true, "Description is required"],
    minlength: [10, "Description must be at least 10 characters"],
    trim: true
  },

  image: {
    filename: String,
    url: String
  },

  price: {
    type: Number,
    required: true,
    default: 10,
    min: [1, "Price must be greater than 0"]
  },

  location: {
    type: String,
    required: [true, "Location is required"],
    trim: true
  },

  country: {
    type: String,
    required: [true, "Country is required"],
    trim: true
  },

  // ✅ FIXED: array of reviews
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review"
    }
  ],

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

module.exports = mongoose.model("listingModel", listingSchema);
