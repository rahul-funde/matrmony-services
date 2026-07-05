const bannerService = require("../services/banner.service");


exports.create = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "Image required" });

    const banner = {
      type: "popup_banner",
      title: req.body.title,
      description: req.body.description,
      image: `/uploads/banners/${req.file.filename}`,
      ctaText: req.body.ctaText,
      ctaAction: req.body.ctaAction,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      priority: Number(req.body.priority || 1),
      active: req.body.active === "true",
      createdAt: new Date().toISOString()
    };

    const id = await bannerService.createBanner(banner);

    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


exports.update = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.file) {
      data.image = `uploads/banners/${req.file.filename}`;
    }

    await bannerService.updateBanner(req.params.id, data);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


exports.remove = async (req, res) => {
  try {
    await bannerService.deleteBanner(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.list = async (req, res) => {
  try {
    const banners = await bannerService.getAllBanners();
    res.json(banners);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
