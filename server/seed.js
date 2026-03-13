require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./src/models/User");

async function seed() {

  try {

    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/purveyols"
    );

    console.log("Connected to MongoDB");

    await User.deleteMany();

    console.log("Existing users removed");

    const users = [

      {
        name: "Admin",
        email: "admin@purveyols.com",
        password: "admin123",
        role: "admin"
      },

      {
        name: "Director",
        email: "director@purveyols.com",
        password: "password123",
        role: "director"
      },

      {
        name: "Accountant",
        email: "accountant@purveyols.com",
        password: "password123",
        role: "accountant"
      },

      {
        name: "Engineer",
        email: "engineer@purveyols.com",
        password: "password123",
        role: "engineer"
      },

      {
        name: "Foreman",
        email: "foreman@purveyols.com",
        password: "password123",
        role: "foreman"
      }

    ];

    for (const u of users) {

      const user = new User(u);

      await user.save();

      console.log(`Created user: ${u.email}`);

    }

    console.log("Seed completed successfully");

    process.exit();

  } catch (error) {

    console.error("Seed error:", error);

    process.exit(1);

  }

}

seed();