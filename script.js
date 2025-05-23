let map;
let directionsService;
let placesService;
let geocoder;
let currentModeRoutes = [];
const googleApiKey = "AIzaSyCsGmR_ZBquX6_QH5k58LbN-kulY0EJ7Gg";
const weatherKey = "cf17be40031abe6fd4ef463643ddcf4f";
const routePolylines = [];
let selectedRow = null;
const eduVideos = [
  {
    videoId: "QLX8pdnLON4", // YouTube 影片 ID
    description_zh: "搭乘捷運減少碳排放，讓城市更綠色！",
    description_en: "Taking the subway reduces carbon emissions and makes cities greener!"
  },
  {
    videoId: "z6TZSDDGk0s",
    description_zh: "騎腳踏車既健康又環保，低碳出行好選擇。",
    description_en: "Cycling is healthy and eco-friendly, a great low-carbon choice."
  },
  {
    videoId: "NmxLznaFOHg",
    description_zh: "電動車普及推動減碳，未來交通新趨勢。",
    description_en: "The rise of electric vehicles drives carbon reduction, a new trend in transportation."
  }
];

// 🌍 多語資料
const i18n = {
  zh: {
    title: "🌍 SkyAI - 智慧永續交通推薦系統",
    summary: (mode, g) => `最低碳排：${g.toFixed(1)} 克 CO₂（${mode}）`,
    co2Tip: g => `🌳 相當於 ${(g / 60).toFixed(2)} 棵樹一天吸收 CO₂`,
    ecoTips: [
      "每天多走路 1 公里，每週可減少 1 公斤碳排",
      "一棵樹一天可吸收約 60 克 CO₂",
      "搭捷運比開車少 80% 碳排",
      "SkyRail 可省電又省碳，適合城市移動"
    ],
    rain: "🌧️ 未來 3 小時可能降雨，建議攜帶雨具或搭 SkyRail",
    clear: "🌤️ 天氣良好，適合通勤、步行或腳踏車",
    loading: "⌛ 查詢天氣與位置中...",
    error: "⚠️ 無法取得天氣資料，請稍後再試。",
    geoError: "⚠️ 無法解析地點為經緯度，請確認輸入是否正確。",
    iconMap: {
      DRIVING: "🚗 開車", TRANSIT: "🚇 捷運", BICYCLING: "🚴 腳踏車",
      MOTORCYCLE: "🏍️ 機車", SKYRAIL: "🚝 SkyRail"
    }
  },
  en: {
    title: "🌍 SkyAI - Sustainable Smart Mobility Planner",
    summary: (mode, g) => `Lowest emission: ${g.toFixed(1)} g CO₂ (${mode})`,
    co2Tip: g => `🌳 Equivalent to ${ (g / 60).toFixed(2) } tree(s) absorbing CO₂/day`,
    ecoTips: [
      "Walking 1 km daily saves ~1 kg CO₂ weekly",
      "A tree absorbs ~60 g CO₂ daily",
      "Subway emits 80% less CO₂ than driving",
      "SkyRail is efficient and eco-friendly"
    ],
    rain: "🌧️ Rain expected, consider SkyRail or umbrella",
    clear: "🌤️ Great weather for biking or walking",
    loading: "⌛ Checking weather...",
    error: "⚠️ Weather unavailable. Try again later.",
    geoError: "⚠️ Address not recognized. Check your input.",
    iconMap: {
      DRIVING: "🚗 Car", TRANSIT: "🚇 Subway", BICYCLING: "🚴 Bike",
      MOTORCYCLE: "🏍️ Scooter", SKYRAIL: "🚝 SkyRail"
    }
  }
};

// 🌐 套用語言
function applyLang() {
  const lang = document.getElementById("langSelect")?.value || "zh";
  const T = i18n[lang];
  document.getElementById("mainTitle").innerText = T.title;
  document.getElementById("ecoTips").innerText = "🌱 " + T.ecoTips[Math.floor(Math.random() * T.ecoTips.length)];
  // 🔄 更新表頭
  document.querySelector("th:nth-child(1)").innerText = lang === "zh" ? "交通方式" : "Mode";
  document.querySelector("th:nth-child(2)").innerText = lang === "zh" ? "時間" : "Time";
  document.querySelector("th:nth-child(3)").innerText = lang === "zh" ? "時速" : "Speed";
  document.querySelector("th:nth-child(4)").innerText = lang === "zh" ? "距離" : "Distance";
  document.querySelector("th:nth-child(5)").innerText = lang === "zh" ? "碳排量" : "CO₂";

  // 🔄 更新按鈕
  document.getElementById("searchBtn").innerText = lang === "zh" ? "規劃路線" : "Plan Route";

  // 🔄 更新其他靜態標題（例如 <h3>）
  document.getElementById("resultTitle").innerText = lang === "zh" ? "建議結果" : "Suggestions";
  reloadGoogleMapWithLang();
}

document.getElementById("langSelect").addEventListener("change", applyLang);

window.onload = () => {
      // 先顯示第一支
  cycleEduVideos();
  // 每 15 秒換一支影片
  setInterval(cycleEduVideos, 15000);
  loadGoogleMapScript();
  document.getElementById("searchBtn").addEventListener("click", () => {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    if (!start || !end) {
      alert("請輸入起點與終點");
      return;
    }
    planGoogleRoutes(start, end);
    checkWeatherByGeocode(end);
  });
  document.getElementById("map").innerHTML = "";
  document.getElementById("resultTable").innerHTML = "";
  document.getElementById("weatherTip").innerText = T.loading;
  document.getElementById("summary").innerText = "";
  document.getElementById("co2Tip").innerText = "";
  document.querySelector("th:nth-child(1)").innerText = lang === "zh" ? "交通方式" : "Mode";
  document.querySelector("th:nth-child(2)").innerText = lang === "zh" ? "時間" : "Time";
  document.querySelector("th:nth-child(3)").innerText = lang === "zh" ? "時速" : "Speed";
  document.querySelector("th:nth-child(4)").innerText = lang === "zh" ? "距離" : "Distance";
  document.querySelector("th:nth-child(5)").innerText = lang === "zh" ? "碳排量" : "CO₂";
  document.querySelector("th:nth-child(6)").innerText = lang === "zh" ? "建議" : "Suggestion";
  document.getElementById("mainTitle").innerText = T.title;
  document.getElementById("ecoTips").innerText = "🌱 " + T.ecoTips[Math.floor(Math.random() * T.ecoTips.length)];
  document.getElementById("searchBtn").innerText = lang === "zh" ? "規劃路線" : "Plan Route";
  document.querySelector("h3").innerText = lang === "zh" ? "建議結果" : "Suggestions";
  const oldScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  if (oldScript) oldScript.remove();
  loadGoogleMapScript();
  if (currentModeRoutes.length > 0) {
  showResults(currentModeRoutes);
}
  loadGoogleMapScript();
  const end = document.getElementById("end").value;
  if (end) {
    checkWeatherByGeocode(end);
  } else {
    document.getElementById("weatherTip").innerText = T.loading;
  }
  applyLang();
};

function loadGoogleMapScript() {
  const lang = document.getElementById("langSelect")?.value || "zh";
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places,geometry&callback=initMap&language=${lang === "zh" ? "zh-TW" : "en"}`;
  script.async = true;
  document.head.appendChild(script);
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 25.033964, lng: 121.564468 },
    zoom: 11,
  });
  directionsService = new google.maps.DirectionsService();
  placesService = new google.maps.places.PlacesService(map);
  geocoder = new google.maps.Geocoder();

  new google.maps.places.Autocomplete(document.getElementById("start"), {
    types: ["establishment"], componentRestrictions: { country: "tw" }
  });
  new google.maps.places.Autocomplete(document.getElementById("end"), {
    types: ["establishment"], componentRestrictions: { country: "tw" }
  });
}

function planGoogleRoutes(start, end) {
  const lang = document.getElementById("langSelect")?.value || "zh";
  const modes = ["DRIVING", "BICYCLING"];
  currentModeRoutes = [];

  Promise.all(modes.map(mode => getGoogleRoute(mode, start, end)))
    .then(results => {
      const baseRoutes = results.filter(Boolean);
      const sampleDist = baseRoutes[0]?.distance || 0;

      getTransitRouteSubway(start, end).then(transitRoute => {
        if (transitRoute) baseRoutes.push(transitRoute);

        Promise.all([geocodeAddress(start), geocodeAddress(end)]).then(([startLoc, endLoc]) => {
          if (startLoc && endLoc) {
            const distance2 = google.maps.geometry.spherical.computeDistanceBetween(startLoc, endLoc) / 1000;
            const skyrailLine = new google.maps.Polyline({
              path: [startLoc, endLoc],
              strokeColor: "#00cc99", strokeOpacity: 0.8, strokeWeight: 5, map: map
            });
            routePolylines.push(skyrailLine);
            baseRoutes.push({
              mode: "SKYRAIL", speed: 50, distance: distance2,
              time: `${Math.round((distance2 / 50) * 60)} `,
              co2: 10 * distance2,
              tip: "使用 SkyRail 最低碳排",
              color: "#00cc99",
              polyline: google.maps.geometry.encoding.encodePath([startLoc, endLoc])
            });
          }

          baseRoutes.push({
            mode: "MOTORCYCLE",
            speed: 60, distance: sampleDist,
            time: `${Math.round((sampleDist / 60) * 60)} `,
            co2: 90 * sampleDist,
            tip:"",
            color: "#ff6666",
            polyline: currentModeRoutes.find(r => r.mode === "DRIVING")?.polyline || null
          });

          showResults(baseRoutes);
        });
      });
    });
}

function getGoogleRoute(mode, origin, destination) {
  const lang = document.getElementById("langSelect")?.value || "zh"; // ✅ 新增這行
  return new Promise(resolve => {
    directionsService.route({
      origin, destination,
      travelMode: google.maps.TravelMode[mode]
    }, (result, status) => {
      if (status === "OK") {
        const leg = result.routes[0].legs[0];
        const dist = leg.distance.value / 1000;
        const color = mode === "DRIVING" ? "#ff9900" : "#66cc66";
        const speed = mode === "DRIVING" ? 70 : 20;
        const time = `${Math.round((dist / speed) * 60)} `;
        const co2 = mode === "DRIVING" ? 150 * dist : 10 * dist;

        currentModeRoutes.push({ mode, polyline: result.routes[0].overview_polyline, color });

        resolve({
          mode,
          distance: dist,
          speed,
          time,
          co2,
          tip:"",
          color,
          polyline: result.routes[0].overview_polyline
        });
      } else resolve(null);
    });
  });
}

function getTransitRouteSubway(origin, destination) {
  return new Promise(resolve => {
    directionsService.route({
      origin, destination,
      travelMode: "TRANSIT",
      transitOptions: { modes: ["SUBWAY"] }
    }, (result, status) => {
      if (status === "OK") {
        const leg = result.routes[0].legs[0];
        const dist = leg.distance.value / 1000;
        const speed = 40;
        const time = `${Math.round((dist / speed) * 60)} `;
        currentModeRoutes.push({ mode: "TRANSIT", polyline: result.routes[0].overview_polyline, color: "#3366cc" });
        resolve({
          mode: "TRANSIT",
          distance: dist,
          speed,
          time,
          co2: 40 * dist,
          tip: "適合通勤與雨天",
          color: "#3366cc",
          polyline: result.routes[0].overview_polyline
        });
      } else resolve(null);
    });
  });
}

function geocodeAddress(address) {
  return new Promise(resolve => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results[0]) {
        resolve(results[0].geometry.location);
      } else {
        resolve(null);
      }
    });
  });
}

function showResults(routes) {
  console.log("showResults routes:", routes);
  const table = document.getElementById("resultTable");
  table.innerHTML = "";
  clearPolylines();

  const lang = document.getElementById("langSelect")?.value || "zh";
  const T = i18n[lang];
  const iconMap = T.iconMap;

  let minCo2 = Math.min(...routes.map(r => r.co2));
  let minTime = Math.min(...routes.map(r => parseInt(r.time)));

  routes.forEach(route => {
    let tip = "";
    const isLowest = route.co2 === minCo2;
    const isFastest = parseInt(route.time) === minTime;

  switch (route.mode) {
    case "SKYRAIL":
      tip = T.ecoTips[3]; break;
    case "BICYCLING":
      tip = T.ecoTips[0]; break;
    case "TRANSIT":
      tip = T.ecoTips[2]; break;
    case "DRIVING":
      tip = T.ecoTips[1]; break;
    case "MOTORCYCLE":
      tip = T.ecoTips[3]; break;
    default:
      tip = route.tip || "";
}

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${iconMap[route.mode]}</td>
      <td>${route.time}${lang === "zh" ? " 分鐘" : " min"}</td>
      <td>${route.speed ?? "-"} km/h</td>
      <td>${route.distance.toFixed(2)} km</td>
      <td>${route.co2.toFixed(1)} g</td>
    `;
    tr.addEventListener("click", () => {
      if (selectedRow) selectedRow.classList.remove("selected");
      tr.classList.add("selected");
      selectedRow = tr;
      drawPolyline(route);
    });
    table.appendChild(tr);
  });

  const lowestRoute = routes.find(r => r.co2 === minCo2);
  document.getElementById("summary").innerText = T.summary(iconMap[lowestRoute.mode], minCo2);
  document.getElementById("co2Tip").innerText = T.co2Tip(minCo2);
  
  const transit = routes.find(r => r.mode === "TRANSIT");
  const driving = routes.find(r => r.mode === "DRIVING");

  const tips = [];

if (driving) {
  const bike = routes.find(r => r.mode === "BICYCLING");
  const skyrail = routes.find(r => r.mode === "SKYRAIL");
  if (bike) {
    const r = Math.round((1 - bike.co2 / driving.co2) * 100);
    tips.push(lang === "zh"
      ? `🚴 腳踏車比開車少 ${r}% 碳排`
      : `🚴 Bike emits ${r}% less CO₂ than car`);
  }
  if (skyrail) {
    const r = Math.round((1 - skyrail.co2 / driving.co2) * 100);
    tips.push(lang === "zh"
      ? `🚝 SkyRail 比開車少 ${r}% 碳排`
      : `🚝 SkyRail emits ${r}% less CO₂ than car`);
  }
}

const motorcycle = routes.find(r => r.mode === "MOTORCYCLE");
if (motorcycle && transit) {
  const r = Math.round((1 - transit.co2 / motorcycle.co2) * 100);
  tips.push(lang === "zh"
    ? `🚇 捷運比機車少 ${r}% 碳排`
    : `🚇 Subway emits ${r}% less CO₂ than scooter`);
}

if (tips.length > 0) {
  document.getElementById("extraTip").innerHTML = tips.map(t => `<b style="color:red;">${t}</b>`).join("<br>");
} else {
  document.getElementById("extraTip").innerHTML = "";
}

drawCO2Chart(routes);

}

function drawPolyline(route) {
  clearPolylines();
  if (!route.polyline) return;
  if (route.mode === "TRANSIT") return;
  const decoded = google.maps.geometry.encoding.decodePath(route.polyline);
  const polyline = new google.maps.Polyline({
    path: decoded,
    strokeColor: route.color || "#000",
    strokeOpacity: 0.8,
    strokeWeight: 5,
    map: map
  });
  routePolylines.push(polyline);
}

function clearPolylines() {
  routePolylines.forEach(p => p.setMap(null));
  routePolylines.length = 0;
}

function checkWeatherByGeocode(address) {
  const lang = document.getElementById("langSelect")?.value || "zh";
  const T = i18n[lang];
  const weatherTip = document.getElementById("weatherTip");
  weatherTip.innerHTML = T.loading;

  geocoder.geocode({ address }, (results, status) => {
    if (status === "OK" && results[0]) {
      const loc = results[0].geometry.location;
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat()}&lon=${loc.lng()}&appid=${weatherKey}&lang=${lang === "zh" ? "zh_tw" : "en"}`)
        .then(res => res.json())
        .then(data => {
          const main = data.weather[0].main.toLowerCase();
          weatherTip.innerHTML = main.includes("rain") || main.includes("thunder") ? T.rain : T.clear;
        })
        .catch(() => weatherTip.innerHTML = T.error);
    } else {
      weatherTip.innerHTML = T.geoError;
    }
  });
}
function reloadGoogleMapWithLang() {
  const lang = document.getElementById("langSelect").value;
  const oldScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  if (oldScript) oldScript.remove();

  const newScript = document.createElement("script");
  newScript.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places,geometry&callback=initMap&language=${lang === "zh" ? "zh-TW" : "en"}`;
  newScript.async = true;
  document.head.appendChild(newScript);
}

function showEduVideo(index) {
  const lang = document.getElementById("langSelect")?.value || "zh";
  const eduContent = document.getElementById("eduContent");
  const video = eduVideos[index];
  
  eduContent.innerHTML = `
    <iframe width="100%" height="250" 
      src="https://www.youtube.com/embed/${video.videoId}" 
      title="YouTube video player" frameborder="0" allowfullscreen></iframe>
    <p style="margin-top: 0.5rem; font-size: 1rem;">
      ${lang === "zh" ? video.description_zh : video.description_en}
    </p>
  `;
}

let currentEduIndex = 0;
function cycleEduVideos() {
  showEduVideo(currentEduIndex);
  currentEduIndex = (currentEduIndex + 1) % eduVideos.length;
}


// 切換語言時同時更新小教室文字說明
document.getElementById("langSelect").addEventListener("change", () => {
  // 重新顯示目前影片的文字說明（影片ID不變）
  const indexToShow = (currentEduIndex === 0) ? eduVideos.length - 1 : currentEduIndex - 1;
  showEduVideo(indexToShow);
});

let co2ChartInstance = null; // 紀錄 Chart 實例方便後續更新

function drawCO2Chart(routes) {
  const ctx = document.getElementById("co2Chart").getContext("2d");
  
  // 準備標籤與數據
  const labels = routes.map(r => r.mode);
  const data = routes.map(r => Number(r.co2.toFixed(1)));

  // 如果已有圖表，先銷毀
  if (co2ChartInstance) {
    co2ChartInstance.destroy();
  }

  co2ChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '碳排放量 (克 CO₂)',
        data,
        backgroundColor: [
          '#ff9900', '#66cc66', '#3366cc', '#ff6666', '#00cc99'
        ],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '克 CO₂'
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

