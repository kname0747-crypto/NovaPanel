const category = new Schema({
    id: { type: Number, required: true }, // Kategori ID
    platform: { type: Number, required: true }, // Bağlı olduğu platformun ID'si (platforms.id)
    queue: { type: Number, required: true }, // Kategori sırası
    name: { type: String, required: true }, // Kategori adı
    visible: { type: Boolean, required: true }, // Kategori görünürlüğü
    role: { type: String, required: true, default: "all" }, // Kategori rolü
    description: { type: String, required: true }, // Kategori açıklaması
});

module.exports = mongoDB.model('category', category);