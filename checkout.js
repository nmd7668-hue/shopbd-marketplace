import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getDatabase, ref, onValue, push, set } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// আপনার বর্তমান ShopBD Firebase project
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
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app), db = getDatabase(app);
const $ = id => document.getElementById(id);
let products = {}, selectedProductId = "", currentUser = null, productsLoaded = false;

function money(n) { return "৳" + Number(n || 0).toLocaleString("en-BD", {maximumFractionDigits:2}); }
function say(s) { $("order-message").textContent = s; }
function updateTotal() {
  const p = products[selectedProductId], q = Number($("quantity").value);
  $("total-price").textContent = p && Number.isInteger(q) && q > 0 ? money(Number(p.price) * q) : money(0);
}
function renderProducts(data) {
  $("product-list").replaceChildren(); products = data || {};
  const ids = Object.keys(products).filter(id => products[id] && Number.isFinite(Number(products[id].price)) && Number(products[id].price) >= 0);
  if (!ids.length) { $("product-list").textContent = "এখনো কোনো পণ্য পাওয়া যায়নি।"; selectedProductId = ""; updateTotal(); return; }
  if (!ids.includes(selectedProductId)) selectedProductId = ids[0];
  for (const id of ids) {
    const p = products[id], card = document.createElement("div"); card.className = "product";
    const radio = document.createElement("input"); radio.type = "radio"; radio.name = "selected-product"; radio.value = id; radio.checked = id === selectedProductId; radio.style.width = "auto";
    radio.addEventListener("change", () => { selectedProductId = id; updateTotal(); });
    const name = document.createElement("strong"); name.textContent = p.name || "নাম নেই";
    const price = document.createElement("p"); price.textContent = "দাম: " + money(p.price);
    card.append(radio, document.createTextNode(" "), name, price);
    if (typeof p.imageUrl === "string" && p.imageUrl.startsWith("https://")) { const img = document.createElement("img"); img.src = p.imageUrl; img.alt = p.name || "পণ্যের ছবি"; img.loading = "lazy"; card.appendChild(img); }
    if (p.description) { const d = document.createElement("p"); d.textContent = p.description; card.appendChild(d); }
    $("product-list").appendChild(card);
  }
  updateTotal();
}
onValue(ref(db, "products"), snap => { renderProducts(snap.val()); productsLoaded = true; }, err => {
  console.error("Products read error:", err.code); $("product-list").textContent = "পণ্য লোড হয়নি। Database Rules পরীক্ষা করুন।";
});
onAuthStateChanged(auth, user => {
  currentUser = user;
  say(user ? "আপনি লগইন করেছেন। ডেলিভারির তথ্য পূরণ করুন।" : "অর্ডার করতে আগে Firebase Authentication-এ লগইন করুন।");
});
$("quantity").addEventListener("input", updateTotal);
$("order-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentUser) { say("অর্ডারের আগে লগইন করুন। আপনার সাইটের লগইন পেজ থেকে লগইন করে আবার এই পেজ খুলুন।"); return; }
  if (!productsLoaded) { say("পণ্যের তালিকা লোড হওয়া পর্যন্ত অপেক্ষা করুন।"); return; }
  const p = products[selectedProductId];
  if (!p) { say("একটি পণ্য নির্বাচন করুন।"); return; }
  const v = {
    customerName: $("customer-name").value.trim(),
    customerPhone: $("customer-phone").value.trim(),
    country: $("country").value, division: $("division").value,
    district: $("district").value.trim(), upazila: $("upazila").value.trim(),
    postOffice: $("post-office").value.trim(), postalCode: $("postal-code").value.trim(),
    deliveryAddress: $("customer-address").value.trim()
  };
  const q = Number($("quantity").value), price = Number(p.price);
  if (Object.values(v).some(x => !x)) { say("ডেলিভারির সব তথ্য পূরণ করুন।"); return; }
  if (!Number.isInteger(q) || q < 1 || q > 20 || !Number.isFinite(price) || price < 0) { say("পণ্যের পরিমাণ বা দাম সঠিক নয়।"); return; }
  $("submit-order").disabled = true; say("অর্ডার জমা হচ্ছে…");
  const order = { customerUid: currentUser.uid, ...v, productId: selectedProductId,
    productName: String(p.name || ""), unitPrice: price, quantity: q, total: price*q,
    paymentMethod: "COD", status: "pending", createdAt: Date.now() };
  try {
    const orderRef = push(ref(db, `orders/${currentUser.uid}`));
    await set(orderRef, order);
    $("order-form").reset(); $("quantity").value = "1"; updateTotal();
    say("অর্ডার সফলভাবে জমা হয়েছে!\nঅর্ডার নম্বর: " + orderRef.key + "\nপেমেন্ট: Cash on Delivery");
  } catch (err) {
    console.error("Order submit error:", err.code);
    say("অর্ডার জমা হয়নি। লগইন ও Firebase Database Rules পরীক্ষা করুন।");
  } finally { $("submit-order").disabled = false; }
});
