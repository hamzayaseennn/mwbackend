const Catalog = require('../models/Catalog');
const User = require('../models/User');

// Get all catalog items (default + account-specific)
exports.getCatalog = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get default items (visibility: 'default')
    const defaultItems = await Catalog.find({
      visibility: 'default',
      isActive: true
    });

    // Get account-specific items (visibility: 'local', account: userId)
    const localItems = await Catalog.find({
      visibility: 'local',
      account: userId,
      isActive: true
    });

    // Combine both
    const allItems = [...defaultItems, ...localItems];

    res.status(200).json({
      success: true,
      data: allItems,
      count: allItems.length
    });
  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalog',
      error: error.message
    });
  }
};

// Get catalog items by type (services or products)
exports.getCatalogByType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;

    if (!['service', 'product'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "service" or "product"'
      });
    }

    // Get default items of this type
    const defaultItems = await Catalog.find({
      type,
      visibility: 'default',
      isActive: true
    });

    // Get account-specific items of this type
    const localItems = await Catalog.find({
      type,
      visibility: 'local',
      account: userId,
      isActive: true
    });

    const allItems = [...defaultItems, ...localItems];

    res.status(200).json({
      success: true,
      data: allItems,
      count: allItems.length
    });
  } catch (error) {
    console.error('Error fetching catalog by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalog',
      error: error.message
    });
  }
};

// Create a new catalog item (Admin only)
exports.createCatalogItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Check if user is Admin
    if (user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Admins can manage catalog items'
      });
    }

    const { name, type, description, cost, estimatedTime, quantity, unit, visibility } = req.body;

    // Validate required fields
    if (!name || !type || cost === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and cost are required'
      });
    }

    // If visibility is 'local', set account to current user
    // If visibility is 'default', account should be null (only super admins can create defaults)
    const account = visibility === 'local' ? userId : null;

    const catalogItem = new Catalog({
      name,
      type,
      description: description || '',
      cost,
      estimatedTime: estimatedTime || '',
      quantity: quantity || 0,
      unit: unit || 'piece',
      visibility: visibility || 'local',
      account,
      isActive: true
    });

    await catalogItem.save();

    res.status(201).json({
      success: true,
      message: 'Catalog item created successfully',
      data: catalogItem
    });
  } catch (error) {
    console.error('Error creating catalog item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create catalog item',
      error: error.message
    });
  }
};

// Update a catalog item (Admin only)
exports.updateCatalogItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Check if user is Admin
    if (user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Admins can manage catalog items'
      });
    }

    const { id } = req.params;
    const updates = req.body;

    const catalogItem = await Catalog.findById(id);

    if (!catalogItem) {
      return res.status(404).json({
        success: false,
        message: 'Catalog item not found'
      });
    }

    // Check if user owns this item (for local items) or if it's a default item
    if (catalogItem.visibility === 'local' && catalogItem.account?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own catalog items'
      });
    }

    // Update fields
    if (updates.name !== undefined) catalogItem.name = updates.name;
    if (updates.type !== undefined) catalogItem.type = updates.type;
    if (updates.description !== undefined) catalogItem.description = updates.description;
    if (updates.cost !== undefined) catalogItem.cost = updates.cost;
    if (updates.estimatedTime !== undefined) catalogItem.estimatedTime = updates.estimatedTime;
    if (updates.quantity !== undefined) catalogItem.quantity = updates.quantity;
    if (updates.unit !== undefined) catalogItem.unit = updates.unit;
    if (updates.isActive !== undefined) catalogItem.isActive = updates.isActive;

    await catalogItem.save();

    res.status(200).json({
      success: true,
      message: 'Catalog item updated successfully',
      data: catalogItem
    });
  } catch (error) {
    console.error('Error updating catalog item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update catalog item',
      error: error.message
    });
  }
};

// Delete a catalog item (Admin only)
exports.deleteCatalogItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Check if user is Admin
    if (user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Admins can manage catalog items'
      });
    }

    const { id } = req.params;

    const catalogItem = await Catalog.findById(id);

    if (!catalogItem) {
      return res.status(404).json({
        success: false,
        message: 'Catalog item not found'
      });
    }

    // Check if user owns this item (for local items)
    // Default items cannot be deleted (only deactivated)
    if (catalogItem.visibility === 'default') {
      // For default items, just deactivate instead of deleting
      catalogItem.isActive = false;
      await catalogItem.save();
      
      return res.status(200).json({
        success: true,
        message: 'Default catalog item deactivated',
        data: catalogItem
      });
    }

    if (catalogItem.account?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own catalog items'
      });
    }

    await Catalog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Catalog item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting catalog item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete catalog item',
      error: error.message
    });
  }
};

