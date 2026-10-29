/* Demo-only admin. This is NOT a secure production admin system. */
const KEY="shopbd_demo_v1";
const starterProducts=[
{id:"p101",name:"কটন ক্যাজুয়াল টি-শার্ট",category:"পোশাক",price:450,seller:"ShopBD Demo",emoji:"👕",description:"আরামদায়ক দৈনন্দিন পোশাক",status:"approved"},
{id:"p102",name:"1vwxJ88hqKhErAIcwwCEBE2H3p63 ইয়ারবাড",category:"ইলেকট্রনিক্স",price:1250,seller:"ShopBD Demo",emoji:"🎧",description:"দৈনন্দিন ব্যবহারের ইয়ারবাড",status:"approved"},
{id:"p103",name:"কিচেন স্টোরেজ সেট",category:"ঘর ও রান্নাঘর",price:680,seller:"ShopBD Demo",emoji:"🍱",description:"রান্নাঘর গুছিয়ে রাখুন",status:"approved"},
{id:"p104",name:"স্কিন কেয়ার সেট",category:"সৌন্দর্য",price:890,seller:"ShopBD Demo",emoji:"🧴",description:"নিজের যত্নের জন্য",status:"approved"},
{id:"p105",name:"দৈনন্দিন ব্যাকপ্যাক",category:"অন্যান্য",price:990,seller:"ShopBD Demo",emoji:"🎒",description:"কাজ বা ভ্রমণে ব্যবহারযোগ্য",status:"approved"},
{id:"p106",name:"স্মার্টফোন স্ট্যান্ড",category:"ইলেকট্রনিক্স",price:320,seller:"ShopBD Demo",emoji:"📱",description:"ডেস্কে ফোন রাখার স্ট্যান্ড",status:"approved"}];
function load(){try{let x=JSON.parse(localStorage.getItem(KEY));if(x&&Array.isArray(x.products))return x;}catch(e){}return {products:starterProducts,sellers:[],orders:[]};}
let data=load();
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>"৳"+Number(n||0).toLocaleString("en-BD");
function save(){localStorage.setItem(KEY,JSON.stringify(data));render();}
function card(container,title,details,actions=[]){
 const el=document.createElement("article");el.className="record";
 const h=document.createElement("h3");h.textContent=title;
 const p=document.createElement("p");p.textContent=details;
 el.append(h,p);
 actions.forEach(a=>{const b=document.createElement("button");b.textContent=a.label;if(a.danger)b.className="danger";b.onclick=()=>{a.run();save();};el.appendChild(b);});
 container.appendChild(el);
}
function render(){
 $("sellerCount").textContent=data.sellers.filter(x=>x.status==="pending").length;
 $("productCount").textContent=data.products.filter(x=>x.status==="pending").length;
 $("orderCount").textContent=data.orders.length;
 $("salesTotal").textContent=money(data.orders.filter(x=>x.status==="delivered").reduce((s,o)=>s+Number(o.price||0),0));
 $("commissionTotal").textContent=money(data.orders.filter(x=>x.status==="delivered").reduce((s,o)=>s+Number(o.commission||0),0));
 const sellers=$("sellerList");sellers.replaceChildren();
 const pending=data.sellers.filter(x=>x.status==="pending");
 if(!pending.length)sellers.textContent="নতুন আবেদন নেই।";
 pending.forEach(s=>card(sellers,s.shop,`${s.name} · ${s.contact}`,[
  {label:"অনুমোদন",run:()=>s.status="approved"},
  {label:"বাতিল",danger:true,run:()=>s.status="rejected"}
 ]));
 const products=$("productList");products.replaceChildren();
 const pends=data.products.filter(x=>x.status==="pending");
 if(!pends.length)products.textContent="Pending পণ্য নেই।";
 pends.forEach(p=>card(products,p.name,`${p.category} · ${money(p.price)} · ${p.seller}`,[
  {label:"প্রকাশ করুন",run:()=>p.status="approved"},
  {label:"বাতিল",danger:true,run:()=>p.status="rejected"}
 ]));
 const orders=$("orderList");orders.replaceChildren();
 if(!data.orders.length)orders.textContent="এখনো অর্ডার নেই।";
 data.orders.forEach(o=>card(orders,`${o.productName} · ${money(o.price)}`,`অর্ডার ${o.id} · ${o.customer} · ${o.phone} · ${o.address} · ${o.payment} · অবস্থা: ${o.status}`,[
  {label:"নিশ্চিত",run:()=>o.status="confirmed"},
  {label:"পাঠানো হয়েছে",run:()=>o.status="shipped"},
  {label:"সম্পন্ন",run:()=>o.status="delivered"},
  {label:"বাতিল",danger:true,run:()=>o.status="cancelled"}
 ]));
}
$("productForm").addEventListener("submit",e=>{
 e.preventDefault();const f=new FormData(e.currentTarget);
 data.products.unshift({id:"p"+Date.now(),name:f.get("name").trim(),category:f.get("category"),price:Number(f.get("price")),seller:f.get("seller").trim(),image:f.get("image").trim(),description:f.get("description").trim(),emoji:"🛍️",status:"pending"});
 e.currentTarget.reset();$("productMessage").textContent="ডেমো পণ্য যোগ হয়েছে। অনুমোদনের অপেক্ষায়।";save();
});
$("resetDemo").onclick=()=>{
 if(!confirm("এই ব্রাউজারের ShopBD ডেমো ডেটা মুছে ডেমো রিসেট করবেন?"))return;
 localStorage.removeItem(KEY);data=load();render();
};
render();
