
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  push,
  set,
  update,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

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
const auth = getAuth(app);
const db = getDatabase(app);

const $ = id => document.getElementById(id);

let confirmationResult = null;
let recaptchaVerifier = null;
let currentProfile = null;
let editingProductId = null;
let unsubscribeProducts = null;

function message(id, text) {
  $(id).textContent = text;
}

function phoneNumber(value) {
  return value.trim().replace(/[\s()-]/g, "");
}

async function setupRecaptcha() {
  if (recaptchaVerifier) return;

  recaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha-container",
    { size: "normal" }
  );

  await recaptchaVerifier.render();
}

$("sendOtpBtn").addEventListener("click", async () => {
  try {
    const phone = phoneNumber($("sellerPhone").value);

    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      message("loginMessage", "দেশের কোডসহ সঠিক ফোন নম্বর লিখুন।");
      return;
    }

    await setupRecaptcha();

    confirmationResult = await signInWithPhoneNumber(
      auth, phone, recaptchaVerifier
    );

    message("loginMessage", "OTP পাঠানো হয়েছে। SMS দেখুন।");

  } catch (error) {
    console.error(error);
    message("loginMessage", "OTP পাঠানো যায়নি: " + error.message);

    if (recaptchaVerifier) {
      await recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
  }
});

$("verifyOtpBtn").addEventListener("click", async () => {
  try {
    if (!confirmationResult) {
      message("loginMessage", "আগে OTP পাঠান।");
      return;
    }

    const code = $("otpCode").value.trim();

    if (!/^\d{6}$/.test(code)) {
      message("loginMessage", "৬ সংখ্যার OTP লিখুন।");
      return;
    }

    await confirmationResult.confirm(code);
    message("loginMessage", "লগইন সফল হয়েছে।");

  } catch (error) {
    console.error(error);
    message("loginMessage", "OTP সঠিক নয় অথবা মেয়াদ শেষ হয়েছে।");
  }
});

onAuthStateChanged(auth, async user => {
  if (unsubscribeProducts) {
    unsubscribeProducts();
    unsubscribeProducts = null;
  }

  currentProfile = null;

  if (!user) {
    $("loginSection").classList.remove("hidden");
    $("dashboardSection").classList.add("hidden");
    return;
  }

  $("loginSection").classList.add("hidden");
  $("dashboardSection").classList.remove("hidden");
  $("sellerUid").textContent = user.uid;

  try {
    const profileSnapshot = await get(
      ref(db, "sellerProfiles/" + user.uid)
    );

    if (!profileSnapshot.exists()) {
      $("productSection").classList.add("hidden");
      $("sellerShopName").textContent = "দোকানের প্রোফাইল পাওয়া যায়নি।";
      $("sellerStatus").textContent =
        "Admin-কে আপনার UID দিন এবং অনুমোদিত Seller Profile তৈরি করতে বলুন।";
      $("myProducts").textContent = "অনুমোদনের অপেক্ষায়।";
      return;
    }

    currentProfile = profileSnapshot.val();

    if (currentProfile.status !== "Approved") {
      $("productSection").classList.add("hidden");
      $("sellerShopName").textContent =
        currentProfile.shopName || "আপনার দোকান";
      $("sellerStatus").textContent = "Admin অনুমোদনের অপেক্ষায়।";
      $("myProducts").textContent = "অনুমোদনের অপেক্ষায়।";
      return;
    }

    $("sellerShopName").textContent =
      "দোকান: " + (currentProfile.shopName || "");

    $("sellerStatus").textContent = "অবস্থা: অনুমোদিত";
    $("productSection").classList.remove("hidden");

    loadMyProducts(user.uid);

  } catch (error) {
    console.error(error);
    $("sellerStatus").textContent =
      "প্রোফাইল লোড হয়নি: " + error.message;
  }
});

function loadMyProducts(uid) {
  unsubscribeProducts = onValue(
    ref(db, "products"),
    snapshot => {
      const container = $("myProducts");
      container.replaceChildren();

      let count = 0;

      snapshot.forEach(child => {
        const product = child.val() || {};

        if (product.sellerUid !== uid) return;

        count++;

        const card = document.createElement("div");
        card.className = "seller-product";

        const title = document.createElement("h4");
        title.textContent = product.name || "";

        const price = document.createElement("p");
        price.textContent = "দাম: ৳" + (product.price || 0);

        const status = document.createElement("p");
        status.textContent =
          "অনুমোদন: " + (product.status || "Pending");

        const edit = document.createElement("button");
        edit.type = "button";
        edit.textContent = "সম্পাদনা";
        edit.addEventListener("click", () => {
          startEdit(child.key, product);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "মুছুন";

        deleteButton.addEventListener("click", async () => {
          if (!confirm("এই পণ্যটি মুছতে চান?")) return;

          try {
            await remove(ref(db, "products/" + child.key));
            message("productMessage", "পণ্য মুছে ফেলা হয়েছে।");
          } catch (error) {
            message("productMessage", "মুছতে সমস্যা: " + error.message);
          }
        });

        card.append(title, price, status, edit, deleteButton);
        container.appendChild(card);
      });

      if (!count) {
        container.textContent = "আপনি এখনো কোনো পণ্য যোগ করেননি।";
      }
    },
    error => {
      console.error(error);
      message("productMessage", "পণ্য লোড হয়নি: " + error.message);
    }
  );
}

$("productForm").addEventListener("submit", async event => {
  event.preventDefault();

  const user = auth.currentUser;

  if (!user || !currentProfile ||
      currentProfile.status !== "Approved") {
    message("productMessage", "অনুমোদিত দোকানদার লগইন করুন।");
    return;
  }

  const form = event.currentTarget;
  const data = new FormData(form);

  const name = String(data.get("name") || "").trim();
  const category = String(data.get("category") || "").trim();
  const imageUrl = String(data.get("imageUrl") || "").trim();
  const description = String(data.get("description") || "").trim();
  const price = Number(data.get("price"));
  const stock = Number(data.get("stock"));

  if (!name || !category || !imageUrl || !description ||
      !Number.isFinite(price) || price <= 0 ||
      !Number.isInteger(stock) || stock < 0) {
    message("productMessage", "সব তথ্য সঠিকভাবে পূরণ করুন।");
    return;
  }

  if (!/^https:\/\//i.test(imageUrl)) {
    message("productMessage", "ছবির URL অবশ্যই https:// দিয়ে শুরু হতে হবে।");
    return;
  }

  const button = $("saveProductBtn");
  button.disabled = true;

  try {
    const productData = {
      name,
      category,
      imageUrl,
      description,
      price,
      stock,
      sellerUid: user.uid,
      sellerShopName: currentProfile.shopName || "",
      status: "Pending",
      updatedAt: Date.now()
    };

    if (editingProductId) {
      await update(
        ref(db, "products/" + editingProductId),
        productData
      );
      message("productMessage", "পরিবর্তন জমা হয়েছে। Admin অনুমোদন করবেন।");
    } else {
      productData.createdAt = Date.now();

      const newProduct = push(ref(db, "products"));
      await set(newProduct, productData);

      message("productMessage", "পণ্য জমা হয়েছে। Admin অনুমোদনের অপেক্ষায় থাকুন।");
    }

    form.reset();
    editingProductId = null;
    $("cancelEditBtn").classList.add("hidden");
    button.textContent = "পণ্য জমা দিন";

  } catch (error) {
    console.error(error);
    message("productMessage", "পণ্য জমা হয়নি: " + error.message);
  } finally {
    button.disabled = false;
  }
});

function startEdit(id, product) {
  editingProductId = id;

  const form = $("productForm");
  form.elements.name.value = product.name || "";
  form.elements.category.value = product.category || "";
  form.elements.imageUrl.value = product.imageUrl || "";
  form.elements.price.value = product.price || "";
  form.elements.stock.value = product.stock ?? 0;
  form.elements.description.value = product.description || "";

  $("saveProductBtn").textContent = "পরিবর্তন জমা দিন";
  $("cancelEditBtn").classList.remove("hidden");

  message("productMessage", "পণ্য পরিবর্তন করুন।");
}

$("cancelEditBtn").addEventListener("click", () => {
  editingProductId = null;
  $("productForm").reset();
  $("saveProductBtn").textContent = "পণ্য জমা দিন";
  $("cancelEditBtn").classList.add("hidden");
  message("productMessage", "");
});

$("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  confirmationResult = null;
  message("loginMessage", "আপনি লগআউট করেছেন।");
});
