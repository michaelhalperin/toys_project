const express = require("express");
const { ToysModel, validateToys } = require("../models/toysModel");
const { auth } = require("../middleware/auth");
const router = express.Router();

// get the products by given value and search.
router.get("/", async (req, res) => {
  try {
    // change the limit of products in the page (default: 10 products)
    const limit = req.query.limit || 10;
    // change the page
    const page = req.query.page - 1 || 0;
    // change the option of sorting (default: by the "_id")
    const sort = req.query.sort || "_id";
    // change the way of sorting (a - z // z - a)
    const reverse = req.query.reverse == "yes" ? 1 : -1;

    // search the products by ?s = (as default) and also as the title and info.
    let filterFind = {};
    if (req.query.s) {
      const search = new RegExp(req.query.s, "i");
      filterFind = { $or: [{ name: search }, { info: search }] };
    }

    // combine and find all by the given value.
    const data = await ToysModel.find(filterFind)
      .limit(limit)
      .skip(limit * page)
      .sort({ [sort]: reverse });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// get the product by category.
router.get("/category", async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const cat = req.query.cat;

    // find the product by the given category -- /cat=******
    const data = await ToysModel.find({ category: cat }).limit(limit);
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// get all the products that in the range( min = ? max =?).
router.get("/prices", async (req, res) => {
  try {
    const min = req.query.min || 0;
    const max = req.query.max || Infinity;
    const limit = req.query.limit || 10;
    const data = await ToysModel.find({
      price: { $gte: min, $lte: max },
    }).limit(limit);
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// find one product by his id.
router.get("/single/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await ToysModel.findOne({ _id: id });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// count the data (products) and the pages
router.get("/count", async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const data = await ToysModel.countDocuments({});
    res.json({ data, pages: Math.ceil(data / limit) });
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// add new product (only authorized users can do that).
router.post("/", auth, async (req, res) => {
  const validBody = validateToys(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    const product = new ToysModel(req.body);
    product.user_id = req.tokenData._id;
    await product.save();
    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// edit product (only authorized users can do that).
router.put("/:id", auth, async (req, res) => {
  const validBody = validateToys(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    const id = req.params.id;
    const data = await ToysModel.updateOne(
      { _id: id, user_id: req.tokenData._id },
      req.body
    );
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

// delete product (only authorized users can do that).
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const data = await ToysModel.deleteOne({
      _id: id,
      user_id: req.tokenData._id,
    });
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(502).json({ err });
  }
});

module.exports = router;
