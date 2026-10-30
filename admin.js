
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  push,
  set,
  update,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// আপনার আগের Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxf-pduCq1xyybAMLjXtJ5QPj4hjHKlPo",
  authDomain: "shopbd-c5326.firebaseapp.com",
  databaseURL: "https://shopbd-c5326-default-rtdb.firebaseio.com/",
  projectId: "shopbd-c5326",
  storageBucket: "shopbd-c5326.firebasestorage.app",
  messagingSenderId: "1056649748208",
  appId: "1:1056649748208:web:47ab5d9d1a5b7d0bdbac35",
  measurementId: "G-77ME2TGNMV"
};

const ADMIN_UID = "1vwxJ88hqKhErAIcwwCEBE2H3p63";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// HTML elements
const $ = id => document.getElementById(id);

const loginSection = $("login-section");
const dashboard = $("admin-dashboard");
const loginForm = $("login-form");
const loginMessage = $("login-message");
const productForm = $("product-form");
const productMessage = $("product-message");
const productList = $("product-list");
const sellerList = $("seller-list");
const orderList = $("order-list");

let editingProductId = null;
let listenersStarted = false;

function message(id, text) {
  if ($(id)) $(id).textContent = text;
}

function isAdmin() {
  return auth.currentUser?.uid === ADMIN_UID;
}

function makeCard(titleText) {
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = titleText || "তথ্য নেই";

  card.appendChild(title);
  return card;
}

function addText(card, text) {
  const p = document.createElement("p");
  p.textContent = text;
  card.appendChild(p);
}

function makeButton(label, className, callback) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (className) button.className = className;
  button.addEventListener("click", callback);
  return button;
}

// Login
loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  const button = $("login-button");
  button.disabled = true;
  message("login-message", "লগইন হচ্ছে...");

  try {
    const email = $("email").value.trim();
    const password = $("password").value;

    const result = await signInWithEmailAndPassword(
      auth, email, password
    );

    if (result.user.uid !== ADMIN_UID) {
      await signOut(auth);
      message("login-message", "এই অ্যাকাউন্ট Admin নয়।");
    }
  } catch (error) {
    console.error(error);
    message(
      "login-message",
      "লগইন ব্যর্থ। ইমেইল, পাসওয়ার্ড ও Firebase সেটিং পরীক্ষা করুন।"
    );
  } finally {
    button.disabled = false;
  }
});

// Authentication check
onAuthStateChanged(auth, user => {
  const allowed = !!user && user.uid === ADMIN_UID;

  loginSection.hidden = allowed;
  dashboard.hidden = !allowed;

  if (user && !allowed) {
    message("login-message", "Admin অনুমতি নেই।");
    signOut(auth);
  }

  if (allowed && !listenersStarted) {
    listenersStarted = true;
    loadProducts();
    loadSellers();
    loadOrders();
  }
});

// Logout
$("logout-button").addEventListener("click", () => {
  signOut(auth);
});

// Dashboard tabs
document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    ["products-section", "sellers-section", "orders-section"]
      .forEach(id => {
        $(id).hidden = id !== button.dataset.tab;
      });
  });
});

// Reset product form
function resetProductForm() {
  productForm.reset();
  editingProductId = null;
  $("editing-product-id").value = "";
  $("add-product-button").textContent = "পণ্য যোগ করুন";
  $("cancel-edit-button").hidden = true;
}

$("cancel-edit-button").addEventListener("click", resetProductForm);

// Add or update product
productForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!isAdmin()) {
    message("product-message", "Admin অনুমতি নেই।");
    return;
  }

  const name = $("product-name").value.trim();
  const price = Number($("product-price").value);
  const imageUrl = $("product-image").value.trim();
  const description = $("product-description").value.trim();

  if (!name || !Number.isFinite(price) || price < 0) {
    message("product-message", "সঠিক পণ্যের নাম ও দাম দিন।");
    return;
  }

  if (imageUrl && !imageUrl.startsWith("https://")) {
    message("product-message", "ছবির URL অবশ্যই https:// হতে হবে।");
    return;
  }

  const button = $("add-product-button");
  button.disabled = true;

  try {
    const data = {
      name,
      price,
      imageUrl,
      description,
      updatedAt: Date.now()
    };

    if (editingProductId) {
      await update(
        ref(db, `products/${editingProductId}`),
        data
      );
      message("product-message", "পণ্য আপডেট হয়েছে।");
    } else {
      const newRef = push(ref(db, "products"));
      await set(newRef, {
        ...data,
        createdAt: Date.now()
      });
      message("product-message", "নতুন পণ্য যোগ হয়েছে।");
    }

    resetProductForm();
  } catch (error) {
    console.error(error);
    message("product-message", "পণ্য সংরক্ষণ হয়নি। Database Rules পরীক্ষা করুন।");
  } finally {
    button.disabled = false;
  }
});

// Load products
function loadProducts() {
  onValue(ref(db, "products"), snapshot => {
    productList.replaceChildren();

    if (!snapshot.exists()) {
      productList.textContent = "কোনো পণ্য পাওয়া যায়নি।";
      return;
    }

    snapshot.forEach(child => {
      const id = child.key;
      const p = child.val() || {};
      const card = makeCard(p.name);

      addText(card, `দাম: ৳${Number(p.price || 0)}`);
      addText(card, p.description || "বিবরণ নেই");

      if (p.imageUrl?.startsWith("https://")) {
        const image = document.createElement("img");
        image.src = p.imageUrl;
        image.alt = p.name || "পণ্য";
        image.loading = "lazy";
        card.appendChild(image);
      }

      card.appendChild(makeButton("সম্পাদনা করুন", "edit", () => {
        editingProductId = id;
        $("editing-product-id").value = id;
        $("product-name").value = p.name || "";
        $("product-price").value = p.price ?? "";
        $("product-image").value = p.imageUrl || "";
        $("product-description").value = p.description || "";
        $("add-product-button").textContent = "পণ্য আপডেট করুন";
        $("cancel-edit-button").hidden = false;
        $("products-section").hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }));

      card.appendChild(makeButton("পণ্য মুছুন", "danger", async () => {
        if (!isAdmin()) return;
        if (!confirm(`${p.name || "এই পণ্য"} মুছবেন?`)) return;

        try {
          await remove(ref(db, `products/${id}`));
          message("product-message", "পণ্য মুছে ফেলা হয়েছে।");
        } catch (error) {
          console.error(error);
          message("product-message", "পণ্য মোছা যায়নি।");
        }
      }));

      productList.appendChild(card);
    });
  }, error => {
    console.error(error);
    productList.textContent = "পণ্য লোড করা যায়নি।";
  });
}

// Load seller applications
function loadSellers() {
  onValue(ref(db, "sellerApplications"), snapshot => {
    sellerList.replaceChildren();

    if (!snapshot.exists()) {
      sellerList.textContent = "এখনো কোনো বিক্রেতার আবেদন নেই।";
      return;
    }

    snapshot.forEach(child => {
      const id = child.key;
      const seller = child.val() || {};
      const card = makeCard(seller.name || seller.shopName || "বিক্রেতার আবেদন");

      addText(card, `দোকান: ${seller.shopName || "নেই"}`);
      addText(card, `ইমেইল: ${seller.email || "নেই"}`);
      addText(card, `ফোন: ${seller.phone || "নেই"}`);
      addText(card, `ঠিকানা: ${seller.address || "নেই"}`);
      addText(card, `অবস্থা: ${seller.status || "Pending"}`);

      if (seller.status !== "approved") {
        card.appendChild(makeButton("অনুমোদন করুন", "", async () => {
          if (!isAdmin()) return;
          try {
            await update(ref(db, `sellerApplications/${id}`), {
              status: "approved",
              reviewedAt: Date.now()
            });
            message("seller-message", "বিক্রেতার আবেদন অনুমোদিত হয়েছে।");
          } catch (error) {
            console.error(error);
            message("seller-message", "অনুমোদন করা যায়নি।");
          }
        }));
      }

      if (seller.status !== "rejected") {
        card.appendChild(makeButton("Reject করুন", "danger", async () => {
          if (!isAdmin()) return;
          try {
            await update(ref(db, `sellerApplications/${id}`), {
              status: "rejected",
              reviewedAt: Date.now()
            });
            message("seller-message", "আবেদন Reject করা হয়েছে।");
          } catch (error) {
            console.error(error);
            message("seller-message", "Reject করা যায়নি।");
          }
        }));
      }

      sellerList.appendChild(card);
    });
  }, error => {
    console.error(error);
    sellerList.textContent = "বিক্রেতার আবেদন লোড হয়নি।";
  });
}

// Load and manage orders
function loadOrders() {
  onValue(ref(db, "orders"), snapshot => {
    orderList.replaceChildren();

    if (!snapshot.exists()) {
      orderList.textContent = "এখনো কোনো অর্ডার নেই।";
      return;
    }

    snapshot.forEach(child => {
      const id = child.key;
      const order = child.val() || {};
      const card = makeCard(`অর্ডার #${id}`);

      addText(card, `গ্রাহক: ${order.customer || order.name || "নেই"}`);
      addText(card, `ফোন: ${order.phone || "নেই"}`);
      addText(card, `ঠিকানা: ${order.address || "নেই"}`);
      addText(card, `পণ্য: ${order.productName || order.product || "নেই"}`);
      addText(card, `মোট দাম: ৳${Number(order.total || order.price || 0)}`);
      addText(card, `পেমেন্ট: ${order.paymentMethod || "নেই"}`);
      addText(card, `বর্তমান অবস্থা: ${order.status || "Pending"}`);

      const select = document.createElement("select");

      [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
      ].forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        select.appendChild(option);
      });

      select.value = order.status || "Pending";
      card.appendChild(select);

      card.appendChild(makeButton("স্ট্যাটাস আপডেট করুন", "", async () => {
        if (!isAdmin()) return;

        try {
          await update(ref(db, `orders/${id}`), {
            status: select.value,
            updatedAt: Date.now()
          });
          message("order-message", "অর্ডারের স্ট্যাটাস আপডেট হয়েছে।");
        } catch (error) {
          console.error(error);
          message("order-message", "স্ট্যাটাস আপডেট হয়নি।");
        }
      }));

      orderList.appendChild(card);
    });
  }, error => {
    console.error(error);
    orderList.textContent = "অর্ডার লোড করা যায়নি।";
  });
}
