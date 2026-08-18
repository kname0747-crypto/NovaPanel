module.exports = {
    port: 3000,
    mongoDB: "mongodb://localhost:27017/novapanel", // MongoDB bağlantı adresi
    siteUrl: "http://localhost:3000", // Site URL Sonuna / koymayın lütfen örn: https://example.com http://example.com
    licenseKey: "novapanel", // Lisans anahtarı bu örnektir. Lütfen kendi lisans anahtarınızı girin. Aksi taktirde sistem kurulumu hatalı olacaktır.
    salt: {
        one: "novapanel", // MD5 için ilk kurulumdan sonra Şifreleri asla değiştirmeyin!
        two: "novapanel" // SHA256 için Rasgele bir şifre kullanın bu örnektir
    }
};