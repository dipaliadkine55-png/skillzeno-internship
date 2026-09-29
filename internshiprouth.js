const express = require("express");

const Internship = require("../models/Internship");
const protect = require("../middleware/authMiddleware");

const router = express.Router();


// GET all internships
router.get("/", protect, async (req, res) => {
  try {
    const internships = await Internship.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json(internships);

  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch internships",
    });
  }
});


// CREATE internship
router.post("/", protect, async (req, res) => {
  try {
    const internship = await Internship.create({
      ...req.body,
      userId: req.user.userId,
    });

    res.status(201).json(internship);

  } catch (error) {
    res.status(500).json({
      message: "Unable to create internship",
    });
  }
});


// UPDATE internship
router.put("/:id", protect, async (req, res) => {
  try {
    const internship = await Internship.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
      req.body,
      {
        new: true,
      }
    );

    if (!internship) {
      return res.status(404).json({
        message: "Internship not found",
      });
    }

    res.json(internship);

  } catch (error) {
    res.status(500).json({
      message: "Unable to update internship",
    });
  }
});


// DELETE internship
router.delete("/:id", protect, async (req, res) => {
  try {
    const internship = await Internship.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!internship) {
      return res.status(404).json({
        message: "Internship not found",
      });
    }

    res.json({
      message: "Internship deleted",
    });

  } catch (error) {
    res.status(500).json({
      message: "Unable to delete internship",
    });
  }
});


module.exports = router;