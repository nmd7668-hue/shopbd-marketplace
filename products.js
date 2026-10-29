import { initializeApp, getApp, getApps } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getDatabase, ref, onValue } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// আপনার ShopBD Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyAxf-pduCq1xyybAMLjXtJ5QPj4hjHKlPo",
  authDomain: "shopbd-c5326.firebaseapp.com",
  databaseURL: "https://shopbd-c5326-default-rtdb.firebaseio.com/",
  projectId: "shopbd-c5326",
  storageBucket: "shopbd-c5326.firebasestorage.app",
  messagingSenderId: "1056649748208",
  appId: "1:1056649748208:web:47ab5d9d1a5b7d0bdbac35"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

const list = document.getElementById("products-list");
const message = document.getElementById("products-message");

function showProducts(data) {
  list.replaceChildren();

  const products = Object.entries(data || {});

  if (products.length === 0) {
    message.textContent = "এখনো কোনো পণ্য যোগ করা হয়নি।";
    return;
  }

  message.textContent = products.length + "টি পণ্য পাওয়া গেছে।";

  products.forEach(([id, product]) => {
    if (!product || typeof product !== "object") return;

    const card = document.createElement("article");
    card.style.cssText =
      "border:1px solid #ddd;border-radius:12px;padding:14px;" +
      "margin:12px 0;background:white;";

    const name = document.createElement("h3");
    name.textContent = product.name || "পণ্যের নাম নেই";

    const price = document.createElement("p");
    const amount = Number(product.price);
    price.textContent = Number.isFinite(amount)
      ? "দাম: ৳" + amount.toLocaleString("en-BD")
      : "দাম জানতে যোগাযোগ করুন";

    card.append(name);

    if (
      typeof product.imageUrl === "string" &&
      /^https:\/\//i.test(product.imageUrl)
    ) {
      const img = document.createElement("img");
      img.src = product.imageUrl;
      img.alt = product.name || "পণ্য";
      img.loading = "lazy";
      img.style.cssText =
        "width:100%;max-width:320px;max-height:260px;" +
        "object-fit:contain;display:block;";
      card.append(img);
    }

    card.append(price);

    if (product.description) {
      const description = document.createElement("p");
      description.textContent = product.description;
      card.append(description);
    }

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "অর্ডার করুন";
    button.style.cssText =
      "background:#087443;color:white;border:0;" +
      "padding:12px 18px;border-radius:8px;";

    button.addEventListener("click", () => {
      window.location.href =
        "./checkout.html?product=" + encodeURIComponent(id);
    });

    card.append(button);
    list.append(card);
  });
}

onValue(
  ref(db, "products"),
  snapshot => showProducts(snapshot.val()),
  error => {
    console.error("Firebase products error:", error.code);
    message.textContent =
      "পণ্য লোড হয়নি। Firebase Database Rules ও সংযোগ পরীক্ষা করুন।";
  }
);