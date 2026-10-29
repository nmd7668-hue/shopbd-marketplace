/* ShopBD frontend demo.
   Data is stored only in this browser. Do not use for real orders/payments. */
const STORE_KEY = "shopbd_demo_v1";
const starterProducts = [
  {id:"p101",name:"কটন ক্যাজুয়াল টি-শার্ট",category:"পোশাক",price:450,seller:"ShopBD Demo",emoji:"👕",description:"আরামদায়ক দৈনন্দিন পোশাক",status:"approved"},
  {id:"p102",name:"ওয়্যারলেস ইয়ারবাড",category:"ইলেকট্রনিক্স",price:1250,seller:"ShopBD Demo",emoji:"🎧",description:"দৈনন্দিন ব্যবহারের ইয়ারবাড",status:"approved"},
  {id:"p103",name:"কিচেন স্টোরেজ সেট",category:"ঘর ও রান্নাঘর",price:680,seller:"ShopBD Demo",emoji:"🍱",description:"রান্নাঘর গুছিয়ে রাখুন",status:"approved"},
  {id:"p104",name:"স্কিন কেয়ার সেট",category:"সৌন্দর্য",price:890,seller:"ShopBD Demo",emoji:"🧴",description:"নিজের যত্নের জন্য",status:"approved"},
  {id:"p105",name:"দৈনন্দিন ব্যাকপ্যাক",category:"অন্যান্য",price:990,seller:"ShopBD Demo",emoji:"🎒",description:"কাজ বা ভ্রমণে ব্যবহারযোগ্য",status:"approved"},
  {id:"p106",name:"স্মার্টফোন স্ট্যান্ড",category:"ইলেকট্রনিক্স",price:320,seller:"ShopBD Demo",emoji:"📱",description:"ডেস্কে ফোন রাখার স্ট্যান্ড",status:"approved"}
];
function readData(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if(saved && Array.isArray(saved.products)) return saved;
  } catch(e){}
  return {products:starterProducts,sellers:[],orders:[]};
}
let data=readData(), activeCategory="সব", selectedProduct=null;
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(data));}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function money(n){return "৳"+Number(n||0).toLocaleString("en-BD");}
function renderProducts(){
  const q=document.querySelector("#search").value.trim().toLowerCase();
  const items=data.products.filter(p=>p.status==="approved"&&(activeCategory==="সব"||p.category===activeCategory)&&(`${p.name} ${p.category} ${p.description||""}`).toLowerCase().includes(q));
  const grid=document.querySelector("#productGrid");
  grid.innerHTML=items.map(p=>`<article class="product-card">
    <div class="product-image">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`:esc(p.emoji||"🛍️")}</div>
    <span class="product-category">${esc(p.category)}</span>
    <h3>${esc(p.name)}</h3>
    <div class="product-price">${money(p.price)}</div>
    <div class="product-seller">বিক্রেতা: ${esc(p.seller||"ShopBD Seller")}</div>
    <button class="button" data-buy="${esc(p.id)}">COD অর্ডার</button>
  </article>`).join("");
  document.querySelector("#emptyProducts").hidden=items.length>0;
  grid.querySelectorAll("[data-buy]").forEach(b=>b.addEventListener("click",()=>openOrder(b.dataset.buy)));
}
document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{
  activeCategory=b.dataset.category;
  document.querySelectorAll("[data-category]").forEach(x=>x.classList.toggle("active",x===b));
  renderProducts();
}));
document.querySelector("#search").addEventListener("input",renderProducts);
document.querySelector("#sellerForm").addEventListener("submit",e=>{
  e.preventDefault();const f=new FormData(e.currentTarget);
  data.sellers.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name:f.get("name").trim(),contact:f.get("contact").trim(),shop:f.get("shop").trim(),status:"pending",createdAt:new Date().toISOString()});
  save();e.currentTarget.reset();document.querySelector("#sellerMessage").textContent="আবেদন জমা হয়েছে (ডেমো)। Admin Panel থেকে অনুমোদন দেখুন।";
});
function openOrder(id){
  selectedProduct=data.products.find(p=>p.id===id);if(!selectedProduct)return;
  const modal=document.querySelector("#orderModal");modal.hidden=false;
  document.querySelector("#orderProductName").textContent=`${selectedProduct.name} — ${money(selectedProduct.price)}`;
  document.querySelector('#orderForm [name="productId"]').value=id;
}
function closeOrder(){document.querySelector("#orderModal").hidden=true;}
document.querySelector("#closeModal").addEventListener("click",closeOrder);
document.querySelector("#orderModal").addEventListener("click",e=>{if(e.target.id==="orderModal")closeOrder();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeOrder();});
document.querySelector("#orderForm").addEventListener("submit",e=>{
  e.preventDefault();if(!selectedProduct)return;
  const f=new FormData(e.currentTarget);
  const order={id:"SB"+Date.now().toString().slice(-8),productId:selectedProduct.id,productName:selectedProduct.name,price:selectedProduct.price,customer:f.get("customer").trim(),phone:f.get("phone").trim(),address:f.get("address").trim(),payment:"COD",status:"pending",commissionRate:10,commission:Math.round(selectedProduct.price*0.1),createdAt:new Date().toISOString()};
  data.orders.unshift(order);save();e.currentTarget.reset();
  document.querySelector("#orderMessage").textContent=`ডেমো অর্ডার তৈরি হয়েছে: ${order.id}`;
  setTimeout(closeOrder,1600);
});
document.querySelector("#year").textContent=new Date().getFullYear();
renderProducts();
