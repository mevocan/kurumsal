const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// .env dosyasındaki CLOUDINARY_URL'i otomatik olarak yükler
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

// Multer için Cloudinary depolama ayarı
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog_images', // Cloudinary'de oluşturulacak klasör
    allowed_formats: ['jpg', 'png', 'jpeg'], // Kabul edilen dosya formatları
  },
});

module.exports = { cloudinary, storage };
