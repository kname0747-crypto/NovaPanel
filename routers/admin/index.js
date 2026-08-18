const { render } = require('ejs');

const router = require('express').Router();

router.get('/', checkAdmin, async (req, res) => {
    res.redirect('/admin/users');
});

router.get('/users', checkAdmin, async (req, res) => {
    let {
        user
    } = req.query;
    let users;
    if(user && user.length == 24) users = await userModel.find({ _id: user });
    else users = await userModel.find({});
    res.render('admin/pages/index', {
        users
    });
});

router.get('/orders', checkAdmin, async (req, res) => {
    let ordersx;
    if (req.query.user && req.query.user.length == 24) ordersx = await orderModel.find({ userID: req.query.user });
    else ordersx = await orderModel.find({});
    res.render('admin/pages/orders', {
        ordersx,
    });
});

// Katalog yönetimi: sidebar'da "Servisler" linki (/admin/services) zaten vardı
// ama bu route hiç var olmadığı için 404 veriyordu, ve platform/kategori/servis
// eklemek için admin panelinde hiçbir CRUD arayüzü bulunmuyordu. Bu, client
// tarafındaki /new_order ve /services sayfalarının hiçbir zaman gerçek veriyle
// test edilememesinin asıl nedeniydi.
router.get('/services', checkAdmin, async (req, res) => {
    let [platforms, categories, services] = await Promise.all([
        platformModel.find({}).sort({ queue: 1 }),
        categoryModel.find({}).sort({ queue: 1 }),
        serviceModel.find({}).sort({ id: 1 }),
    ]);
    res.render('admin/pages/services', {
        platforms,
        categories,
        services,
        success: req.query.success,
        message: req.query.message,
    });
});

router.post('/services/platform', checkAdmin, async (req, res) => {
    let { name, queue } = req.body;
    if (!name) return res.redirect('/admin/services?success=false&message=Platform+adı+gerekli');
    let last = await platformModel.find({}).sort({ id: -1 }).limit(1);
    let nextId = last.length ? last[0].id + 1 : 1;
    await new platformModel({
        id: nextId,
        name,
        queue: Number(queue) || nextId,
        visible: !!req.body.visible,
    }).save();
    return res.redirect('/admin/services?success=true&message=Platform+oluşturuldu');
});

router.post('/services/platform/:id/delete', checkAdmin, async (req, res) => {
    let id = Number(req.params.id);
    // Cascade: platforma bağlı kategoriler ve o kategorilere bağlı servisler de silinir.
    let cats = await categoryModel.find({ platform: id });
    let catIds = cats.map(c => c.id);
    await serviceModel.deleteMany({ category: { $in: catIds } });
    await categoryModel.deleteMany({ platform: id });
    await platformModel.deleteOne({ id });
    return res.redirect('/admin/services?success=true&message=Platform+silindi');
});

router.post('/services/category', checkAdmin, async (req, res) => {
    let { name, platform, queue, role, description } = req.body;
    if (!name || !platform) return res.redirect('/admin/services?success=false&message=Kategori+adı+ve+platform+gerekli');
    let last = await categoryModel.find({}).sort({ id: -1 }).limit(1);
    let nextId = last.length ? last[0].id + 1 : 1;
    await new categoryModel({
        id: nextId,
        platform: Number(platform),
        name,
        queue: Number(queue) || nextId,
        visible: !!req.body.visible,
        role: role || 'all',
        description: description || '',
    }).save();
    return res.redirect('/admin/services?success=true&message=Kategori+oluşturuldu');
});

router.post('/services/category/:id/delete', checkAdmin, async (req, res) => {
    let id = Number(req.params.id);
    await serviceModel.deleteMany({ category: id });
    await categoryModel.deleteOne({ id });
    return res.redirect('/admin/services?success=true&message=Kategori+silindi');
});

router.post('/services/service', checkAdmin, async (req, res) => {
    let { name, category, price, min, max, type, refill } = req.body;
    if (!name || !category || !price || !min || !max) return res.redirect('/admin/services?success=false&message=Zorunlu+alanları+doldurunuz');
    let last = await serviceModel.find({}).sort({ id: -1 }).limit(1);
    let nextId = last.length ? last[0].id + 1 : 1;
    await new serviceModel({
        id: nextId,
        name,
        category: Number(category),
        price: Number(price),
        min: Number(min),
        max: Number(max),
        type: type || 'Default',
        refill: !!refill,
        // Bu panelde henüz gerçek bir tedarikçi/child-panel API senkronizasyonu
        // yok, bu yüzden service.service.* alanlarını (şema zorunlu kılıyor)
        // servisin kendi id/fiyatıyla dolduruyoruz. Gerçek bir tedarikçi API'si
        // bağlandığında bu alanlar oradan gelmeli.
        service: {
            apiID: 'manual',
            serviceID: String(nextId),
            amount: Number(price),
        },
    }).save();
    return res.redirect('/admin/services?success=true&message=Servis+oluşturuldu');
});

router.post('/services/service/:id/delete', checkAdmin, async (req, res) => {
    await serviceModel.deleteOne({ id: Number(req.params.id) });
    return res.redirect('/admin/services?success=true&message=Servis+silindi');
});

router.get('/statistics', checkAdmin, async (req, res) => {
    let {
        category
    } = req.query;
    if (!category) category = 'register';
    try {
        const analyticsData = await analyticsModel.findOne();

        if (!analyticsData) {
        return res.status(404).json({ error: 'Analytics verisi bulunamadı' });
        }

        const thisYear = analyticsData.categorys.map((category) => {
            const yearly = category.yearly.find((year) => year.year === moment().format('YYYY'));
            if (yearly) return { category: category.category, yearly: yearly };
        });

        let categoryItem = thisYear.filter((item) => item.category == category);
        if (!categoryItem) categoryItem = [{ category: category, yearly: [] }];
        
        res.render('admin/pages/statistics', {
            data: categoryItem,
        });
  } catch (error) {
    console.error('Analytics verisi çekme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.get('/payments', checkAdmin, async (req, res) => {
    let payments;
    if(req.query.user && req.query.user.length == 24) payments = await payModel.find({ userID: req.query.user });
    else payments = await payModel.find({});
    res.render('admin/pages/payments', {
        payments
    });
});

router.get('/payments/details/:id', checkAdmin, async (req, res) => {
    let {
        id
    } = req.params;
    if (!id && id.length != 24) return res.redirect('/admin/payments?succes=false&message=Geçersiz ID');
    let data = await payModel.findOne({ _id: id });
    if (!data) return res.redirect('/admin/payments?succes=false&message=Ödeme Bulunamadı');
    res.json(data)
});

router.get('/support', checkAdmin, async (req, res) => {
    let status = ['pending', 'answered', 'resolved', 'closed']
    let supports;
    if(req.query.user && req.query.user.length == 24) supports = await ticketModel.find({ userID: req.query.user });
    else supports = await ticketModel.find({});
    if(status.includes(req.query.status)) supports = supports.filter((support) => support.status === req.query.status);
    res.render('admin/pages/support',
    {
        supports,
    });
});

router.get('/child_panels', checkAdmin, async (req, res) => {
    let panels;
    if(req.query.user && req.query.user.length == 24) panels = await childpanelModel.find({ userID: req.query.user });
    else panels = await childpanelModel.find({});
    res.render('admin/pages/child_panels', {
        panels
    });
});

router.get('/logs', checkAdmin, async (req, res) => {
    let logs;
    if(req.query.user && req.query.user.length == 24) {
        logs = await userModel.find({ _id: req.query.user }).select('logs');
        logs = logs[0].logs;
    } else {
        logs = await userModel.find({}).select('logs');
        new Promise((resolve, reject) => {
            logs = logs.map((log) => log.logs);
            const merged = [].concat.apply([], logs);
            logs = merged;
            resolve();
        });
    }
    res.render('admin/pages/logs', {
        logs
    });
});

router.get('/view', checkAdmin, async (req, res) => {
    let pages = await siteModel.find({}).select('site.pages');
    pages = pages[0].site.pages;
    res.render('admin/pages/view', {
        pages
    });
});

module.exports = router;