const mongoose = require("mongoose");
require("dotenv").config(); // Çevresel değişkenler için

// MongoDB bağlantısı
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB'ye bağlandı"))
  .catch((err) => console.error("MongoDB bağlantı hatası:", err));

const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");
const { storage } = require("./config/cloudinary");
const upload = multer({ storage });
const Blog = require("./models/Blog");
const Faq = require("./models/Faq");
const Settings = require("./models/Settings");
const Admin = require("./models/Admin");

const app = express();
const PORT = process.env.PORT || 3001; // PORT çevresel değişkenini kullan

// EJS'yi ayarla
app.set("view engine", "ejs");

// Statik dosyalar için "public" klasörünü kullan
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Form verisi için

// MongoDB'de oturumları depolamak için ayarlar
const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

// Express oturum ayarları
app.use(
  session({
    secret: "your_secret_key", // Güçlü bir gizli anahtar kullanın
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 gün
    },
  })
);

// Header için global ayarlar
app.use(async (req, res, next) => {
  try {
    const settings = await Settings.findOne(); // Ayarları alın
    res.locals.settings = settings; // Tüm şablonlara ayarları ekle
    res.locals.activePage = req.path.slice(1) || "home"; // Aktif sayfa belirle
    next();
  } catch (err) {
    console.error("Header settings yüklenirken hata:", err);
    next(err);
  }
});

// Admin giriş middleware
function ensureAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next();
  }
  res.redirect("/admin/login");
}

// Admin giriş ve çıkış
app.get("/admin/login", (req, res) => {
  res.render("admin/login", { title: "Admin Girişi", error: null });
});

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.render("admin/login", { title: "Admin Girişi", error: "Kullanıcı bulunamadı!" });
    }

    // Şifre eşleşmesi kontrolü
    if (admin.password !== password) {
      return res.render("admin/login", { title: "Admin Girişi", error: "Yanlış parola!" });
    }

    req.session.isAdmin = true; // Oturumda admin bilgisi saklanır
    res.redirect("/admin");
  } catch (err) {
    console.error("Admin giriş hatası:", err);
    res.status(500).send("Sunucu hatası");
  }
});

app.get("/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Oturum kapatma hatası:", err);
      res.status(500).send("Sunucu hatası");
    } else {
      res.redirect("/admin/login");
    }
  });
});

// Admin Dashboard
app.get("/admin", ensureAdmin, (req, res) => {
  res.render("admin/dashboard", { title: "Admin Paneli" });
});

// Blog Yönetimi
app.get("/admin/blogs", ensureAdmin, async (req, res) => {
  const blogs = await Blog.find();
  res.render("admin/blogs/list", { title: "Blog Yönetimi", blogs });
});

app.get("/admin/blogs/add", ensureAdmin, (req, res) => {
  res.render("admin/blogs/add", { title: "Yeni Blog Ekle" });
});

app.post("/admin/blogs/add", ensureAdmin, upload.single("image"), async (req, res) => {
  const { title, content } = req.body;
  try {
    const imageUrl = req.file.path; // Cloudinary'den dönen URL
    const newBlog = new Blog({ title, content, image: imageUrl });
    await newBlog.save();
    res.redirect("/admin/blogs");
  } catch (err) {
    console.error("Blog eklenirken hata oluştu:", err);
    res.status(500).send("Blog eklenirken bir hata oluştu.");
  }
});

app.get("/admin/blogs/:id/edit", ensureAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).send("Blog bulunamadı.");
    }
    res.render("admin/blogs/edit", { title: "Blog Düzenle", blog });
  } catch (err) {
    console.error("Blog düzenleme formu yüklenirken hata:", err);
    res.status(500).send("Sunucu hatası");
  }
});

app.post("/admin/blogs/:id/edit", ensureAdmin, upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).send("Blog bulunamadı.");
    }

    blog.title = title;
    blog.content = content;
    if (req.file) {
      blog.image = req.file.path;
    }

    await blog.save();
    res.redirect("/admin/blogs");
  } catch (err) {
    console.error("Blog düzenlenirken hata oluştu:", err);
    res.status(500).send("Blog düzenlenirken bir hata oluştu.");
  }
});

app.post("/admin/blogs/:id/delete", ensureAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await Blog.findByIdAndDelete(id);
    res.redirect("/admin/blogs");
  } catch (err) {
    console.error("Blog silinirken hata oluştu:", err);
    res.status(500).send("Blog silinirken bir hata oluştu.");
  }
});

// SSS Yönetimi
app.get("/admin/faqs", ensureAdmin, async (req, res) => {
  try {
    const faqs = await Faq.find();
    res.render("admin/faqs", { title: "SSS Yönetimi", faqs });
  } catch (err) {
    console.error("FAQ'ları çekerken hata oluştu:", err);
    res.status(500).send("Sunucu hatası");
  }
});

app.post("/admin/faqs/add", ensureAdmin, async (req, res) => {
  const { question, answer } = req.body;
  try {
    const newFAQ = new Faq({ question, answer });
    await newFAQ.save();
    res.redirect("/admin/faqs");
  } catch (err) {
    console.error("FAQ eklenirken hata oluştu:", err);
    res.status(500).send("FAQ eklenirken bir hata oluştu.");
  }
});

app.post("/admin/faqs/edit", ensureAdmin, async (req, res) => {
  const { id, question, answer } = req.body;
  try {
    await Faq.findByIdAndUpdate(id, { question, answer });
    res.redirect("/admin/faqs");
  } catch (err) {
    console.error("FAQ düzenlenirken hata oluştu:", err);
    res.status(500).send("FAQ düzenlenirken bir hata oluştu.");
  }
});
app.post("/admin/faqs/delete", ensureAdmin, async (req, res) => {
  const { id } = req.body;
  try {
    await Faq.findByIdAndDelete(id);
    res.redirect("/admin/faqs");
  } catch (err) {
    console.error("FAQ silinirken hata oluştu:", err);
    res.status(500).send("FAQ silinirken bir hata oluştu.");
  }
});

// Sistem Ayarları Yönetimi
app.get("/admin/settings", ensureAdmin, async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.render("admin/settings", { title: "Sistem Ayarları", settings });
  } catch (err) {
    console.error("Sistem ayarları yüklenirken hata oluştu:", err);
    res.status(500).send("Sistem ayarları yüklenirken bir hata oluştu.");
  }
});

app.post("/admin/settings/update", ensureAdmin, async (req, res) => {
  const { contactEmail, contactPhone, address, facebook, instagram } = req.body;
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ contactEmail, contactPhone, address, facebook, instagram });
    } else {
      settings.contactEmail = contactEmail;
      settings.contactPhone = contactPhone;
      settings.address = address;
      settings.facebook = facebook;
      settings.instagram = instagram;
    }
    await settings.save();
    res.redirect("/admin/settings");
  } catch (err) {
    console.error("Sistem ayarları güncellenirken hata oluştu:", err);
    res.status(500).send("Sistem ayarları güncellenirken bir hata oluştu.");
  }
});

// Genel rotalar
app.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().limit(3).sort({ createdAt: -1 });
    res.render("index", { title: "Ana Sayfa", blogs });
  } catch (err) {
    console.error("Ana sayfa yüklenirken hata oluştu:", err);
    res.status(500).send("Ana sayfa yüklenirken bir hata oluştu.");
  }
});

app.get("/about", (req, res) => res.render("about", { title: "Hakkında" }));
app.get("/contact", (req, res) => res.render("contact", { title: "İletişim" }));
app.get("/service", (req, res) => res.render("service", { title: "Hizmetler" }));
app.get("/team", (req, res) => res.render("team", { title: "Takım" }));

// Blog Sayfaları
app.get("/blog", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    const recentPosts = await Blog.find().limit(3).sort({ createdAt: -1 });
    res.render("blog", { title: "Blog", blogs, recentPosts });
  } catch (err) {
    console.error("Bloglar yüklenirken hata oluştu:", err);
    res.status(500).send("Bloglar yüklenirken bir hata oluştu.");
  }
});

app.get("/blog/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog bulunamadı");

    const recentPosts = await Blog.find().sort({ createdAt: -1 }).limit(3);
    res.render("blog-details", { title: blog.title, blog, recentPosts });
  } catch (err) {
    console.error("Blog detayı yüklenirken hata oluştu:", err);
    res.status(500).send("Blog detayı yüklenirken bir hata oluştu.");
  }
});

// SSS Sayfası
app.get("/faq", async (req, res) => {
  try {
    const faqs = await Faq.find();
    res.render("faq", { title: "Sıkça Sorulan Sorular", faqs });
  } catch (err) {
    console.error("FAQ yüklenirken hata oluştu:", err);
    res.status(500).send("FAQ yüklenirken bir hata oluştu.");
  }
});

// Server başlatma
app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});
