const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');
const { validateRegion, validateRegionUpdate } = require('../validators/regionValidator');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', regionController.getAllRegions);
router.get('/:id', regionController.getRegionById);
router.get('/:id/fsas', regionController.getRegionFSAs);
router.get('/:id/postal-codes', regionController.getRegionPostalCodes);
router.get('/:id/stats', regionController.getRegionStats);

// Protected routes (require authentication)
router.use(authMiddleware);

router.post('/', validateRegion, regionController.createRegion);
router.put('/:id', validateRegionUpdate, regionController.updateRegion);
router.delete('/:id', regionController.deleteRegion);
router.post('/:id/fsas', regionController.assignFSAsToRegion);
router.delete('/:id/fsas', regionController.removeFSAsFromRegion);
router.post('/:id/postal-codes/batch', regionController.batchImportPostalCodes);

module.exports = router;