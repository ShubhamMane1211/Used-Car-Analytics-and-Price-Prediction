const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const getCollection = () => {
  return mongoose.connection.collection("car_listings");
};

// GET: Fetch car listings

router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      brand,
      model,
      fuel,
      transmission,
      state,
      minPrice,
      maxPrice,
      search,
      sortBy = "Year",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    // Brand filter
    if (brand) {
      filter.Brand = { $regex: brand, $options: "i" };
    }

    // Model filter
    if (model) {
      filter["Model Name"] = {
        $regex: model,
        $options: "i",
      };
    }

    if (fuel) filter["Fuel Type"] = fuel;
    if (transmission) filter.Transmission = transmission;
    if (state) filter.State = state;

    // Price range
    if (minPrice || maxPrice) {
      filter.Price = {};

      if (minPrice) filter.Price.$gte = Number(minPrice);
      if (maxPrice) filter.Price.$lte = Number(maxPrice);
    }

    // General search
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { Brand: { $regex: safeSearch, $options: "i" } },
        { "Model Name": { $regex: safeSearch, $options: "i" } },
        { "Model Variant": { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Pagination
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));

    // Allow only approved sorting fields
    const allowedSortFields = ["Price", "Year", "Kilometers"];

    const selectedSortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "Year";

    const direction = sortOrder === "asc" ? 1 : -1;

    const sort = {
      [selectedSortField]: direction,
    };

    const collection = getCollection();

    const [cars, totalCars] = await Promise.all([
      collection
        .find(filter)
        .sort(sort)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .toArray(),

      collection.countDocuments(filter),
    ]);

    res.json({
      success: true,
      totalCars,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalCars / pageSize),
      sortBy: selectedSortField,
      sortOrder: sortOrder === "asc" ? "asc" : "desc",
      data: cars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch car listings",
      error: error.message,
    });
  }
});

// GET: Fetch available filter options
router.get("/filters", async (req, res) => {
  try {
    const collection = getCollection();

    const [
      brands,
      models,
      carTypes,
      fuelTypes,
      transmissions,
      states,
      owners,
      years,
    ] = await Promise.all([
      collection.distinct("Brand"),
      collection.distinct("Model Name"),
      collection.distinct("Car Type"),
      collection.distinct("Fuel Type"),
      collection.distinct("Transmission"),
      collection.distinct("State"),
      collection.distinct("Owner"),
      collection.distinct("Year"),
    ]);

    res.json({
      success: true,
      filters: {
        brands: brands.sort(),
        models: models.sort(),
        carTypes: carTypes.sort(),
        fuelTypes: fuelTypes.sort(),
        transmissions: transmissions.sort(),
        states: states.sort(),
        owners: owners.sort(),
        years: years.sort((a, b) => b - a),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch filter options",
      error: error.message,
    });
  }
});

// GET: Fetch individual car by MongoDB ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid car ID",
      });
    }

    const car = await getCollection().findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
    });

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    res.json({
      success: true,
      data: car,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch car",
      error: error.message,
    });
  }
});

module.exports = router;
