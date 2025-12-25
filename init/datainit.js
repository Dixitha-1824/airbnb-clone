require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("../models/listingM");
const data = require("./data");

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to MongoDB Atlas");
}

const initDb = async () => {
  await Listing.deleteMany({});
  await Listing.insertMany(data.data);
  console.log("Dummy listings inserted");
};

main()
  .then(initDb)
  .then(() => {
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
  });
