 
/* ShopBD Daraz Affiliate */

const products = [
  {
    id: "mobile001",
    name: "মোবাইল ফোন",
    category: "ইলেকট্রনিক্স",
    description: "Daraz-এ পণ্যটি দেখুন ও কিনুন",
    emoji: "📱",
    link: "https://s.daraz.com.bd/s.YeFyI?cc"
  }
];

let activeCategory = "সব";

function renderProducts() {
  const grid = document.querySelector("#productGrid");
  const empty = document.querySelector("#emptyProducts");
  const search = document.querySelector("#search");

  if (!grid) return;

  const q = (search?.value || "").trim().toLowerCase();

  const items = products.filter(p =>
    (activeCategory === "সব" || p.category === activeCategory) &&
    (p.name + " " + p.category).toLowerCase().includes(q)
  );

  grid.innerHTML = items.map(p => `
    <article class="product-card">
      <div class="product-image">${p.emoji}</div>
      <span class="product-category">${p.category}</span>
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <a class="button"
         href="${p.link}"
         target="_blank"
         rel="sponsored noopener noreferrer">
        Daraz-এ কিনুন
      </a>
    </article>
  `).join("");

  if (empty) {
    empty.hidden = items.length > 0;
    if (!items.length) {
      empty.textContent =
        "এই ক্যাটাগরিতে এখনো পণ্য যোগ করা হয়নি।";
    }
  }
}

document.querySelectorAll("[data-category]").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category || "সব";

    document.querySelectorAll("[data-category]").forEach(b => {
      b.classList.toggle("active", b === button);
    });

    renderProducts();
  });
});

document.querySelector("#search")?.addEventListener("input", renderProducts);

document.querySelector("#sellerForm")?.addEventListener("submit", e => {
  e.preventDefault();
  e.currentTarget.reset();

  const message = document.querySelector("#sellerMessage");
  if (message) message.textContent =
    "বিক্রেতার আবেদন ফিচারটি এখনো চালু করা হয়নি।";
});

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

renderProducts();
