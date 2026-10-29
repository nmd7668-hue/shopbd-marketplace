import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  onValue,
  push,
  set
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// ShopBD Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxf-pduCq1xyybAMLjXtJ5QPj4hjHKlPo",
  authDomain: "shopbd-c5326.firebaseapp.com",
  databaseURL: "https://shopbd-c5326-default-rtdb.firebaseio.com/",
  projectId: "shopbd-c5326",
  storageBucket: "shopbd-c5326.firebasestorage.app",
  messagingSenderId: "1056649748208",
  appId: "1:1056649748208:web:47ab5d9d1a5b7d0bdbac35"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const productList = document.getElementById("product-list");
const orderForm = document.getElementById("order-form");
const message = document.getElementById("order-message");
const submitButton = document.getElementById("submit-order");
const totalPrice = document.getElementById("total-price");

let products = {};
let selectedProductId = "";
let currentUser = null;
let productsLoaded = false;

function showMessage(text) {
  message.textContent = text;
}

function money(amount) {
  return "৳" + Number(amount || 0).toLocaleString("en-BD");
}

function updateTotal() {
  const quantityInput = document.getElementById("quantity");
  const product = products[selectedProductId];

  if (!product || !quantityInput) {
    totalPrice.textContent = money(0);
    return;
  }

  const quantity = Number(quantityInput.value);
  totalPrice.textContent = money(Number(product.price) * quantity);
}

function renderProducts(data) {
  productList.replaceChildren();
  products = data || {};
  const ids = Object.keys(products);

  if (ids.length === 0) {
    productList.textContent = "এখনো কোনো পণ্য পাওয়া যায়নি।";
    return;
  }

  ids.forEach((id) => {
    const product = products[id];
    const card = document.createElement("div");
    card.className = "product";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "selected-product";
    radio.value = id;
    radio.checked = id === selectedProductId;
    radio.style.width = "auto";
    radio.addEventListener("change", () => {
      selectedProductId = id;
      updateTotal();
    });

    const title = document.createElement("strong");
    title.textContent = product.name || "নাম নেই";

    const price = document.createElement("p");
    price.textContent = "দাম: " + money(product.price);

    card.append(radio, title, price);

    if (typeof product.imageUrl === "string" &&
        product.imageUrl.startsWith("https://")) {
      const img = document.createElement("img");
      img.src = product.imageUrl;
      img.alt = product.name || "পণ্যের ছবি";
      img.loading = "lazy";
      card.appendChild(img);
    }

    const description = document.createElement("p");
    description.textContent = product.description || "";
    card.appendChild(description);
    productList.appendChild(card);
  });

  if (!selectedProductId || !products[selectedProductId]) {
    selectedProductId = ids[0];
  }

  const firstRadio = productList.querySelector(
    `input[value="${CSS.escape(selectedProductId)}"]`
  );
  if (firstRadio) firstRadio.checked = true;

  let quantityLabel = document.getElementById("quantity-label");
  if (!quantityLabel) {
    quantityLabel = document.createElement("label");
    quantityLabel.id = "quantity-label";
    quantityLabel.htmlFor = "quantity";
    quantityLabel.textContent = "পরিমাণ";
    productList.after(quantityLabel);

    const quantityInput = document.createElement("input");
    quantityInput.id = "quantity";
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.max = "20";
    quantityInput.value = "1";
    quantityInput.required = true;
    quantityInput.addEventListener("input", updateTotal);
    quantityLabel.after(quantityInput);
  }

  updateTotal();
}

onValue(
  ref(db, "products"),
  (snapshot) => {
    renderProducts(snapshot.val());
    productsLoaded = true;
  },
  (error) => {
    console.error("Product read error:", error.code);
    productList.textContent =
      "পণ্য লোড করা যায়নি। Firebase Database Rules পরীক্ষা করুন।";
  }
);

onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (!user) {
    showMessage(
      "অর্ডার করতে আগে Firebase অ্যাকাউন্টে লগইন করুন। " +
      "আপনার ShopBD লগইন পেজ থেকে লগইন করে আবার এই পেজ খুলুন।"
    );
  } else {
    showMessage("আপনি লগইন করেছেন। পণ্য নির্বাচন করে অর্ডার করুন।");
  }
});

orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    showMessage("অর্ডারের আগে লগইন করুন।");
    return;
  }

  if (!productsLoaded) {
    showMessage("পণ্যের তালিকা লোড হওয়া পর্যন্ত অপেক্ষা করুন।");
    return;
  }

  const product = products[selectedProductId];
  if (!product) {
    showMessage("অনুগ্রহ করে একটি পণ্য নির্বাচন করুন।");
    return;
  }

  const name = document.getElementById("customer-name").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();
  const address = document.getElementById("customer-address").value.trim();
  const quantity = Number(document.getElementById("quantity")?.value);

  if (!name || !phone || !address) {
    showMessage("নাম, মোবাইল নম্বর ও ঠিকানা পূরণ করুন।");
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    showMessage("পরিমাণ ১ থেকে ২০-এর মধ্যে দিন।");
    return;
  }

  const price = Number(product.price);
  if (!Number.isFinite(price) || price < 0) {
    showMessage("এই পণ্যের দাম সঠিক নয়। Admin-এর সঙ্গে যোগাযোগ করুন।");
    return;
  }

  submitButton.disabled = true;
  showMessage("অর্ডার জমা হচ্ছে…");

  const order = {
    customerUid: currentUser.uid,
    customerName: name,
    customerPhone: phone,
    deliveryAddress: address,
    productId: selectedProductId,
    productName: String(product.name || ""),
    unitPrice: price,
    quantity,
    total: price * quantity,
    paymentMethod: "COD",
    status: "pending",
    createdAt: Date.now()
  };

  try {
    const newOrderRef = push(ref(db, `orders/${currentUser.uid}`));
    await set(newOrderRef, order);

    orderForm.reset();
    showMessage(
      "অর্ডার সফলভাবে জমা হয়েছে!\n" +
      "অর্ডার নম্বর: " + newOrderRef.key +
      "\nপেমেন্ট: Cash on Delivery"
    );

    updateTotal();
  } catch (error) {
    console.error("Order submit error:", error.code);
    showMessage(
      "অর্ডার জমা হয়নি। Firebase Database Rules ও লগইন পরীক্ষা করুন।"
    );
  } finally {
    submitButton.disabled = false;
  }
});