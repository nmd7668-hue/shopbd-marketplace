ShopBD Marketplace — Android ব্যবহারকারীর জন্য

ফাইল:
- index.html : ক্রেতার হোম পেজ, পণ্য ও ডেমো COD অর্ডার
- style.css  : মোবাইল-ফ্রেন্ডলি ডিজাইন
- app.js     : ডেমো পণ্য, বিক্রেতার আবেদন ও অর্ডার
- admin.html : ডেমো Admin Panel
- admin.js   : ডেমো Admin কার্যক্রম

চালানোর নিয়ম:
1. ZIP Extract করুন।
2. সব ফাইল একই ফোল্ডারে রাখুন।
3. index.html খুলে প্রিভিউ করুন, অথবা GitHub repository-তে ফাইল আপলোড করুন।
4. GitHub Pages চালু করলে index.html সাইটের হোম পেজ হবে।
5. Admin পেজ: আপনার-সাইটের-ঠিকানা/admin.html

গুরুত্বপূর্ণ সীমাবদ্ধতা:
এই প্যাকেজটি একটি কার্যকর UI ডেমো। ডেটা browser localStorage-এ থাকে, তাই আলাদা ফোন/ব্রাউজারে শেয়ার হয় না। Admin পেজে ডেমো লগইন নেই এবং এটি নিরাপদ বাস্তব Admin Panel নয়। বাস্তব ব্যবহারের আগে Firebase Authentication, Firestore, Security Rules, server-side price/commission validation, stock locking, privacy/return policies, এবং নিরাপদ order workflow সংযোগ করতে হবে। এই ডেমো দিয়ে প্রকৃত পেমেন্ট বা টাকা আদায় করবেন না।
