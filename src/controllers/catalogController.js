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

    // Get default items (visibility: 'default') - These are the original/past services
    // These are global services that are visible to all users and are never deleted
    const defaultItems = await Catalog.find({
      visibility: 'default',
      isActive: true
    });

    // Get account-specific items (visibility: 'local', account: userId)
    // These include ALL custom services the user has added (past and new)
    // All custom services added by this user are shown alongside the default services
    const localItems = await Catalog.find({
      visibility: 'local',
      account: userId,
      isActive: true
    });

    // Combine both - original default services + all user's custom services (past + new)
    // This ensures: past default services + past custom services + new custom services are all shown together
    // All services are preserved and displayed together, sorted alphabetically for easy finding
    const allItems = [...defaultItems, ...localItems].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

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

    // Combine default and local items, sorted alphabetically by name
    // This ensures all services (past default + user's custom services) are shown together
    const allItems = [...defaultItems, ...localItems].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

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

// Create a new catalog item (All authenticated users can create custom services)
exports.createCatalogItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const { name, type, description, cost, basePrice, defaultDurationMinutes, estimatedTime, quantity, unit, visibility, subOptions, allowComments, allowedParts } = req.body;

    // Validate required fields
    if (!name || !type || cost === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and cost are required'
      });
    }

    // Determine visibility: Only admins can create 'default' items, others create 'local' items
    // IMPORTANT: Custom services added by users are saved as 'local' items
    // This means they are added ALONGSIDE existing default services, not replacing them
    // Past/default services remain intact and are always visible
    let finalVisibility = visibility || 'local';
    if (finalVisibility === 'default' && user.role !== 'Admin') {
      // Non-admins cannot create default items, force to 'local'
      // This ensures past services are never overwritten
      finalVisibility = 'local';
    }
    
    // If visibility is 'local', set account to current user (permanently saved to user's catalog)
    // Local items are added in addition to default items, not replacing them
    const account = finalVisibility === 'local' ? userId : null;

    const catalogItem = new Catalog({
      name,
      type,
      description: description || '',
      cost,
      basePrice: basePrice !== undefined ? basePrice : (type === 'service' ? cost : 0),
      defaultDurationMinutes: defaultDurationMinutes !== undefined ? defaultDurationMinutes : 0,
      estimatedTime: estimatedTime || '',
      quantity: quantity || 0,
      unit: unit || 'piece',
      visibility: finalVisibility,
      account,
      isActive: true,
      subOptions: subOptions || [],
      allowComments: allowComments || false,
      allowedParts: allowedParts || []
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
    if (updates.basePrice !== undefined) catalogItem.basePrice = updates.basePrice;
    if (updates.defaultDurationMinutes !== undefined) catalogItem.defaultDurationMinutes = updates.defaultDurationMinutes;
    if (updates.estimatedTime !== undefined) catalogItem.estimatedTime = updates.estimatedTime;
    if (updates.quantity !== undefined) catalogItem.quantity = updates.quantity;
    if (updates.unit !== undefined) catalogItem.unit = updates.unit;
    if (updates.isActive !== undefined) catalogItem.isActive = updates.isActive;
    if (updates.subOptions !== undefined) catalogItem.subOptions = updates.subOptions;
    if (updates.allowComments !== undefined) catalogItem.allowComments = updates.allowComments;
    if (updates.allowedParts !== undefined) catalogItem.allowedParts = updates.allowedParts;

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

// Delete a catalog item (All users can delete their own custom services)
exports.deleteCatalogItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const catalogItem = await Catalog.findById(id);

    if (!catalogItem) {
      return res.status(404).json({
        success: false,
        message: 'Catalog item not found'
      });
    }

    // IMPORTANT: Default items cannot be deleted by anyone (only deactivated by admins)
    // Past services with 'default' visibility are protected and never deleted
    if (catalogItem.visibility === 'default') {
      const user = await User.findById(userId);
      // Only admins can deactivate default items
      if (user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Default catalog items cannot be deleted. Only admins can deactivate them.'
        });
      }
      // For default items, just deactivate instead of deleting
      catalogItem.isActive = false;
      await catalogItem.save();
      
      return res.status(200).json({
        success: true,
        message: 'Default catalog item deactivated',
        data: catalogItem
      });
    }

    // For local (custom) items: Users can only delete their own custom services
    if (catalogItem.visibility === 'local') {
      if (!catalogItem.account || catalogItem.account.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own custom services'
        });
      }
    }

    // Delete the custom service
    await Catalog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Custom service deleted successfully'
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

