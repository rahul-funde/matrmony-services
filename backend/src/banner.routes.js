const router = require("express").Router();
const upload = require("../middlewares/upload");
const ctrl = require("../controllers/banner.controller");

router.post("/", upload.single("image"), ctrl.create);
router.put("/:id", upload.single("image"), ctrl.update);
router.delete("/:id", ctrl.remove);
router.get("/", ctrl.list);

module.exports = router;
