const express = require("express");

const router = express.Router();

const ML_API_URL = "http://127.0.0.1:8000/predict";


router.post("/", async (req, res) => {
  try {
    const response = await fetch(ML_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Prediction API Error:", error.message);

    res.status(503).json({
      success: false,
      message: "ML prediction service is unavailable.",
    });
  }
});

module.exports = router;
