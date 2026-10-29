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
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// আপনার ShopBD Firebase project configuration
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

// আপনার Admin UID
const ADMIN_UID = "1vwxJ88hqKhErAIcwwCEBE2H3p63";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("admin-dashboard");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const productForm = document.getElementById("product-form");
const productMessage = document.getElementById("product-message");
const productList = document.getElementById("product-list");
const loginButton = document.getElementById("login-button");
const addProductButton = document.getElementById("add-product-button");

function showLoginMessage(message) {
  loginMessage.textContent = message;
}

function showProductMessage(message) {
  productMessage.textContent = message;
}

function getLoginErrorMessage(code) {
  const messages = {
    "auth/invalid-credential": "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।",
    "auth/user-not-found": "এই ইমেইলে Firebase অ্যাকাউন্ট পাওয়া যায়নি।",
    "auth/wrong-password": "পাসওয়ার্ড সঠিক নয়।",
    "auth/invalid-email": "ইমেইলের ফরম্যাট সঠিক নয়।",
    "auth/too-many-requests": "অনেকবার চেষ্টা হয়েছে। পরে আবার চেষ্টা করুন।",
    "auth/network-request-failed": "ইন্টারনেট সংযোগ পরীক্ষা করুন।",
    "auth/operation-not-allowed":
      "Firebase Console-এ Email/Password sign-in চালু করুন।",
    "auth/invalid-api-key":
      "Firebase API Key পরীক্ষা করুন।",
    "auth/unauthorized-domain":
      "Firebase Authentication-এর Authorized domains-এ GitHub Pages domain যোগ করুন।"
  };

  return messages[code] || `লগইন ব্যর্থ হয়েছে। ত্রুটি: ${code || "unknown"}`;
}

// Login
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginButton.disabled = true;
  showLoginMessage("লগইন করা হচ্ছে…");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const credential = await signInWithEmailAndPassword(
      auth, email, password
    );

    if (credential.user.uid !== ADMIN_UID) {
      showLoginMessage("এই অ্যাকাউন্টের Admin অনুমতি নেই।");
      await signOut(auth);
    }
  } catch (error) {
    console.error("Firebase login error:", error.code);
    showLoginMessage(getLoginErrorMessage(error.code));
  } finally {
    loginButton.disabled = false;
  }
});

// Check signed-in account and admin UID
onAuthStateChanged(auth, (user) => {
  if (user && user.uid === ADMIN_UID) {
    loginSection.hidden = true;
    dashboard.hidden = false;
    showLoginMessage("");
    loadProducts();
  } else {
    loginSection.hidden = false;
    dashboard.hidden = true;

    if (user && user.uid !== ADMIN_UID) {
      showLoginMessage("এই অ্যাকাউন্টের Admin অনুমতি নেই।");
      signOut(auth).catch((error) => {
        console.error("Sign-out error:", error.code);
      });
    }
  }
});

// Logout
document.getElementById("logout-button").addEventListener("click", async () => {
  try {
    await signOut(auth);
    showLoginMessage("আপনি লগআউট করেছেন।");
  } catch (error) {
    showLoginMessage("লগআউট করা যায়নি। আবার চেষ্টা করুন।");
  }
});

// Add product
productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const user = auth.currentUser;
  if (!user || user.uid !== ADMIN_UID) {
    showProductMessage("অনুমতি নেই। আবার Admin হিসেবে লগইন করুন।");
    return;
  }

  const name = document.getElementById("product-name").value.trim();
  const price = Number(document.getElementById("product-price").value);
  const imageUrl = document.getElementById("product-image").value.trim();
  const description =
    document.getElementById("product-description").value.trim();

  if (!name || !Number.isFinite(price) || price < 0) {
    showProductMessage("পণ্যের নাম ও সঠিক দাম দিন।");
    return;
  }

  if (imageUrl && !imageUrl.startsWith("https://")) {
    showProductMessage("ছবির URL অবশ্যই https:// দিয়ে শুরু হতে হবে।");
    return;
  }

  addProductButton.disabled = true;
  showProductMessage("পণ্য যোগ হচ্ছে…");

  try {
    const newProductRef = push(ref(db, "products"));
    await set(newProductRef, {
      name,
      price,
      imageUrl,
      description,
      createdAt: Date.now()
    });

    productForm.reset();
    showProductMessage("পণ্য সফলভাবে যোগ হয়েছে।");
  } catch (error) {
    console.error("Add product error:", error.code);
    showProductMessage(
      "পণ্য যোগ হয়নি। Firebase Database Rules ও ইন্টারনেট পরীক্ষা করুন।"
    );
  } finally {
    addProductButton.disabled = false;
  }
});

// Load product list
function loadProducts() {
  onValue(
    ref(db, "products"),
    (snapshot) => {
      productList.replaceChildren();

      if (!snapshot.exists()) {
        productList.textContent = "এখনো কোনো পণ্য যোগ করা হয়নি।";
        return;
      }

      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val() || {};
        const productId = childSnapshot.key;

        const card = document.createElement("div");
        card.className = "product";

        const title = document.createElement("h3");
        title.textContent = product.name || "নাম নেই";

        const price = document.createElement("p");
        price.textContent = `দাম: ৳${Number(product.price || 0).toLocaleString("en-BD")}`;

        const description = document.createElement("p");
        description.textContent = product.description || "";

        card.append(title, price, description);

        if (
          typeof product.imageUrl === "string" &&
          product.imageUrl.startsWith("https://")
        ) {
          const image = document.createElement("img");
          image.src = product.imageUrl;
          image.alt = product.name || "পণ্যের ছবি";
          image.loading = "lazy";
          image.style.maxWidth = "100%";
          image.style.maxHeight = "180px";
          card.appendChild(image);
        }

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "পণ্য মুছুন";

        deleteButton.addEventListener("click", async () => {
          const currentUser = auth.currentUser;

          if (!currentUser || currentUser.uid !== ADMIN_UID) {
            showProductMessage("এই কাজের অনুমতি নেই।");
            return;
          }

          if (!confirm(`"${product.name || "এই পণ্য"}" মুছবেন?`)) {
            return;
          }

          try {
            await remove(ref(db, `products/${productId}`));
            showProductMessage("পণ্য মুছে ফেলা হয়েছে।");
          } catch (error) {
            console.error("Delete product error:", error.code);
            showProductMessage(
              "পণ্য মোছা যায়নি। Database Rules পরীক্ষা করুন।"
            );
          }
        });

        card.appendChild(deleteButton);
        productList.appendChild(card);
      });
    },
    (error) => {
      console.error("Load products error:", error.code);
      productList.textContent =
        "পণ্য লোড হয়নি। Firebase Database Rules পরীক্ষা করুন।";
    }
  );
}