require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("../models/listingM");
const data = require("./data");

const OWNER_ID = "694d00ed40392362556fed25"; 

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to MongoDB Atlas");
}

const initDb = async () => {
  await Listing.deleteMany({});

  const listingsWithOwner = data.data.map((listing) => ({
    ...listing,
    owner: OWNER_ID
  }));

  await Listing.insertMany(listingsWithOwner);
  console.log("Dummy listings inserted with owner");
};

main()
  .then(initDb)
  .then(() => mongoose.connection.close())
  .catch(err => console.error(err));
