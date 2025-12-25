const mongoose = require("mongoose");
const User = require("../models/users");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/airbnb");
}

main();

const seedUser = async () => {
  await User.deleteMany({});

  const user = new User({
    username: "admin",
    email: "admin@test.com"
  });

  const registeredUser = await User.register(user, "password123");

  console.log("Seed user created:", registeredUser._id);
  mongoose.connection.close();
};

seedUser();
