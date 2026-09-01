let products = [];
const regionColors = {"British Columbia": "#2d6a4f", "Alberta": "#bc4749", "Saskatchewan": "#f4a261", "Manitoba": "#e76f51", "Ontario": "#1d3557", "Quebec": "#457b9d", "New Brunswick": "#6a4c93", "Nova Scotia": "#1982c4", "Prince Edward Island": "#8ac926", "Newfoundland & Labrador": "#ff595e", "Yukon": "#ffca3a", "Northwest Territories": "#6a4c93", "Nunavut": "#9b5de5", "National": "#b91c1c"};
const allRegions = ["British Columbia", "Alberta", "Saskatchewan", "Manitoba", "Ontario", "Quebec", "New Brunswick", "Nova Scotia", "Prince Edward Island", "Newfoundland & Labrador", "Yukon", "Northwest Territories", "Nunavut", "National"];
const PAGE_SIZE = 50;

function getScoreClass(s){return s>=75?"score-high":s>=40?"score-mid":"score-low"}

function renderCard(p){
  var rc=regionColors[p.region]||"#6b7280";
  var h="<div class='product-card' onclick='toggleDetail("+p.id+")'>";
  h+="<div class='product-header'><div><div class='product-name'>"+p.name+"</div>";
  h+="<div class='product-meta'><span class='product-category'>"+p.category+"</span><span class='product-region' style='background:"+rc+"'>"+p.region+"</span></div></div>";
  h+="<span class='score-badge "+getScoreClass(p.score)+"'>"+p.score+"/100</span></div>";
  h+="<div class='product-desc'>"+p.description+"</div>";
  if(p.tags&&p.tags.length)h+="<div class='product-tags'>"+p.tags.map(function(t){return"<span class='tag'>"+t+"</span>"}).join("")+"</div>";
  h+="</div><div id='detail-"+p.id+"' style='display:none'></div>";
  return h;
}

function getStoresByRegion(region){
  var national=["Loblaws","Sobeys","Metro","Whole Foods","Farm Boy","Longos"];
  var regional={
    "British Columbia":["Save-On-Foods","Thrifty Foods","IGA","Fairway Markets","Root Cellar"],
    "Alberta":["Calgary Co-op","Safeway","Sobeys","Planet Organic"],
    "Saskatchewan":["Co-op","Sobeys","Safeway","Bulk Barn"],
    "Manitoba":["Co-op","Sobeys","Safeway","Red River Co-op"],
    "Ontario":["Longo's","Farm Boy","Highland Farms","T&T Supermarket","Pusateri's","Galleria"],
    "Quebec":["IGA","Metro","Provigo","Marche Adonis","PA Nature"],
    "New Brunswick":["Sobeys","Atlantic Superstore","Co-op","Giant Tiger"],
    "Nova Scotia":["Sobeys","Atlantic Superstore","Farm Boy","Gateway"],
    "Prince Edward Island":["Sobeys","Superstore","Independent grocers"],
    "Newfoundland & Labrador":["Sobeys","Dominion","Coleman's"],
    "Yukon":["Superstore","Independent grocers","Farmers markets"],
    "Northwest Territories":["Independent grocers","Co-op","Northern stores"],
    "Nunavut":["Northern","Co-op","Local retailers"],
    "National":["Loblaws","Sobeys","Metro","Whole Foods","Farm Boy","Longos","Well.ca"]
  };
  return regional[region]||national;
}

function getWhereToFind(p){
  var result={online:[],stores:[],tips:[]};
  // Official website only
  if(p.website){
    result.online.push({type:"brand",name:"Official Website",url:p.website});
  }
  if(p.whereToBuy){
    result.tips.push(p.whereToBuy);
  }else if(p.region==="National"){
    result.tips.push("Available at major grocery chains and retailers across Canada.");
  }else{
    result.tips.push("Check local grocery stores, specialty shops, and farmers markets in "+p.region+".");
  }
  if(p.category==="Food"||p.category==="Beverages"){
    result.tips.push("Look in the Canadian/local products section at your grocery store.");
  }else if(p.category==="Clothing"){
    result.tips.push("Check the brand's website for store locators or direct online ordering.");
  }
  return result;
}

function toggleDetail(id){
  var el=document.getElementById("detail-"+id);
  if(!el)return;
  if(el.style.display==="block"){el.style.display="none";el.innerHTML="";return;}
  var p=products.find(function(x){return x.id===id});
  if(!p)return;
  var rc=regionColors[p.region]||"#6b7280";
  var info=getWhereToFind(p);

  // Build detail panel using DOM methods for reliability
  var panel=document.createElement("div");
  panel.className="detail-panel";

  // Meta row
  var meta=document.createElement("div");
  meta.style.cssText="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;";
  var regionSpan=document.createElement("span");
  regionSpan.className="product-region";
  regionSpan.style.background=rc;
  regionSpan.textContent=p.region;
  meta.appendChild(regionSpan);
  var catSpan=document.createElement("span");
  catSpan.className="product-category";
  catSpan.textContent=p.category;
  meta.appendChild(catSpan);
  var scoreSpan=document.createElement("span");
  scoreSpan.className="score-badge "+getScoreClass(p.score);
  scoreSpan.textContent=p.score+"/100";
  meta.appendChild(scoreSpan);
  panel.appendChild(meta);

  // Description
  var descP=document.createElement("p");
  descP.style.cssText="font-size:13px;color:#374151;margin-bottom:12px;";
  descP.textContent=p.description;
  panel.appendChild(descP);

  // Tags
  if(p.tags&&p.tags.length){
    var tagsDiv=document.createElement("div");
    tagsDiv.className="product-tags";
    tagsDiv.style.marginBottom="14px";
    p.tags.forEach(function(t){
      var s=document.createElement("span");
      s.className="tag";
      s.textContent=t;
      tagsDiv.appendChild(s);
    });
    panel.appendChild(tagsDiv);
  }

  // Buy Online section
  var buyBox=document.createElement("div");
  buyBox.style.cssText="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin-bottom:14px;";
  var buyTitle=document.createElement("h4");
  buyTitle.style.cssText="font-size:13px;font-weight:600;color:#1d4ed8;margin-bottom:8px;";
  buyTitle.textContent="🛒 Buy Online";
  buyBox.appendChild(buyTitle);
  info.online.forEach(function(link){
    var a=document.createElement("a");
    a.href=link.url;
    a.className="buy-btn"+(link.type==="brand"?" brand":"");
    a.textContent=link.name;
    a.style.marginRight="6px";
    a.style.marginBottom="4px";
    buyBox.appendChild(a);
  });
  panel.appendChild(buyBox);

  // Alternatives
  if(p.alts&&p.alts.length){
    var altTitle=document.createElement("h4");
    altTitle.style.cssText="font-size:13px;font-weight:600;margin-bottom:8px;color:#111827;";
    altTitle.textContent="Canadian Alternatives";
    panel.appendChild(altTitle);
    p.alts.forEach(function(a){
      var item=document.createElement("div");
      item.className="alt-item";
      item.innerHTML="<span class='alt-check'>✓</span><div><div class='alt-name'>"+a.name+"</div><div class='alt-desc'>"+a.desc+"</div></div>";
      panel.appendChild(item);
    });
  }

  // Footer
  var foot=document.createElement("div");
  foot.style.cssText="font-size:11px;color:#9ca3af;margin-top:10px;font-style:italic;border-top:1px solid #e5e7eb;padding-top:8px;";
  foot.textContent="Origin: "+p.origin+" | Listed in ChooseCanuck database";
  panel.appendChild(foot);

  el.innerHTML="";
  el.appendChild(panel);
  el.style.display="block";
}

function switchTab(name){
  document.querySelectorAll(".nav-btn").forEach(function(b){b.classList.remove("active")});
  document.querySelectorAll(".nav-btn").forEach(function(b){if(b.dataset.section===name)b.classList.add("active")});
  document.querySelectorAll(".section").forEach(function(s){s.classList.remove("active")});
  document.getElementById(name+"-section").classList.add("active");
}

function generateSubmission(){
  var name=document.getElementById("subName").value.trim();
  var cat=document.getElementById("subCategory").value;
  var region=document.getElementById("subRegion").value;
  var desc=document.getElementById("subDesc").value.trim();
  var whereToBuy=document.getElementById("subWhere").value.trim();
  var website=document.getElementById("subWebsite").value.trim();
  var tags=document.getElementById("subTags").value.split(",").map(function(t){return t.trim()}).filter(Boolean);
  if(!name||!cat||!region||!desc){alert("Please fill in all required fields.");return;}
  var entry={name:name,category:cat,origin:"Canada",region:region,score:90,description:desc,alts:[],tags:tags};
  if(whereToBuy) entry.whereToBuy=whereToBuy;
  if(website) entry.website=website;
  var subs=JSON.parse(localStorage.getItem("cc_submissions")||"[]");
  entry.submittedAt=new Date().toISOString();
  subs.push(entry);
  localStorage.setItem("cc_submissions",JSON.stringify(subs));
  document.getElementById("submitForm").style.display="none";
  document.getElementById("submitSuccess").style.display="block";
  renderSubmissions();
}

function renderSubmissions(){
  var subs=JSON.parse(localStorage.getItem("cc_submissions")||"[]");
  var el=document.getElementById("submissionsList");
  if(!subs.length){el.innerHTML="";return;}
  var h="<h3 style='font-size:14px;font-weight:600;margin-bottom:10px;'>Your Submissions</h3>";
  subs.slice().reverse().forEach(function(s){
    h+="<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-bottom:8px;'>";
    h+="<div style='font-size:13px;font-weight:600;'>"+s.name+"</div>";
    h+="<div style='font-size:11px;color:#6b7280;'>"+s.region+" · "+s.category+"</div>";
    h+="</div>";
  });
  el.innerHTML=h;
}

function resetSubmitForm(){
  document.getElementById("subName").value="";
  document.getElementById("subCategory").value="";
  document.getElementById("subRegion").value="";
  document.getElementById("subDesc").value="";
  document.getElementById("subWhere").value="";
  document.getElementById("subWebsite").value="";
  document.getElementById("subTags").value="";
  document.getElementById("submitForm").style.display="block";
  document.getElementById("submitSuccess").style.display="none";
}

function renderPaged(containerId,items,page){
  var start=(page-1)*PAGE_SIZE;
  var end=start+PAGE_SIZE;
  var pageItems=items.slice(start,end);
  var h=pageItems.map(renderCard).join("");
  if(items.length>PAGE_SIZE){
    h+="<div style='display:flex;justify-content:center;gap:8px;margin-top:16px;'>";
    if(page>1) h+="<button class='home-cta-btn' onclick='renderPage(\""+containerId+"\","+(page-1)+")'>← Prev</button>";
    h+="<span style='font-size:12px;color:#6b7280;padding:8px 12px;'>Page "+page+" of "+Math.ceil(items.length/PAGE_SIZE)+"</span>";
    if(end<items.length) h+="<button class='home-cta-btn' onclick='renderPage(\""+containerId+"\","+(page+1)+")'>Next →</button>";
    h+="</div>";
  }
  document.getElementById(containerId).innerHTML=h;
  window._pageState=window._pageState||{};
  window._pageState[containerId]={items:items,page:page};
}

function renderPage(containerId,page){
  var state=window._pageState[containerId];
  if(!state)return;
  renderPaged(containerId,state.items,page);
}

function renderHomepage(){
  var canadian=products.filter(function(p){return p.origin==="Canada"||p.score>=75});
  var gaps=products.filter(function(p){return p.score<75&&!p.alts.length});
  var regions=[...new Set(canadian.map(function(p){return p.region}))].sort();
  document.getElementById("homeStats").innerHTML=
    "<div class='stat-box'><div class='stat-number'>"+products.length+"</div><div class='stat-label'>Products</div></div>"+
    "<div class='stat-box'><div class='stat-number'>"+canadian.length+"</div><div class='stat-label'>Canadian-made</div></div>"+
    "<div class='stat-box'><div class='stat-number'>"+regions.length+"</div><div class='stat-label'>Regions</div></div>"+
    "<div class='stat-box'><div class='stat-number'>"+gaps.length+"</div><div class='stat-label'>Gaps</div></div>";

  var featured=[1,3,9,14,16,22,34,56,76,98,112,145,178,201,234,267,301,345,389,412,456,567,601,712,745,789];
  var fp=featured.map(function(id){return products.find(function(p){return p.id===id})}).filter(Boolean).slice(0,8);
  document.getElementById("featuredGrid").innerHTML=fp.map(function(p){
    var rc=regionColors[p.region]||"#6b7280";
    return "<div class='home-card' onclick='showProductDetail("+p.id+")'><div class='home-card-name'>"+p.name+"</div><div class='home-card-meta'><span style='display:inline-block;width:8px;height:8px;border-radius:50%;background:"+rc+";margin-right:4px'></span>"+p.region+" · "+p.category+"</div></div>";
  }).join("");

  var cats=[...new Set(canadian.map(function(p){return p.category}))].sort();
  document.getElementById("homeCats").innerHTML=cats.map(function(c){return"<button class='home-cat-chip' data-cat='"+c+"'>"+c+"</button>"}).join("");
  document.getElementById("homeCats").addEventListener("click",function(e){if(!e.target.classList.contains("home-cat-chip"))return;var cat=e.target.dataset.cat;switchTab('categories');document.querySelectorAll('#categoryChips .cat-chip').forEach(function(b){b.classList.toggle('active',b.dataset.cat===cat)});var filtered=products.filter(function(p){return p.category===cat});renderPaged('categoryResults',filtered,1);});

  document.getElementById("homeRegions").innerHTML=regions.slice(0,14).map(function(r){return"<button class='home-region-chip' data-region='"+r+"' style='background:"+(regionColors[r]||"#6b7280")+"'>"+r+"</button>";}).join("");
  document.getElementById("homeRegions").addEventListener("click",function(e){if(!e.target.classList.contains("home-region-chip"))return;var region=e.target.dataset.region;switchTab('regions');document.querySelectorAll('#regionChips .region-chip').forEach(function(b){b.classList.toggle('active',b.dataset.region===region)});var filtered=products.filter(function(p){return p.region===region&&p.score>=75});renderPaged('regionResults',filtered,1);});
}

function showProductDetail(id){
  toggleDetail(id);
  var el=document.getElementById("detail-"+id);
  if(el)el.scrollIntoView({behavior:"smooth",block:"nearest"});
}

function initApp(){
  // Search
  document.getElementById("searchInput").addEventListener("input",function(e){
    var q=e.target.value.toLowerCase().trim();
    var c=document.getElementById("searchResults");
    if(!q){c.innerHTML="";return;}
    var f=products.filter(function(p){return p.name.toLowerCase().indexOf(q)!==-1||p.description.toLowerCase().indexOf(q)!==-1||(p.tags&&p.tags.some(function(t){return t.toLowerCase().indexOf(q)!==-1}));});
    if(!f.length){c.innerHTML="<div class='empty-state'><p>No products found. Try a different term or use the Submit tab to add it!</p></div>";return;}
    c.innerHTML=f.slice(0,50).map(renderCard).join("");
  });

  // Categories
  var cats=[...new Set(products.map(function(p){return p.category}))];
  var cc=document.getElementById("categoryChips");
  cc.innerHTML="<button class='cat-chip active' data-cat='all'>All</button>"+cats.map(function(c){return"<button class='cat-chip' data-cat='"+c+"'>"+c+"</button>"}).join("");
  cc.addEventListener("click",function(e){if(!e.target.classList.contains("cat-chip"))return;cc.querySelectorAll(".cat-chip").forEach(function(b){b.classList.remove("active")});e.target.classList.add("active");var cat=e.target.dataset.cat;var filtered=cat==="all"?products:products.filter(function(p){return p.category===cat});renderPaged('categoryResults',filtered,1);});
  renderPaged('categoryResults',products,1);

  // Regions
  var rlist=[...new Set(products.filter(function(p){return p.score>=75}).map(function(p){return p.region}))].sort();
  var rc=document.getElementById("regionChips");
  var rl=document.getElementById("regionLegend");
  rl.innerHTML=rlist.map(function(r){return"<span class='region-label'><span class='region-dot' style='background:"+(regionColors[r]||"#6b7280")+"'></span>"+r+"</span>";}).join("");
  rc.innerHTML="<button class='region-chip active' data-region='all'>All Regions</button>"+rlist.map(function(r){return"<button class='region-chip' data-region='"+r+"'>"+r+"</button>";}).join("");
  rc.addEventListener("click",function(e){if(!e.target.classList.contains("region-chip"))return;rc.querySelectorAll(".region-chip").forEach(function(b){b.classList.remove("active")});e.target.classList.add("active");var region=e.target.dataset.region;var filtered=region==="all"?products.filter(function(p){return p.score>=75}):products.filter(function(p){return p.region===region&&p.score>=75});renderPaged('regionResults',filtered,1);});
  renderPaged('regionResults',products.filter(function(p){return p.score>=75}),1);

  // Gaps
  var gaps=products.filter(function(p){return p.score<75&&!p.alts.length;});
  document.getElementById("gapStats").innerHTML="<div class='stat-box'><div class='stat-number'>"+gaps.length+"</div><div class='stat-label'>Supply Gaps</div></div>";
  document.getElementById("gapResults").innerHTML=gaps.slice(0,50).map(function(p){return"<div class='gap-card'><div class='product-header'><div class='product-name'>"+p.name+"</div><span class='score-badge score-low'>"+p.score+"/100</span></div><div class='product-desc'>"+p.description+"</div><div class='gap-reason'>💡 Opportunity: "+p.category+" gap — could be produced in Canada</div></div>";}).join("");

  // Nav
  document.querySelectorAll(".nav-btn").forEach(function(btn){btn.addEventListener("click",function(){document.querySelectorAll(".nav-btn").forEach(function(b){b.classList.remove("active")});this.classList.add("active");document.querySelectorAll(".section").forEach(function(s){s.classList.remove("active")});document.getElementById(this.dataset.section+"-section").classList.add("active");});});

  // Homepage
  renderHomepage();
  renderSubmissions();
}

fetch("products.json?v=2").then(r=>r.json()).then(d=>{products=d;initApp();}).catch(e=>{console.error(e);document.getElementById("searchResults").innerHTML="<div class='empty-state'><p>Error loading products. Please refresh.</p></div>";});
