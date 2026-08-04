const TradeIn = require('../models/TradeIn');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Store = require('../models/Store');

// Predefined phone market reference prices for Sri Lanka (LKR)
const POPULAR_MODELS = [
  { brand: 'Apple', modelName: 'iPhone 15 Pro Max 256GB', basePrice: 315000 },
  { brand: 'Apple', modelName: 'iPhone 15 Pro 128GB', basePrice: 265000 },
  { brand: 'Apple', modelName: 'iPhone 15 128GB', basePrice: 205000 },
  { brand: 'Apple', modelName: 'iPhone 14 Pro Max 128GB', basePrice: 245000 },
  { brand: 'Apple', modelName: 'iPhone 14 Pro 128GB', basePrice: 215000 },
  { brand: 'Apple', modelName: 'iPhone 14 128GB', basePrice: 165000 },
  { brand: 'Apple', modelName: 'iPhone 13 Pro Max 128GB', basePrice: 195000 },
  { brand: 'Apple', modelName: 'iPhone 13 128GB', basePrice: 145000 },
  { brand: 'Apple', modelName: 'iPhone 12 128GB', basePrice: 110000 },
  { brand: 'Apple', modelName: 'iPhone 11 128GB', basePrice: 85000 },

  { brand: 'Samsung', modelName: 'Galaxy S24 Ultra 256GB', basePrice: 310000 },
  { brand: 'Samsung', modelName: 'Galaxy S23 Ultra 256GB', basePrice: 220000 },
  { brand: 'Samsung', modelName: 'Galaxy S22 Ultra 128GB', basePrice: 155000 },
  { brand: 'Samsung', modelName: 'Galaxy A54 5G 128GB', basePrice: 75000 },
  { brand: 'Samsung', modelName: 'Galaxy A34 5G 128GB', basePrice: 58000 },

  { brand: 'Xiaomi', modelName: 'Xiaomi 13T Pro 512GB', basePrice: 140000 },
  { brand: 'Xiaomi', modelName: 'Redmi Note 13 Pro+ 256GB', basePrice: 95000 },
  { brand: 'Xiaomi', modelName: 'Redmi Note 12 Pro 128GB', basePrice: 62000 },

  { brand: 'Google', modelName: 'Pixel 8 Pro 128GB', basePrice: 190000 },
  { brand: 'Google', modelName: 'Pixel 7 Pro 128GB', basePrice: 130000 },
];

// @desc    Calculate trade-in valuation
// @route   POST /api/trade-in/calculate
// @access  Public / Staff
const calculateTradeInValuation = async (req, res, next) => {
  try {
    const {
      brand,
      modelName,
      baseEstimatedPrice,
      grade = 'Grade B (Minor Scratches)',
      screenCondition = 'good',
      batteryHealth = 85,
      bodyCondition = 'good',
      cameraWorking = true,
      biometricsWorking = true,
      originalBox = false,
      originalCharger = false,
    } = req.body;

    const basePrice = Number(baseEstimatedPrice || 0);
    if (basePrice <= 0) {
      res.status(400);
      return next(new Error('Base estimated market price must be greater than 0'));
    }

    const deductions = [];
    let currentValuation = basePrice;

    // 1. Grade Factor
    const gradeMultipliers = {
      'Grade A (Like New)': 0.95,
      'Grade B (Minor Scratches)': 0.85,
      'Grade C (Dented / Scratched)': 0.70,
      'Grade D (Faulty / Cracked)': 0.50,
    };
    const gradeMultiplier = gradeMultipliers[grade] || 0.85;
    const gradeDeduction = Math.round(basePrice * (1 - gradeMultiplier));
    if (gradeDeduction > 0) {
      deductions.push({ reason: `Overall Condition (${grade})`, amount: gradeDeduction });
      currentValuation -= gradeDeduction;
    }

    // 2. Battery Health Deduction (for iPhones / Androids)
    if (batteryHealth < 80) {
      const batteryDeduction = 12000;
      deductions.push({ reason: `Battery Below 80% (${batteryHealth}%) - Replacement Cost`, amount: batteryDeduction });
      currentValuation -= batteryDeduction;
    } else if (batteryHealth < 88) {
      const batteryDeduction = 5000;
      deductions.push({ reason: `Battery Health Degraded (${batteryHealth}%)`, amount: batteryDeduction });
      currentValuation -= batteryDeduction;
    }

    // 3. Screen Condition
    if (screenCondition === 'cracked') {
      const screenDeduction = Math.round(basePrice * 0.25);
      deductions.push({ reason: 'Cracked Screen Repair Cost', amount: screenDeduction });
      currentValuation -= screenDeduction;
    } else if (screenCondition === 'scratched') {
      const screenDeduction = 4000;
      deductions.push({ reason: 'Minor Screen Scratches', amount: screenDeduction });
      currentValuation -= screenDeduction;
    }

    // 4. Body Condition
    if (bodyCondition === 'major_dents') {
      const bodyDeduction = Math.round(basePrice * 0.15);
      deductions.push({ reason: 'Major Dents / Housing Replacement', amount: bodyDeduction });
      currentValuation -= bodyDeduction;
    }

    // 5. Hardware Functionality
    if (!cameraWorking) {
      const cameraDeduction = 15000;
      deductions.push({ reason: 'Camera Hardware Fault', amount: cameraDeduction });
      currentValuation -= cameraDeduction;
    }
    if (!biometricsWorking) {
      const bioDeduction = 10000;
      deductions.push({ reason: 'Face ID / Fingerprint Faulty', amount: bioDeduction });
      currentValuation -= bioDeduction;
    }

    // 6. Accessories Bonus
    let accessoriesBonus = 0;
    if (originalBox) {
      accessoriesBonus += 3000;
    }
    if (originalCharger) {
      accessoriesBonus += 3000;
    }

    const finalValuationPrice = Math.max(2000, Math.round(currentValuation + accessoriesBonus));

    res.json({
      brand,
      modelName,
      basePrice,
      grade,
      deductions,
      accessoriesBonus,
      finalValuationPrice,
      recommendedRetailResellPrice: Math.round(finalValuationPrice * 1.18), // 18% profit margin for shop when reselling
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save new trade-in valuation
// @route   POST /api/trade-in
// @access  Staff / Manager / Admin
const createTradeInRecord = async (req, res, next) => {
  try {
    const tradeIn = await TradeIn.create({
      ...req.body,
      evaluatedBy: req.user?._id,
      storeId: req.user?.assignedStore || req.user?.storeId || req.body.storeId,
    });
    res.status(201).json(tradeIn);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trade-ins
// @route   GET /api/trade-in
// @access  Staff / Manager / Admin
const getTradeIns = async (req, res, next) => {
  try {
    const tradeIns = await TradeIn.find({})
      .populate('evaluatedBy', 'name email')
      .populate('storeId', 'name')
      .sort({ createdAt: -1 });
    res.json(tradeIns);
  } catch (error) {
    next(error);
  }
};

// @desc    Get reference model pricing
// @route   GET /api/trade-in/models
// @access  Public / Staff
const getPopularTradeInModels = (req, res) => {
  res.json(POPULAR_MODELS);
};

// @desc    Add trade-in device to Refurbished Inventory
// @route   POST /api/trade-in/:id/add-to-inventory
// @access  Manager / Admin
const convertToRefurbishedStock = async (req, res, next) => {
  try {
    const tradeIn = await TradeIn.findById(req.params.id);
    if (!tradeIn) {
      res.status(404);
      return next(new Error('Trade-in record not found'));
    }

    const sellingPrice = Number(req.body.sellingPrice) || Math.round(tradeIn.finalValuationPrice * 1.2);

    // Find category ID
    let categoryObj = await Category.findOne({ name: { $regex: /Smart|Phone|Mobile/i } });
    if (!categoryObj) {
      categoryObj = await Category.findOne({});
    }

    // Find store ID
    let validStoreId = tradeIn.storeId || req.user?.assignedStore || req.user?.assignedStoreId || req.user?.storeId;
    if (!validStoreId) {
      const defaultStore = await Store.findOne({});
      validStoreId = defaultStore ? defaultStore._id : null;
    }

    if (!categoryObj || !validStoreId) {
      res.status(400);
      return next(new Error('Valid Store or Category not found to add refurbished product stock'));
    }

    const slug = `pre-owned-${tradeIn.brand}-${tradeIn.modelName}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const product = await Product.create({
      storeId: validStoreId,
      categoryId: categoryObj._id,
      name: `[Pre-Owned] ${tradeIn.brand} ${tradeIn.modelName}`,
      slug: slug,
      description: `Refurbished / Pre-owned device. Condition: ${tradeIn.grade}. Tested & Certified. Includes 3-Month Store Warranty. IMEI: ${tradeIn.imeiNumber || 'Included'}`,
      price: sellingPrice,
      mrp: tradeIn.baseEstimatedPrice || sellingPrice,
      unit: 'Unit',
      buyingPrice: tradeIn.finalValuationPrice,
      costPrice: tradeIn.finalValuationPrice,
      stock: 1,
      category: categoryObj.name,
      brand: tradeIn.brand,
      condition: 'refurbished',
      warranty: '3 Months Store Warranty',
      isRefurbished: true,
      imei: tradeIn.imeiNumber ? [tradeIn.imeiNumber] : [],
    });

    tradeIn.status = 'added_to_refurbished_stock';
    await tradeIn.save();

    res.json({ message: 'Trade-in phone added to Refurbished stock successfully!', product, tradeIn });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateTradeInValuation,
  createTradeInRecord,
  getTradeIns,
  getPopularTradeInModels,
  convertToRefurbishedStock,
};
