const fs = require("fs");
const path = require("path");
require("colors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const CategoryModel = require("../../models/categoryModel");
const ProductModel = require("../../models/productModel");
const dbConnection = require("../../config/database");

dotenv.config({ path: path.join(__dirname, "../../config.env") });

// connect to DB
dbConnection();

// Read data
const products = JSON.parse(
  fs.readFileSync(path.join(__dirname, "products.json"), "utf-8")
);

const categories = [
  {
    _id: new mongoose.Types.ObjectId("61b2a9d869d54640ca3d7293"),
    name: "fashion",
    slug: "fashion",
  },
  {
    _id: new mongoose.Types.ObjectId("61b7a02868424f7846ce1d6f"),
    name: "jackets",
    slug: "jackets",
  },
  {
    _id: new mongoose.Types.ObjectId("61b2a8dd4bad61f4cc4a98ea"),
    name: "electronics",
    slug: "electronics",
  },
];

// Insert data into DB
const insertData = async () => {
  try {
    await CategoryModel.deleteMany();
    await ProductModel.deleteMany();
    await CategoryModel.create(categories);
    await ProductModel.create(products);
    console.log("Data Inserted Successfully".green.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// Delete data from DB
const destroyData = async () => {
  try {
    await ProductModel.deleteMany();
    await CategoryModel.deleteMany();
    console.log("Data Destroyed Successfully".red.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

// node seeder.js -i
if (process.argv[2] === "-i") {
  insertData();
}
// node seeder.js -d
else if (process.argv[2] === "-d") {
  destroyData();
}
