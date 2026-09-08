#!/usr/bin/env node
"use strict";

var fs=require("fs");
var vm=require("vm");
var assert=require("assert");

var products=JSON.parse(fs.readFileSync("products.json","utf8"));
var appSrc=fs.readFileSync("app.js","utf8").replace(/fetch\("products\.json[\s\S]*$/,"");
var context=vm.createContext({
  console: console,
  window: { matchMedia: function(){ return {matches:true}; } },
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  JSON: JSON,
  parseInt: parseInt,
  isNaN: isNaN,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
});
vm.runInContext(appSrc, context);

var failures=0;
function check(name, fn){
  try{
    fn();
    console.log("ok  "+name);
  }catch(e){
    failures++;
    console.log("FAIL "+name);
    console.log("    "+(e && e.stack ? e.stack : e));
  }
}

var frankie=products.filter(function(p){return p.id===3036;});
var omega=products.filter(function(p){return p.id===10424;});
var rolgear=products.filter(function(p){return p.id===10425;});
var cocina=products.filter(function(p){return p.id===863;});
var now=new Date("2026-09-08T15:00:00Z");
var hourKey="2026-8-8-12";
var newest=products.slice().sort(function(a,b){return (b.id||0)-(a.id||0);}).slice(0,3);

check("catalog has unique ids and expected count", function(){
  assert.strictEqual(products.length, 9762);
  assert.strictEqual(new Set(products.map(function(p){return p.id;})).size, 9762);
});

check("Yumi Organics id 967 is removed", function(){
  assert.strictEqual(products.filter(function(p){return p.id===967;}).length, 0);
  assert.strictEqual(products.filter(function(p){return /yumi organics/i.test(p.name||"");}).length, 0);
  assert.strictEqual(products.filter(function(p){return /yumi\.ca/i.test(p.website||"");}).length, 0);
});

check("Rolgear Multibit Screwdriver is a distinct product", function(){
  assert.strictEqual(rolgear.length, 1);
  var p=rolgear[0];
  assert.strictEqual(p.name, "Rolgear Multibit Screwdriver");
  assert.strictEqual(p.website, "https://www.rolgear.com/product/multibit-screwdriver-power-bits-fixed-shaft/");
  assert.strictEqual(p.category, "Home & Electronics");
  assert.strictEqual(p.origin, "Canada");
  assert.strictEqual(p.region, "British Columbia");
  assert.strictEqual(p.score, 94);
  assert.strictEqual(p.justAdded, undefined);
  assert.strictEqual(p.recentlyVerified, "2026-09-08");
  var brand=products.filter(function(x){return x.id===1147;});
  assert.strictEqual(brand.length, 1);
  assert.strictEqual(brand[0].name, "Rolgear Manufacturing");
  assert.strictEqual(brand[0].website, "https://www.rolgear.com/");
});

check("region values are canonical — one NL spelling, Canada mapped to National", function(){
  var regions=products.map(function(p){return p.region;});
  assert.strictEqual(regions.filter(function(r){return r==="Newfoundland and Labrador";}).length, 0);
  assert.strictEqual(regions.filter(function(r){return r==="Canada";}).length, 0);
  var seaside=products.filter(function(p){return p.id===10278;});
  assert.strictEqual(seaside.length, 1);
  assert.strictEqual(seaside[0].region, "Newfoundland & Labrador");
  var unique=[...new Set(regions)].sort();
  assert.deepStrictEqual(unique, [
    "Alberta","British Columbia","Manitoba","National","New Brunswick",
    "Newfoundland & Labrador","Northwest Territories","Nova Scotia","Nunavut",
    "Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon"
  ]);
  assert.strictEqual(unique.filter(function(r){return /Newfoundland/.test(r);}).length, 1);
  assert.ok(unique.indexOf("Saskatchewan")!==-1);
});

check("home and region chips use allRegions (includes Saskatchewan, one NL)", function(){
  var chips=context.listCanonicalRegions();
  assert.ok(chips.indexOf("Saskatchewan")!==-1);
  assert.strictEqual(chips.filter(function(r){return r==="Saskatchewan";}).length, 1);
  assert.strictEqual(chips.filter(function(r){return /Newfoundland/.test(r);}).length, 1);
  assert.strictEqual(chips.indexOf("Newfoundland & Labrador")!==-1, true);
  assert.strictEqual(chips.indexOf("Newfoundland and Labrador"), -1);
  assert.strictEqual(chips.indexOf("Canada"), -1);
  var expected=[
    "British Columbia","Alberta","Saskatchewan","Manitoba","Ontario","Quebec",
    "New Brunswick","Nova Scotia","Prince Edward Island","Newfoundland & Labrador",
    "Yukon","Northwest Territories","Nunavut","National"
  ];
  assert.strictEqual(chips.length, 14);
  assert.strictEqual(Array.prototype.slice.call(chips).join("|"), expected.join("|"));
  var alias={region:"Newfoundland and Labrador"};
  context.normalizeProductRegion(alias);
  assert.strictEqual(alias.region, "Newfoundland & Labrador");
  var national={region:"Canada"};
  context.normalizeProductRegion(national);
  assert.strictEqual(national.region, "National");
});

check("Chef Frankie exists once with original identity", function(){
  assert.strictEqual(frankie.length, 1);
  var p=frankie[0];
  assert.strictEqual(p.name, "Boulangerie Chef Frankie");
  assert.strictEqual(p.website, "https://cheffrankie.ca");
  assert.strictEqual(p.category, "Food");
  assert.strictEqual(p.origin, "Canada");
  assert.strictEqual(p.region, "National");
  assert.strictEqual(p.score, 90);
  assert.strictEqual(p.recentlyVerified, "2026-09-03");
  assert.strictEqual(p.justAdded, true);
});

check("no duplicate Chef Frankie name or website", function(){
  var byName=products.filter(function(p){return /chef frankie/i.test(p.name||"");});
  var byWeb=products.filter(function(p){return /cheffrankie/i.test(p.website||"");});
  assert.strictEqual(byName.length, 1);
  assert.strictEqual(byWeb.length, 1);
});

check("La Cocina Tortilla Chips is a single Food listing", function(){
  assert.strictEqual(cocina.length, 1);
  var p=cocina[0];
  assert.strictEqual(p.name, "La Cocina Tortilla Chips");
  assert.strictEqual(p.website, "https://www.lacocinafoods.ca");
  assert.strictEqual(p.category, "Food");
  assert.strictEqual(p.origin, "Canada");
  assert.strictEqual(p.region, "Manitoba");
  assert.strictEqual(p.score, 94);
  assert.strictEqual(p.justAdded, true);
  assert.strictEqual(p.recentlyVerified, "2026-09-08");
  assert.ok(/Manitoba/.test(p.description));
  assert.ok(/1984/.test(p.description));
  assert.ok(/Superstore/.test(p.description));
  assert.ok(p.tags.indexOf("chips")!==-1);
  assert.ok(p.tags.indexOf("snacks")!==-1);
  assert.ok(p.tags.indexOf("gluten-free")!==-1);
  assert.ok(p.tags.indexOf("manitoba")!==-1);
  assert.ok(p.tags.indexOf("food-beverage")!==-1);
  assert.strictEqual(products.filter(function(x){return x.id===5326;}).length, 0);
  assert.strictEqual(products.filter(function(x){return /lacocinachips\.com/i.test(x.website||"");}).length, 0);
  var byName=products.filter(function(x){return /la\s*cocina/i.test(x.name||"");});
  var byWeb=products.filter(function(x){return /lacocinafoods\.ca/i.test(x.website||"");});
  assert.strictEqual(byName.length, 1);
  assert.strictEqual(byWeb.length, 1);
});

check("Rolgear Multibit is the newest catalog listing", function(){
  assert.strictEqual(omega.length, 1);
  assert.strictEqual(omega[0].name, "Omega Travel");
  assert.strictEqual(newest[0].id, 10425);
  assert.strictEqual(newest[0].name, "Rolgear Multibit Screwdriver");
  assert.strictEqual(newest[1].id, 10424);
});

check("pickJustAdded uses La Cocina Tortilla Chips as the current banner item", function(){
  var jp=context.pickJustAdded(products, {now:now});
  assert.ok(jp);
  assert.strictEqual(jp.id, 863);
  assert.strictEqual(jp.name, "La Cocina Tortilla Chips");
});

check("Just added banner HTML opens La Cocina Tortilla Chips", function(){
  var jp=context.pickJustAdded(products, {now:now});
  var html=context.justAddedBannerHtml(jp);
  assert.ok(html.indexOf("just-added")!==-1);
  assert.ok(html.indexOf("Just added")!==-1);
  assert.ok(html.indexOf("showProductDetail(863)")!==-1);
  assert.ok(html.indexOf("La Cocina Tortilla Chips")!==-1);
  assert.ok(html.indexOf("showProductDetail(10425)")===-1);
  assert.ok(html.indexOf("showProductDetail(10424)")===-1);
});

check("isRecentlyVerified and justAdded pin semantics", function(){
  var p=frankie[0];
  assert.strictEqual(context.isJustAddedPin(p), true);
  assert.strictEqual(context.isJustAddedOverride(p, now), true);
  assert.strictEqual(context.isRecentlyVerified(p, now), true);
  assert.strictEqual(context.isRecentlyVerified(p, new Date("2026-10-10T00:00:00Z")), false);
  assert.strictEqual(context.isJustAddedOverride(p, new Date("2026-11-01T00:00:00Z")), true);
  assert.strictEqual(context.isRecentlyVerified({recentlyVerified:"not-a-date"}, now), false);
  assert.strictEqual(context.isRecentlyVerified({featuredNew:"2026-09-01"}, now), true);
  assert.strictEqual(context.isJustAddedOverride({id:1}, now), false);
});

check("dated override without pin expires back to newest id", function(){
  var dated=products.map(function(p){
    var copy={};
    Object.keys(p).forEach(function(k){
      if(k!=="justAdded") copy[k]=p[k];
    });
    return copy;
  });
  var current=context.pickJustAdded(dated, {now:now});
  assert.strictEqual(current.id, 10425);
  var expired=context.pickJustAdded(dated, {now:new Date("2026-11-01T00:00:00Z")});
  assert.strictEqual(expired.id, 10425);
  assert.strictEqual(expired.name, "Rolgear Multibit Screwdriver");
});

check("without override metadata the banner is the newest id", function(){
  var stripped=products.map(function(p){
    var copy={};
    Object.keys(p).forEach(function(k){
      if(k!=="recentlyVerified" && k!=="featuredNew" && k!=="justAdded") copy[k]=p[k];
    });
    return copy;
  });
  var jp=context.pickJustAdded(stripped, {now:now});
  assert.strictEqual(jp.id, 10425);
  assert.strictEqual(jp.name, "Rolgear Multibit Screwdriver");
});

check("newer dated override wins over an older date when neither is pinned", function(){
  var stripped=products.map(function(p){
    var copy={};
    Object.keys(p).forEach(function(k){
      if(k!=="recentlyVerified" && k!=="featuredNew" && k!=="justAdded") copy[k]=p[k];
    });
    return copy;
  });
  stripped.forEach(function(p){
    if(p.id===3036) p.recentlyVerified="2026-08-20";
    if(p.id===15) p.recentlyVerified="2026-09-02";
  });
  var jp=context.pickJustAdded(stripped, {now:now});
  assert.strictEqual(jp.id, 15);
});

check("explicit justAdded pin wins over a newer dated override", function(){
  var extra=products.map(function(p){ return Object.assign({}, p); });
  extra.forEach(function(p){
    if(p.id===863) delete p.justAdded;
    if(p.id===10425) delete p.justAdded;
    if(p.id===15) p.recentlyVerified="2026-09-08";
  });
  var jp=context.pickJustAdded(extra, {now:now});
  assert.strictEqual(jp.id, 3036);
});

check("Recently added grid is newest three, then La Cocina and Chef Frankie, then unique fill", function(){
  var picked=context.pickRecentlyAdded(products, {now:now, hourKey:hourKey, seed:1});
  assert.strictEqual(picked.length, 8);
  assert.strictEqual(picked[0].product.id, 10425);
  assert.strictEqual(picked[0].product.name, "Rolgear Multibit Screwdriver");
  assert.strictEqual(picked[0].kind, "new");
  assert.strictEqual(picked[1].product.name, "Omega Travel");
  assert.strictEqual(picked[1].kind, "new");
  assert.strictEqual(picked[2].product.name, "3DQue");
  assert.strictEqual(picked[2].kind, "new");
  newest.forEach(function(p, i){
    assert.strictEqual(picked[i].product.id, p.id);
    assert.strictEqual(picked[i].kind, "new");
  });
  assert.strictEqual(picked[3].product.id, 863);
  assert.strictEqual(picked[3].product.name, "La Cocina Tortilla Chips");
  assert.strictEqual(picked[3].kind, "verified");
  assert.strictEqual(picked[4].product.id, 3036);
  assert.strictEqual(picked[4].product.name, "Boulangerie Chef Frankie");
  assert.strictEqual(picked[4].kind, "verified");
  picked.slice(5).forEach(function(item){ assert.strictEqual(item.kind, "fresh"); });
  var ids=picked.map(function(x){return x.product.id;});
  assert.strictEqual(new Set(ids).size, ids.length);
  assert.strictEqual(ids.filter(function(id){return id===863;}).length, 1);
  assert.strictEqual(ids.filter(function(id){return id===3036;}).length, 1);
  assert.strictEqual(ids.filter(function(id){return id===10425;}).length, 1);
});

check("expired dated overrides leave the grid when not pinned", function(){
  var dated=products.map(function(p){
    var copy={};
    Object.keys(p).forEach(function(k){
      if(k!=="justAdded") copy[k]=p[k];
    });
    return copy;
  });
  var picked=context.pickRecentlyAdded(dated, {now:new Date("2026-11-01T00:00:00Z"), hourKey:hourKey, seed:1});
  assert.strictEqual(picked.length, 8);
  assert.ok(!picked.some(function(x){return x.product.id===3036;}));
  newest.forEach(function(p, i){
    assert.strictEqual(picked[i].product.id, p.id);
    assert.strictEqual(picked[i].kind, "new");
  });
});

check("verified overrides already in the newest three are not duplicated", function(){
  var extra=products.map(function(p){ return Object.assign({}, p); });
  extra.forEach(function(p){
    if(p.id===10424){ p.justAdded=true; p.recentlyVerified="2026-09-03"; }
  });
  var picked=context.pickRecentlyAdded(extra, {now:now, hourKey:hourKey, seed:1});
  var ids=picked.map(function(x){return x.product.id;});
  assert.strictEqual(picked.length, 8);
  assert.strictEqual(new Set(ids).size, 8);
  assert.strictEqual(ids.filter(function(id){return id===10424;}).length, 1);
  assert.strictEqual(ids.filter(function(id){return id===10425;}).length, 1);
  assert.strictEqual(picked[0].product.id, 10425);
  assert.strictEqual(picked[0].kind, "new");
  assert.strictEqual(picked[1].product.id, 10424);
  assert.strictEqual(picked[1].kind, "new");
  assert.strictEqual(picked[3].product.id, 863);
  assert.strictEqual(picked[3].kind, "verified");
  assert.strictEqual(picked[4].product.id, 3036);
  assert.strictEqual(picked[4].kind, "verified");
});

check("recentKindBadge markup", function(){
  assert.ok(context.recentKindBadge("verified").indexOf("home-card-verified")!==-1);
  assert.ok(context.recentKindBadge("new").indexOf("home-card-new")!==-1);
  assert.ok(context.recentKindBadge("fresh").indexOf("home-card-fresh")!==-1);
});

if(failures){
  console.log("\n"+failures+" failed");
  process.exit(1);
}
console.log("\nAll recent-listing checks passed");
