const fs = require("fs");
const f = "src/content/posts/ugc_liyueqiannian/index.md";
let c = fs.readFileSync(f, "utf-8");

const oldPromo = `## 📸 宣传展示

<div class="flex flex-wrap gap-4 my-6 justify-center">
  <a href="./promotion1.png" data-fancybox="promo" data-caption="宣传图1">
    <img src="./promotion1.png" alt="宣传图1" class="h-48 w-auto object-cover rounded-lg shadow-md hover:scale-105 transition-transform" />
  </a>
  <a href="./promotion2.jpg" data-fancybox="promo" data-caption="宣传图2">
    <img src="./promotion2.jpg" alt="宣传图2" class="h-48 w-auto object-cover rounded-lg shadow-md hover:scale-105 transition-transform" />
  </a>
  <a href="./promotion3.jpg" data-fancybox="promo" data-caption="宣传图3">
    <img src="./promotion3.jpg" alt="宣传图3" class="h-48 w-auto object-cover rounded-lg shadow-md hover:scale-105 transition-transform" />
  </a>
  <a href="./promotion4.png" data-fancybox="promo" data-caption="宣传图4">
    <img src="./promotion4.png" alt="宣传图4" class="h-48 w-auto object-cover rounded-lg shadow-md hover:scale-105 transition-transform" />
  </a>
</div>

> 💡 点击任意图片可全屏浏览，左右滑动切换`;

const newPromo = `## 📸 宣传展示

<div style="position:relative;max-width:800px;margin:0 auto 1rem;">
  <div class="promo-scroll" style="display:flex;overflow:hidden;scroll-behavior:smooth;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.15);">
    <a href="/assets/images/Blogs/ugc_liyueqiannian/promotion1.png" data-fancybox="promo" data-caption="宣传图1" style="min-width:100%;scroll-snap-align:start;">
      <img src="/assets/images/Blogs/ugc_liyueqiannian/promotion1.png" alt="宣传图1" style="width:100%;display:block;" />
    </a>
    <a href="/assets/images/Blogs/ugc_liyueqiannian/promotion2.jpg" data-fancybox="promo" data-caption="宣传图2" style="min-width:100%;scroll-snap-align:start;">
      <img src="/assets/images/Blogs/ugc_liyueqiannian/promotion2.jpg" alt="宣传图2" style="width:100%;display:block;" />
    </a>
    <a href="/assets/images/Blogs/ugc_liyueqiannian/promotion3.jpg" data-fancybox="promo" data-caption="宣传图3" style="min-width:100%;scroll-snap-align:start;">
      <img src="/assets/images/Blogs/ugc_liyueqiannian/promotion3.jpg" alt="宣传图3" style="width:100%;display:block;" />
    </a>
    <a href="/assets/images/Blogs/ugc_liyueqiannian/promotion4.png" data-fancybox="promo" data-caption="宣传图4" style="min-width:100%;scroll-snap-align:start;">
      <img src="/assets/images/Blogs/ugc_liyueqiannian/promotion4.png" alt="宣传图4" style="width:100%;display:block;" />
    </a>
  </div>
  <button onclick="this.parentElement.querySelector('.promo-scroll').scrollLeft -= this.parentElement.querySelector('.promo-scroll').offsetWidth" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:40px;height:40px;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">‹</button>
  <button onclick="this.parentElement.querySelector('.promo-scroll').scrollLeft += this.parentElement.querySelector('.promo-scroll').offsetWidth" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:40px;height:40px;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">›</button>
</div>

> 💡 点击图片可全屏浏览，左右箭头切换`;

c = c.replace(oldPromo, newPromo);

// Also fix the heat section similarly
const oldHeat = `## 📊 热度数据

<div class="flex flex-wrap gap-4 my-6 justify-center">
  <a href="./heat.png" data-fancybox="heat" data-caption="30天最高热度">
    <img src="./heat.png" alt="30天最高热度" class="h-64 w-auto object-cover rounded-lg shadow-md hover:scale-105 transition-transform" />
  </a>
  <a href="./ranking.png" data-fancybox="heat" data-caption="热度排行">
    <img src="./ranking.png" alt="热度排行" class="h-64 w-auto object-cover rounded-lg shadow-md hover:scale-105 transition-transform" />
  </a>
</div>

> 💡 点击图片全屏查看`;

const newHeat = `## 📊 热度数据

<div style="position:relative;max-width:800px;margin:0 auto 1rem;">
  <div class="heat-scroll" style="display:flex;overflow:hidden;scroll-behavior:smooth;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.15);">
    <a href="/assets/images/Blogs/ugc_liyueqiannian/heat.png" data-fancybox="heat" data-caption="30天最高热度" style="min-width:100%;scroll-snap-align:start;">
      <img src="/assets/images/Blogs/ugc_liyueqiannian/heat.png" alt="30天最高热度" style="width:100%;display:block;" />
    </a>
    <a href="/assets/images/Blogs/ugc_liyueqiannian/ranking.png" data-fancybox="heat" data-caption="热度排行" style="min-width:100%;scroll-snap-align:start;">
      <img src="/assets/images/Blogs/ugc_liyueqiannian/ranking.png" alt="热度排行" style="width:100%;display:block;" />
    </a>
  </div>
  <button onclick="this.parentElement.querySelector('.heat-scroll').scrollLeft -= this.parentElement.querySelector('.heat-scroll').offsetWidth" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:40px;height:40px;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">‹</button>
  <button onclick="this.parentElement.querySelector('.heat-scroll').scrollLeft += this.parentElement.querySelector('.heat-scroll').offsetWidth" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:40px;height:40px;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">›</button>
</div>

> 💡 点击图片全屏查看`;

c = c.replace(oldHeat, newHeat);

fs.writeFileSync(f, c, "utf-8");
console.log("✅ Carousels updated");