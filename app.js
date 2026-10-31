
/* ==========================================
   ShopBD Marketplace
   Firebase Connected - Complete app.js
   ========================================== */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getDatabase,
  ref,
  push,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";


// 1. FIREBASE CONFIGURATION

const firebaseConfig = {
  apiKey: "AIzaSyAxf-pduCq1xyybAMLjXtJ5QPj4hjHKlPo",
  authDomain: "shopbd-c5326.firebaseapp.com",
  databaseURL: "https://shopbd-c5326-default-rtdb.firebaseio.com",
  projectId: "shopbd-c5326",
  storageBucket: "shopbd-c5326.firebasestorage.app",
  messagingSenderId: "1056649748208",
  appId: "1:1056649748208:web:47ab5d9d1a5b7d0bdbac35",
  measurementId: "G-77ME2TGNMV"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


// 2. HELPERS

const $ = selector => document.querySelector(selector);

function showMessage(selector, message) {
  const element = $(selector);
  if (element) element.textContent = message;
}

function safeText(value) {
  return String(value ?? "");
}

function getField(form, name) {
  return form.querySelector(`[name="${name}"]`);
}


// 3. AFFILIATE PRODUCTS

const affiliateProducts = [
  {
    id: "mobile001",
    name: "মোবাইল ফোন",
    category: "ইলেকট্রনিক্স",
    description: "Daraz-এ পণ্যটি দেখুন ও কিনুন",
    emoji: "📱",
    link: "https://s.daraz.com.bd/s.YeFyI?cc",
    source: "affiliate"
  },
  {
    id: "headphone001",
    name: "হেডফোন",
    category: "ইলেকট্রনিক্স",
    description: "Daraz-এ হেডফোনটি দেখুন ও কিনুন",
    emoji: "🎧",
    link: "https://s.daraz.com.bd/s.Yevrj?cc",
    source: "affiliate"
  }
];

let shopProducts = [];
let activeCategory = "সব";
let selectedProduct = null;


// 4. LOAD PRODUCTS

onValue(
  ref(db, "products"),

  snapshot => {
    shopProducts = [];

    if (snapshot.exists()) {
      snapshot.forEach(child => {
        const product = child.val() || {};

        shopProducts.push({
          id: child.key,
          name: safeText(product.name),
          category: safeText(product.category || "অন্যান্য"),
          description: safeText(product.description),
          price: Number(product.price || 0),
          imageUrl: safeText(product.imageUrl),
          source: "shopbd"
        });
      });
    }

    renderProducts();
  },

  error => {
    console.error("Product loading error:", error);
    showMessage(
      "#emptyProducts",
      "পণ্য লোড হয়নি: " + error.message
    );
  }
);


// 5. RENDER PRODUCTS

function renderProducts() {
  const grid = $("#productGrid");
  const empty = $("#emptyProducts");
  const search = $("#search");

  if (!grid) return;

  const query = safeText(search?.value).trim().toLowerCase();

  const allProducts = [
    ...affiliateProducts,
    ...shopProducts
  ];

  const items = allProducts.filter(product => {
    const categoryMatch =
      activeCategory === "সব" ||
      product.category === activeCategory;

    const searchMatch = (
      product.name + " " +
      product.category + " " +
      product.description
    ).toLowerCase().includes(query);

    return categoryMatch && searchMatch;
  });

  grid.replaceChildren();

  items.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const imageArea = document.createElement("div");
    imageArea.className = "product-image";

    if (product.imageUrl?.startsWith("https://")) {
      const image = document.createElement("img");
      image.src = product.imageUrl;
      image.alt = product.name;
      image.loading = "lazy";
      imageArea.appendChild(image);
    } else {
      imageArea.textContent = product.emoji || "🛍️";
    }

    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = product.category;

    const title = document.createElement("h3");
    title.textContent = product.name;

    const description = document.createElement("p");
    description.textContent = product.description;

    card.append(imageArea, category, title, description);

    if (product.source === "affiliate") {
      const link = document.createElement("a");
      link.className = "button";
      link.href = product.link;
      link.target = "_blank";
      link.rel = "sponsored noopener noreferrer";
      link.textContent = "Daraz-এ কিনুন";
      card.appendChild(link);
    } else {
      const price = document.createElement("p");
      price.textContent = `দাম: ৳${product.price}`;

      const button = document.createElement("button");
      button.className = "button";
      button.type = "button";
      button.textContent = "অর্ডার করুন";

      button.addEventListener("click", () => openOrder(product));

      card.append(price, button);
    }

    grid.appendChild(card);
  });

  if (empty) {
    empty.hidden = items.length > 0;
    if (!items.length) {
      empty.textContent = "এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি।";
    }
  }
}


// 6. CATEGORY FILTER

document.querySelectorAll("[data-category]").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category || "সব";

    document.querySelectorAll("[data-category]").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderProducts();
  });
});


// 7. SEARCH

$("#search")?.addEventListener("input", renderProducts);


// 8. OPEN ORDER MODAL

function openOrder(product) {
  if (product.source !== "shopbd") {
    alert("এই Affiliate পণ্যের অর্ডার ShopBD থেকে নেওয়া হয় না।");
    return;
  }

  selectedProduct = product;

  const modal = $("#orderModal");
  if (!modal) {
    alert("অর্ডার ফর্ম পাওয়া যায়নি।");
    return;
  }

  const title = $("#orderProductName");
  if (title) title.textContent = product.name;

  const productId = getField(modal, "productId");
  if (productId) productId.value = product.id;

  const payment = getField(modal, "payment");
  if (payment) payment.value = "COD";

  showMessage("#orderMessage", "");

  modal.hidden = false;
  modal.style.display = "block";
}


// 9. CLOSE ORDER MODAL

$("#closeModal")?.addEventListener("click", () => {
  const modal = $("#orderModal");

  if (modal) {
    modal.hidden = true;
    modal.style.display = "none";
  }

  selectedProduct = null;
});


// 10. SUBMIT ORDER

$("#orderForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const form = event.currentTarget;

  if (!selectedProduct) {
    showMessage("#orderMessage", "আগে একটি ShopBD পণ্য নির্বাচন করুন।");
    return;
  }

  const formData = new FormData(form);

  const customer = safeText(formData.get("customer")).trim();
  const phone = safeText(formData.get("phone")).trim();
  const address = safeText(formData.get("address")).trim();
  const payment = safeText(formData.get("payment"));

  if (!customer || !phone || !address) {
    showMessage("#orderMessage", "নাম, ফোন ও ঠিকানা পূরণ করুন।");
    return;
  }

  if (address.length < 8) {
    showMessage("#orderMessage", "সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।");
    return;
  }

  if (payment !== "COD") {
    showMessage("#orderMessage", "বর্তমানে শুধু Cash on Delivery চালু আছে।");
    return;
  }

  const button = form.querySelector('[type="submit"]');
  if (button) button.disabled = true;

  try {
    const orderRef = push(ref(db, "orders"));

    await set(orderRef, {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      price: selectedProduct.price,
      total: selectedProduct.price,
      customer,
      phone,
      address,
      paymentMethod: "Cash on Delivery",
      status: "Pending",
      createdAt: Date.now()
    });

    showMessage("#orderMessage", "আপনার অর্ডার সফলভাবে জমা হয়েছে!");

    form.reset();
    selectedProduct = null;

    setTimeout(() => {
      const modal = $("#orderModal");
      if (modal) {
        modal.hidden = true;
        modal.style.display = "none";
      }
    }, 1500);

  } catch (error) {
    console.error("Order error:", error);
    showMessage("#orderMessage", "অর্ডার জমা হয়নি: " + error.message);
  } finally {
    if (button) button.disabled = false;
  }
});


// 11. SELLER APPLICATION - FIXED

const sellerForm = $("#sellerForm");

if (sellerForm) {
  sellerForm.addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;

    // HTML-এর সঠিক field name:
    // name, contact, shop

    const name = safeText(getField(form, "name")?.value).trim();
    const contact = safeText(getField(form, "contact")?.value).trim();
    const shopName = safeText(getField(form, "shop")?.value).trim();

    if (!name || !contact || !shopName) {
      showMessage(
        "#sellerMessage",
        "নাম, যোগাযোগের তথ্য এবং দোকানের নাম পূরণ করুন।"
      );
      return;
    }

    const button = form.querySelector('[type="submit"]');

    if (button) {
      button.disabled = true;
      button.textContent = "জমা হচ্ছে...";
    }

    showMessage("#sellerMessage", "আপনার আবেদন জমা হচ্ছে...");

    try {
      const applicationRef = push(ref(db, "sellerApplications"));

      await set(applicationRef, {
        name: name,
        phone: contact,
        contact: contact,
        email: "",
        shopName: shopName,
        address: "",
        status: "Pending",
        createdAt: Date.now()
      });

      showMessage(
        "#sellerMessage",
        "আপনার বিক্রেতার আবেদন সফলভাবে জমা হয়েছে। Admin অনুমোদনের অপেক্ষা করুন।"
      );

      form.reset();

    } catch (error) {
      console.error("Seller application error:", error);

      showMessage(
        "#sellerMessage",
        "আবেদন জমা হয়নি: " + error.message
      );

    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "বিক্রেতার আবেদন";
      }
    }
  });

} else {
  console.error("Seller form not found: #sellerForm");
}


// 12. FOOTER YEAR

const year = $("#year");
if (year) {
  year.textContent = new Date().getFullYear();
}


// 13. INITIAL RENDER

renderProducts();

console.log("ShopBD Marketplace Firebase App Loaded Successfully.");
