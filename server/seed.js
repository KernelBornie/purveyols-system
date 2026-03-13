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

      /* Director */
      {
        name: "Brian M",
        role: "director",
        email: "brian.director@purveyols.com",
        password: "purveyols123"
      },

      /* Accountant */
      {
        name: "Micheal C",
        role: "accountant",
        email: "micheal.accountant@purveyols.com",
        password: "purveyols123"
      },

      /* Engineers */
      {
        name: "Rodney S",
        role: "engineer",
        email: "rodney.engineer@purveyols.com",
        password: "purveyols123"
      },
      {
        name: "Moses S",
        role: "engineer",
        email: "moses.engineer@purveyols.com",
        password: "purveyols123"
      },
      {
        name: "Choolwe N",
        role: "engineer",
        email: "choolwe.engineer@purveyols.com",
        password: "purveyols123"
      },

      /* Foremen */
      {
        name: "Mobrey L",
        role: "foreman",
        email: "mobrey.foreman@purveyols.com",
        password: "purveyols123"
      },
      {
        name: "Moses S",
        role: "foreman",
        email: "mosesf.foreman@purveyols.com",
        password: "purveyols123"
      },
      {
        name: "Philip C",
        role: "foreman",
        email: "philip.foreman@purveyols.com",
        password: "purveyols123"
      },

      /* Drivers */
      {
        name: "Boyd",
        role: "driver",
        email: "boyd.driver@purveyols.com",
        password: "purveyols123"
      },
      {
        name: "Nicholas B",
        role: "driver",
        email: "nicholas.driver@purveyols.com",
        password: "purveyols123"
      },
      {
        name: "Chris S",
        role: "driver",
        email: "chris.driver@purveyols.com",
        password: "purveyols123"
      },

      /* Procurement / Logistics */
      {
        name: "Gilbert K",
        role: "procurement",
        email: "gilbert.procurement@purveyols.com",
        password: "purveyols123"
      },

      /* Safety */
      {
        name: "Royd",
        role: "safety",
        email: "royd.safety@purveyols.com",
        password: "purveyols123"
      },

      /* Admin */
      {
        name: "Admin",
        role: "admin",
        email: "admin@purveyols.com",
        password: "purveyols123"
      },

    ];

    for (const u of users) {

      const user = new User(u);

      await user.save();

      console.log(`Created user: ${u.email}`);

    }

    console.log("\nSeed completed successfully");
    console.log("\nLogin credentials:");
    console.log("All users password: purveyols123");
    console.log("Director : brian.director@purveyols.com");
    console.log("Accountant: micheal.accountant@purveyols.com");
    console.log("Engineer  : rodney.engineer@purveyols.com");
    console.log("Foreman   : mobrey.foreman@purveyols.com");
    console.log("Driver    : boyd.driver@purveyols.com");
    console.log("Procurement: gilbert.procurement@purveyols.com");
    console.log("Safety    : royd.safety@purveyols.com");

    process.exit(0);

  } catch (error) {

    console.error("Seed error:", error);

    process.exit(1);

  }

}

seed();