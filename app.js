
function setResultsHtml(id,html){
  var el=document.getElementById(id);
  if(!el) return;
  el.innerHTML=html;
  el.classList.toggle("results-grid", html.indexOf("product-card")!==-1);
}
let products = [];
const regionColors = {"British Columbia": "#2d6a4f", "Alberta": "#bc4749", "Saskatchewan": "#f4a261", "Manitoba": "#e76f51", "Ontario": "#1d3557", "Quebec": "#457b9d", "New Brunswick": "#6a4c93", "Nova Scotia": "#1982c4", "Prince Edward Island": "#8ac926", "Newfoundland & Labrador": "#ff595e", "Yukon": "#ffca3a", "Northwest Territories": "#6a4c93", "Nunavut": "#9b5de5", "National": "#b91c1c"};
const allRegions = ["British Columbia", "Alberta", "Saskatchewan", "Manitoba", "Ontario", "Quebec", "New Brunswick", "Nova Scotia", "Prince Edward Island", "Newfoundland & Labrador", "Yukon", "Northwest Territories", "Nunavut", "National"];
const PAGE_SIZE = 50;

const SAVED_KEY = "cc_saved";

function loadSavedIds(){
  try{
    var raw=JSON.parse(localStorage.getItem(SAVED_KEY)||"[]");
    if(!Array.isArray(raw)) return [];
    return raw.map(function(x){return Number(x)}).filter(function(x){return !isNaN(x)});
  }catch(e){return [];}
}

function saveSavedIds(ids){
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
  updateSavedNav();
}

function isSaved(id){
  return loadSavedIds().indexOf(Number(id))!==-1;
}

function toggleSave(id, ev){
  if(ev){ev.stopPropagation(); ev.preventDefault();}
  id=Number(id);
  var ids=loadSavedIds();
  var i=ids.indexOf(id);
  if(i===-1) ids.push(id); else ids.splice(i,1);
  saveSavedIds(ids);
  // refresh any visible save buttons for this id
  document.querySelectorAll('.save-btn[data-id="'+id+'"]').forEach(function(btn){
    var on=ids.indexOf(id)!==-1;
    btn.classList.toggle('saved', on);
    btn.setAttribute('aria-pressed', on?'true':'false');
    btn.title=on?'Remove from saved':'Save for later';
    btn.textContent=on?'♥':'♡';
  });
  var savedSection=document.getElementById('saved-section');
  if(savedSection && savedSection.classList.contains('active')) renderSaved();
}

function updateSavedNav(){
  var btn=document.getElementById('savedNavBtn');
  if(!btn) return;
  var n=loadSavedIds().length;
  var label='Saved';
  if(n) label+=' <span class="saved-count">'+n+'</span>';
  btn.innerHTML=label;
}

function productsByIds(ids){
  var byId={};
  products.forEach(function(p){byId[p.id]=p;});
  return ids.map(function(id){return byId[Number(id)];}).filter(Boolean);
}

function buildShareListUrl(ids, title){
  var u=new URL(window.location.href);
  u.search="";
  u.hash="";
  u.searchParams.set("list", title && String(title).trim() ? String(title).trim() : "Saved picks");
  u.searchParams.set("ids", ids.join(","));
  return u.toString();
}

function parseSharedListFromUrl(){
  try{
    var params=new URLSearchParams(window.location.search);
    var idsRaw=params.get("ids");
    if(!idsRaw) return null;
    var ids=idsRaw.split(",").map(function(x){return Number(String(x).trim());}).filter(function(x){return !isNaN(x) && x>0;});
    // dedupe preserve order
    var seen={}; var uniq=[];
    ids.forEach(function(id){ if(!seen[id]){ seen[id]=1; uniq.push(id);} });
    if(!uniq.length) return null;
    var title=params.get("list") || "Shared list";
    return {title:title, ids:uniq};
  }catch(e){ return null; }
}

function clearSharedListParams(){
  try{
    var u=new URL(window.location.href);
    u.searchParams.delete("list");
    u.searchParams.delete("ids");
    var qs=u.searchParams.toString();
    window.history.replaceState({}, "", u.pathname + (qs ? "?"+qs : "") + u.hash);
  }catch(e){}
}

function copyText(text){
  if(navigator.clipboard && navigator.clipboard.writeText){
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function(resolve, reject){
    try{
      var ta=document.createElement("textarea");
      ta.value=text;
      ta.style.position="fixed";
      ta.style.left="-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      resolve();
    }catch(e){ reject(e); }
  });
}

function shareMySavedList(){
  var ids=loadSavedIds();
  var list=productsByIds(ids);
  if(!list.length){
    alert("Save a few products first, then share.");
    return;
  }
  var title=prompt("Name this list (optional):", "My Canadian picks");
  if(title===null) return;
  var url=buildShareListUrl(list.map(function(p){return p.id;}), title);
  copyText(url).then(function(){
    var status=document.getElementById("shareListStatus");
    if(status){
      status.textContent="Link copied — paste it anywhere.";
      status.style.display="block";
      setTimeout(function(){ status.style.display="none"; }, 3500);
    }else{
      alert("Link copied:\\n"+url);
    }
  }).catch(function(){
    prompt("Copy this link:", url);
  });
}

function saveSharedListToMine(ids){
  var mine=loadSavedIds();
  var seen={};
  mine.forEach(function(id){ seen[id]=1; });
  (ids||[]).forEach(function(id){
    id=Number(id);
    if(!seen[id]){ mine.push(id); seen[id]=1; }
  });
  saveSavedIds(mine);
  // refresh hearts on page
  document.querySelectorAll(".save-btn").forEach(function(btn){
    var id=Number(btn.getAttribute("data-id"));
    var on=mine.indexOf(id)!==-1;
    btn.classList.toggle("saved", on);
    btn.setAttribute("aria-pressed", on?"true":"false");
    btn.title=on?"Remove from saved":"Save for later";
    btn.textContent=on?"♥":"♡";
  });
  updateSavedNav();
  var status=document.getElementById("sharedListStatus");
  if(status){
    status.textContent="Added to your Saved list on this device.";
    status.style.display="block";
  }
}

function renderSharedListView(shared){
  var c=document.getElementById("sharedListResults");
  if(!c) return;
  var list=productsByIds(shared.ids);
  if(!list.length){
    setResultsHtml("sharedListResults","<div class='empty-state'><p>This shared list has no matching products (they may have been removed).</p><div class='saved-empty-actions'><button class='submit-btn' onclick=\"switchTab('search')\">Browse products</button></div></div>");
    return;
  }
  var title=esc(shared.title||"Shared list");
  var h="";
  h+="<div class='shared-list-banner'>";
  h+="<div><div class='shared-list-label'>Shared list</div><h3 class='shared-list-title'>"+title+"</h3>";
  h+="<p class='shared-list-meta'>"+list.length+" Canadian product"+(list.length===1?"":"s")+"</p></div>";
  h+="<div class='shared-list-actions'>";
  h+="<button type='button' class='submit-btn' onclick='saveSharedListToMine(["+list.map(function(p){return p.id;}).join(",")+"])'>Save all ♡</button>";
  h+="<button type='button' class='submit-btn secondary' onclick=\"switchTab('saved')\">My Saved</button>";
  h+="</div></div>";
  h+="<div id='sharedListStatus' class='share-status' style='display:none'></div>";
  h+=list.map(renderCard).join("");
  setResultsHtml("sharedListResults",h);
}

function openSharedListIfPresent(){
  var shared=parseSharedListFromUrl();
  if(!shared) return false;
  switchTab("shared");
  renderSharedListView(shared);
  return true;
}

function renderSaved(){
  var c=document.getElementById('savedResults');
  if(!c) return;
  var ids=loadSavedIds();
  if(!ids.length){
    c.innerHTML="<div class='empty-state'><p>No saved products yet. Tap ♡ on any card to build your list.</p><div class='saved-empty-actions'><button class='submit-btn' onclick=\"switchTab('search')\">Browse products</button></div></div>";
    updateSavedNav();
    return;
  }
  var list=productsByIds(ids);
  // drop stale ids
  if(list.length!==ids.length){
    saveSavedIds(list.map(function(p){return p.id;}));
  }
  if(!list.length){
    c.innerHTML="<div class='empty-state'><p>No saved products yet. Tap ♡ on any card to build your list.</p></div>";
    updateSavedNav();
    return;
  }
  var h="";
  h+="<div class='saved-toolbar'>";
  h+="<div class='canada-badge'>♡ <strong>"+list.length+" saved</strong> on this device</div>";
  h+="<button type='button' class='submit-btn secondary' onclick='shareMySavedList()'>Share list</button>";
  h+="</div>";
  h+="<div id='shareListStatus' class='share-status' style='display:none'></div>";
  h+=list.map(renderCard).join("");
  c.innerHTML=h;
  updateSavedNav();
}

function getScoreClass(s){return s>=75?"score-high":s>=40?"score-mid":"score-low"}

function esc(s){
  return String(s==null?"":s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function renderCard(p){
  var rc=regionColors[p.region]||"#6b7280";
  var on=isSaved(p.id);
  var h="<div class='product-card' onclick='toggleDetail("+p.id+")'>";
  h+="<div class='product-header'><div><div class='product-name'>"+esc(p.name)+"</div>";
  h+="<div class='product-meta'><span class='product-category'>"+esc(p.category)+"</span><span class='product-region' style='background:"+rc+"'>"+esc(p.region)+"</span></div></div>";
  h+="<div class='product-header-actions'>";
  h+="<button type='button' class='save-btn"+(on?" saved":"")+"' data-id='"+p.id+"' aria-label='"+(on?"Remove from saved":"Save for later")+"' aria-pressed='"+(on?"true":"false")+"' title='"+(on?"Remove from saved":"Save for later")+"' onclick='toggleSave("+p.id+", event)'>"+(on?"♥":"♡")+"</button>";
  h+="<span class='score-badge "+getScoreClass(p.score)+"'>"+p.score+"/100</span></div></div>";
  h+="<div class='product-desc'>"+esc(p.description)+"</div>";
  if(p.website){
    h+="<div class='product-site'><a class='buy-btn brand' href='"+esc(p.website)+"' target='_blank' rel='noopener' onclick='event.stopPropagation()'>Visit website</a></div>";
  }
  if(p.tags&&p.tags.length)h+="<div class='product-tags'>"+p.tags.map(function(t){return"<span class='tag'>"+esc(t)+"</span>"}).join("")+"</div>";
  h+="</div><div id='detail-"+p.id+"' style='display:none'></div>";
  return h;
}

function getWhereToFind(p){
  var result={online:[],tips:[]};
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

  var panel=document.createElement("div");
  panel.className="detail-panel";

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

  var descP=document.createElement("p");
  descP.style.cssText="font-size:13px;color:#374151;margin-bottom:12px;";
  descP.textContent=p.description;
  panel.appendChild(descP);

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

  if(info.online.length){
    var buyBox=document.createElement("div");
    buyBox.style.cssText="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin-bottom:14px;";
    var buyTitle=document.createElement("h4");
    buyTitle.style.cssText="font-size:13px;font-weight:600;color:#1d4ed8;margin-bottom:8px;";
    buyTitle.textContent="Buy Online";
    buyBox.appendChild(buyTitle);
    info.online.forEach(function(link){
      var a=document.createElement("a");
      a.href=link.url;
      a.target="_blank";
      a.rel="noopener";
      a.className="buy-btn"+(link.type==="brand"?" brand":"");
      a.textContent=link.name;
      a.style.marginRight="6px";
      a.style.marginBottom="4px";
      buyBox.appendChild(a);
    });
    panel.appendChild(buyBox);
  }

  if(info.tips.length){
    var tipBox=document.createElement("div");
    tipBox.style.cssText="font-size:12px;color:#4b5563;margin-bottom:10px;";
    tipBox.innerHTML=info.tips.map(function(t){return"<div style='margin-bottom:4px'>• "+esc(t)+"</div>";}).join("");
    panel.appendChild(tipBox);
  }

  if(p.alts&&p.alts.length){
    var altTitle=document.createElement("h4");
    altTitle.style.cssText="font-size:13px;font-weight:600;margin-bottom:8px;color:#111827;";
    altTitle.textContent="Canadian Alternatives";
    panel.appendChild(altTitle);
    p.alts.forEach(function(a){
      var item=document.createElement("div");
      item.className="alt-item";
      item.innerHTML="<span class='alt-check'>✓</span><div><div class='alt-name'>"+esc(a.name)+"</div><div class='alt-desc'>"+esc(a.desc)+"</div></div>";
      panel.appendChild(item);
    });
  }

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
  var section=document.getElementById(name+"-section");
  if(section) section.classList.add("active");
  if(name==="saved") renderSaved();
  if(name==="shared"){
    var shared=parseSharedListFromUrl();
    if(shared) renderSharedListView(shared);
  }
}

function isValidWebsite(url){
  if(!url) return false;
  try{
    var u=new URL(url);
    return (u.protocol==="http:"||u.protocol==="https:") && u.hostname.indexOf(".")!==-1;
  }catch(e){return false;}
}

function generateSubmission(){
  var name=document.getElementById("subName").value.trim();
  var cat=document.getElementById("subCategory").value;
  var region=document.getElementById("subRegion").value;
  var desc=document.getElementById("subDesc").value.trim();
  var whereToBuy=document.getElementById("subWhere").value.trim();
  var website=document.getElementById("subWebsite").value.trim();
  var tags=document.getElementById("subTags").value.split(",").map(function(t){return t.trim()}).filter(Boolean);
  if(!name||!cat||!region||!desc||!website){alert("Please fill in all required fields, including the official website.");return;}
  if(!isValidWebsite(website)){alert("Please enter a valid website URL (https://...).");return;}
  var entry={name:name,category:cat,origin:"Canada",region:region,score:90,description:desc,alts:[],tags:tags,website:website};
  if(whereToBuy) entry.whereToBuy=whereToBuy;
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
    h+="<div style='font-size:13px;font-weight:600;'>"+esc(s.name)+"</div>";
    h+="<div style='font-size:11px;color:#6b7280;'>"+esc(s.region)+" · "+esc(s.category)+"</div>";
    if(s.website) h+="<div style='font-size:11px;margin-top:4px;'><a href='"+esc(s.website)+"' target='_blank' rel='noopener'>"+esc(s.website)+"</a></div>";
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
  setResultsHtml(containerId,h);
  window._pageState=window._pageState||{};
  window._pageState[containerId]={items:items,page:page};
}

function renderPage(containerId,page){
  var state=window._pageState[containerId];
  if(!state)return;
  renderPaged(containerId,state.items,page);
}

function pickFeatured(list,n){
  var pool=list.slice().sort(function(a,b){return (b.score||0)-(a.score||0);});
  var out=[], seen={};
  for(var i=0;i<pool.length && out.length<n;i++){
    var p=pool[i];
    if(!p.website||seen[p.website]) continue;
    // prefer spread across categories
    out.push(p);
    seen[p.website]=1;
  }
  return out.slice(0,n);
}

function renderHomepage(){
  var regions=[...new Set(products.map(function(p){return p.region}))].sort();
  var cats=[...new Set(products.map(function(p){return p.category}))].sort();
  var badge=document.getElementById("productCountBadge");
  if(badge) badge.textContent=products.length.toLocaleString()+"+ Canadian Products";
  var logoCount=document.getElementById("logoCount");
  if(logoCount) logoCount.textContent=products.length.toLocaleString()+"+ products · growing";

  document.getElementById("homeStats").innerHTML=
    "<div class='stat-box'><div class='stat-number'>"+products.length.toLocaleString()+"</div><div class='stat-label'>Products</div></div>"+
    "<div class='stat-box'><div class='stat-number'>"+cats.length+"</div><div class='stat-label'>Categories</div></div>"+
    "<div class='stat-box'><div class='stat-number'>"+regions.length+"</div><div class='stat-label'>Regions</div></div>"+
    "<div class='stat-box'><div class='stat-number'>100%</div><div class='stat-label'>Have websites</div></div>";

  var fp=pickFeatured(products,8);
  document.getElementById("featuredGrid").innerHTML=fp.map(function(p){
    var rc=regionColors[p.region]||"#6b7280";
    return "<div class='home-card' onclick='showProductDetail("+p.id+")'><div class='home-card-name'>"+esc(p.name)+"</div><div class='home-card-meta'><span style='display:inline-block;width:8px;height:8px;border-radius:50%;background:"+rc+";margin-right:4px'></span>"+esc(p.region)+" · "+esc(p.category)+"</div></div>";
  }).join("");

  document.getElementById("homeCats").innerHTML=cats.map(function(c){return"<button class='home-cat-chip' data-cat='"+esc(c)+"'>"+esc(c)+"</button>"}).join("");
  document.getElementById("homeCats").onclick=function(e){
    if(!e.target.classList.contains("home-cat-chip"))return;
    var cat=e.target.dataset.cat;
    switchTab('categories');
    document.querySelectorAll('#categoryChips .cat-chip').forEach(function(b){b.classList.toggle('active',b.dataset.cat===cat)});
    renderPaged('categoryResults',products.filter(function(p){return p.category===cat}),1);
  };

  document.getElementById("homeRegions").innerHTML=regions.slice(0,14).map(function(r){return"<button class='home-region-chip' data-region='"+esc(r)+"' style='background:"+(regionColors[r]||"#6b7280")+"'>"+esc(r)+"</button>";}).join("");
  document.getElementById("homeRegions").onclick=function(e){
    if(!e.target.classList.contains("home-region-chip"))return;
    var region=e.target.dataset.region;
    switchTab('regions');
    document.querySelectorAll('#regionChips .region-chip').forEach(function(b){b.classList.toggle('active',b.dataset.region===region)});
    renderPaged('regionResults',products.filter(function(p){return p.region===region}),1);
  };
}

function showProductDetail(id){
  // Ensure the card exists on search/home by jumping to categories all and opening
  var existing=document.getElementById("detail-"+id);
  if(!existing){
    switchTab('categories');
    renderPaged('categoryResults',products,1);
    // find page containing id
    var idx=products.findIndex(function(p){return p.id===id});
    if(idx>=0){
      var page=Math.floor(idx/PAGE_SIZE)+1;
      renderPaged('categoryResults',products,page);
    }
  }
  toggleDetail(id);
  var el=document.getElementById("detail-"+id);
  if(el)el.scrollIntoView({behavior:"smooth",block:"nearest"});
}

function initApp(){
  document.getElementById("searchInput").addEventListener("input",function(e){
    var q=e.target.value.toLowerCase().trim();
    var c=document.getElementById("searchResults");
    if(!q){c.innerHTML="";return;}
    function wordRe(term){return new RegExp("(^|[^a-z0-9])"+term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+("([^a-z0-9]|$)"));}
    function scoreProduct(p){
      var name=(p.name||"").toLowerCase();
      var desc=(p.description||"").toLowerCase();
      var tags=(p.tags||[]).map(function(t){return String(t).toLowerCase()}).join(" ");
      var web=(p.website||"").toLowerCase();
      var blob=name+" "+desc+" "+tags+" "+web;
      if(blob.indexOf(q)===-1) return 0;
      var s=0;
      var wr=wordRe(q);
      if(wr.test(name)) s+=100;
      if(name.split(/[^a-z0-9]+/).indexOf(q)!==-1) s+=80;
      if(wr.test(tags)) s+=70;
      if(wr.test(desc)) s+=40;
      if(wr.test(web)) s+=30;
      if(s===0) s=1; // weak substring match last
      return s;
    }
    var scored=products.map(function(p){return {p:p,s:scoreProduct(p)}}).filter(function(x){return x.s>0});
    scored.sort(function(a,b){return b.s-a.s || a.p.name.localeCompare(b.p.name)});
    var f=scored.map(function(x){return x.p});
    if(!f.length){c.innerHTML="<div class='empty-state'><p>No products found. Try a different term or use the Submit tab to add it!</p></div>";return;}
    c.innerHTML=f.slice(0,50).map(renderCard).join("");
  });

  var cats=[...new Set(products.map(function(p){return p.category}))].sort();
  var cc=document.getElementById("categoryChips");
  cc.innerHTML="<button class='cat-chip active' data-cat='all'>All</button>"+cats.map(function(c){return"<button class='cat-chip' data-cat='"+esc(c)+"'>"+esc(c)+"</button>"}).join("");
  cc.addEventListener("click",function(e){
    if(!e.target.classList.contains("cat-chip"))return;
    cc.querySelectorAll(".cat-chip").forEach(function(b){b.classList.remove("active")});
    e.target.classList.add("active");
    var cat=e.target.dataset.cat;
    var filtered=cat==="all"?products:products.filter(function(p){return p.category===cat});
    renderPaged('categoryResults',filtered,1);
  });
  renderPaged('categoryResults',products,1);

  var rlist=[...new Set(products.map(function(p){return p.region}))].sort();
  var rc=document.getElementById("regionChips");
  var rl=document.getElementById("regionLegend");
  rl.innerHTML=rlist.map(function(r){return"<span class='region-label'><span class='region-dot' style='background:"+(regionColors[r]||"#6b7280")+"'></span>"+esc(r)+"</span>";}).join("");
  rc.innerHTML="<button class='region-chip active' data-region='all'>All Regions</button>"+rlist.map(function(r){return"<button class='region-chip' data-region='"+esc(r)+"'>"+esc(r)+"</button>";}).join("");
  rc.addEventListener("click",function(e){
    if(!e.target.classList.contains("region-chip"))return;
    rc.querySelectorAll(".region-chip").forEach(function(b){b.classList.remove("active")});
    e.target.classList.add("active");
    var region=e.target.dataset.region;
    var filtered=region==="all"?products:products.filter(function(p){return p.region===region});
    renderPaged('regionResults',filtered,1);
  });
  renderPaged('regionResults',products,1);

  document.querySelectorAll(".nav-btn").forEach(function(btn){
    btn.addEventListener("click",function(){
      document.querySelectorAll(".nav-btn").forEach(function(b){b.classList.remove("active")});
      this.classList.add("active");
      document.querySelectorAll(".section").forEach(function(s){s.classList.remove("active")});
      document.getElementById(this.dataset.section+"-section").classList.add("active");
      if(this.dataset.section==="saved") renderSaved();
    });
  });

  updateSavedNav();
  renderHomepage();
  renderSubmissions();
  openSharedListIfPresent();
}

fetch("products.json?v=38").then(function(r){return r.json()}).then(function(d){
  products=d.filter(function(p){
    return p.origin==="Canada" && p.website && String(p.website).trim();
  });
  initApp();
}).catch(function(e){
  console.error(e);
  setResultsHtml("searchResults","<div class='empty-state'><p>Error loading products. Please refresh.</p></div>");
});
