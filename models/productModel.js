const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required!"],
      trim: true,
      minlength: [3, "Title should not be less than 3 characters!"],
      maxlength: [100, "Title should not exceed 100 characters!"],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Product Description is required!"],
      trim: true,
      minlength: [10, "Description should not be less than 10 characters!"],
      maxlength: [2000, "Description should not exceed 500 characters!"],
    },
    quantity: {
      type: Number,
      required: [true, "Product Quantity is required!"],
    },
    sold: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Product Price is required!"],
      trim: true,
      max: [1000000, "Too long Price should be less than 20 numbers!"],
    },
    priceAfterDiscount: {
      type: Number,
    },
    colors: [String],
    imageCover: {
      type: String,
      required: [true, "Product Image Cover is required!"],
    },
    images: [String],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product must be categorized!"],
    },
    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
      },
    ],
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Mongoose query middleware
productSchema.pre(/^find/, function (next) {
  // 'this' refers to the query object, it allows you to modify the query before it is sent to the database.
  this.populate({
    path: "category",
    select: "name",
  });

  next();
});

const setImgURL = (doc) => {
  //@ return => image base url + image name
  if (doc.imageCover) {
    const isAbsoluteUrl = /^https?:\/\//i.test(doc.imageCover);
    doc.imageCover = isAbsoluteUrl
      ? doc.imageCover
      : `${process.env.BASE_URL}/products/${doc.imageCover}`;
  }
  // if (doc.images) {
  //   doc.images = doc.images.map((image) => {
  //     const imageUrl = `${process.env.BASE_URL}/products/${image}`;
  //     return imageUrl;
  //   });
  // }
  if (doc.images) {
    const imagesList = [];
    doc.images.forEach((image) => {
      const imageUrl = /^https?:\/\//i.test(image)
        ? image
        : `${process.env.BASE_URL}/products/${image}`;
      imagesList.push(imageUrl);
    });
    doc.images = imagesList;
  }
};

//@ GET [findOne, findAll] and UPDATE
productSchema.post("init", (doc) => {
  setImgURL(doc);
});

//@ CREATE
productSchema.post("save", (doc) => {
  setImgURL(doc);
});

module.exports = mongoose.model("Product", productSchema);
