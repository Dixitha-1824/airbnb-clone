const mongoose = require("mongoose");
const Listing = require("../models/listingM");
const User = require("../models/users");
const data = require("./data");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/airbnb");
}

main();

const initDb = async () => {
  await Listing.deleteMany({});

  const owner = await User.findOne({ username: "admin" });

  if (!owner) {
    console.log("No owner found. Run seedUser first.");
    return;
  }

  const listingsWithOwner = data.data.map(listing => ({
    ...listing,
    owner: owner._id
  }));

  await Listing.insertMany(listingsWithOwner);
  console.log("Listings seeded successfully");

  mongoose.connection.close();
};

initDb();
