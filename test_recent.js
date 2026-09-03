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
var now=new Date("2026-09-03T15:00:00Z");
var hourKey="2026-8-3-12";
var newest=products.slice().sort(function(a,b){return (b.id||0)-(a.id||0);}).slice(0,3);

check("catalog still has 9767 products", function(){
  assert.strictEqual(products.length, 9767);
  assert.strictEqual(new Set(products.map(function(p){return p.id;})).size, 9767);
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

check("Omega Travel remains the newest catalog listing", function(){
  assert.strictEqual(omega.length, 1);
  assert.strictEqual(omega[0].name, "Omega Travel");
  assert.strictEqual(newest[0].id, 10424);
});

check("pickJustAdded uses Chef Frankie as the current banner item", function(){
  var jp=context.pickJustAdded(products, {now:now});
  assert.ok(jp);
  assert.strictEqual(jp.id, 3036);
  assert.strictEqual(jp.name, "Boulangerie Chef Frankie");
  assert.notStrictEqual(jp.id, newest[0].id);
});

check("Just added banner HTML opens Chef Frankie", function(){
  var jp=context.pickJustAdded(products, {now:now});
  var html=context.justAddedBannerHtml(jp);
  assert.ok(html.indexOf("just-added")!==-1);
  assert.ok(html.indexOf("Just added")!==-1);
  assert.ok(html.indexOf("showProductDetail(3036)")!==-1);
  assert.ok(html.indexOf("Boulangerie Chef Frankie")!==-1);
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
  assert.strictEqual(current.id, 3036);
  var expired=context.pickJustAdded(dated, {now:new Date("2026-11-01T00:00:00Z")});
  assert.strictEqual(expired.id, 10424);
  assert.strictEqual(expired.name, "Omega Travel");
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
  assert.strictEqual(jp.id, 10424);
  assert.strictEqual(jp.name, "Omega Travel");
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
    if(p.id===15) p.recentlyVerified="2026-09-03";
  });
  var jp=context.pickJustAdded(extra, {now:now});
  assert.strictEqual(jp.id, 3036);
});

check("Recently added grid is newest three, then Chef Frankie, then unique fill", function(){
  var picked=context.pickRecentlyAdded(products, {now:now, hourKey:hourKey, seed:1});
  assert.strictEqual(picked.length, 8);
  assert.strictEqual(picked[0].product.id, 10424);
  assert.strictEqual(picked[0].product.name, "Omega Travel");
  assert.strictEqual(picked[0].kind, "new");
  assert.strictEqual(picked[1].product.name, "3DQue");
  assert.strictEqual(picked[1].kind, "new");
  assert.strictEqual(picked[2].product.name, "NanoGrande");
  assert.strictEqual(picked[2].kind, "new");
  newest.forEach(function(p, i){
    assert.strictEqual(picked[i].product.id, p.id);
    assert.strictEqual(picked[i].kind, "new");
  });
  assert.strictEqual(picked[3].product.id, 3036);
  assert.strictEqual(picked[3].product.name, "Boulangerie Chef Frankie");
  assert.strictEqual(picked[3].kind, "verified");
  picked.slice(4).forEach(function(item){ assert.strictEqual(item.kind, "fresh"); });
  var ids=picked.map(function(x){return x.product.id;});
  assert.strictEqual(new Set(ids).size, ids.length);
  assert.strictEqual(ids.filter(function(id){return id===3036;}).length, 1);
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
  assert.strictEqual(picked[0].product.id, 10424);
  assert.strictEqual(picked[0].kind, "new");
  assert.strictEqual(picked[3].product.id, 3036);
  assert.strictEqual(picked[3].kind, "verified");
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
