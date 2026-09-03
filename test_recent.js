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
var now=new Date("2026-09-03T15:00:00Z");
var hourKey="2026-8-3-12";

check("catalog still has 9767 products", function(){
  assert.strictEqual(products.length, 9767);
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
});

check("no duplicate Chef Frankie name or website", function(){
  var byName=products.filter(function(p){return /chef frankie/i.test(p.name||"");});
  var byWeb=products.filter(function(p){return /cheffrankie/i.test(p.website||"");});
  assert.strictEqual(byName.length, 1);
  assert.strictEqual(byWeb.length, 1);
});

check("isRecentlyVerified respects date window", function(){
  var p=frankie[0];
  assert.strictEqual(context.isRecentlyVerified(p, now), true);
  assert.strictEqual(context.isRecentlyVerified(p, new Date("2026-10-10T00:00:00Z")), false);
  assert.strictEqual(context.isRecentlyVerified({recentlyVerified:"not-a-date"}, now), false);
  assert.strictEqual(context.isRecentlyVerified({featuredNew:"2026-09-01"}, now), true);
  assert.strictEqual(context.isRecentlyVerified({id:1}, now), false);
});

check("pickRecentlyAdded leads with newly verified Chef Frankie", function(){
  var picked=context.pickRecentlyAdded(products, {now:now, hourKey:hourKey, seed:1});
  assert.strictEqual(picked.length, 8);
  assert.strictEqual(picked[0].product.id, 3036);
  assert.strictEqual(picked[0].kind, "verified");
  assert.strictEqual(picked[0].product.name, "Boulangerie Chef Frankie");
  var ids=picked.map(function(x){return x.product.id;});
  assert.strictEqual(ids.filter(function(id){return id===3036;}).length, 1);
});

check("newest catalog IDs still appear after verified", function(){
  var picked=context.pickRecentlyAdded(products, {now:now, hourKey:hourKey, seed:1});
  var newest=products.slice().sort(function(a,b){return (b.id||0)-(a.id||0);}).slice(0,3);
  newest.forEach(function(p){
    var hit=picked.filter(function(x){return x.product.id===p.id;});
    assert.strictEqual(hit.length, 1, "missing newest id "+p.id);
    assert.strictEqual(hit[0].kind, "new");
  });
  assert.strictEqual(picked[1].kind, "new");
  assert.strictEqual(picked[2].kind, "new");
  assert.strictEqual(picked[3].kind, "new");
});

check("without verified metadata the 3 newest still lead", function(){
  var stripped=products.map(function(p){
    var copy={};
    Object.keys(p).forEach(function(k){
      if(k!=="recentlyVerified" && k!=="featuredNew") copy[k]=p[k];
    });
    return copy;
  });
  var picked=context.pickRecentlyAdded(stripped, {now:now, hourKey:hourKey, seed:99});
  var newest=stripped.slice().sort(function(a,b){return (b.id||0)-(a.id||0);}).slice(0,3);
  assert.strictEqual(picked.length, 8);
  assert.strictEqual(picked[0].product.id, newest[0].id);
  assert.strictEqual(picked[1].product.id, newest[1].id);
  assert.strictEqual(picked[2].product.id, newest[2].id);
  picked.slice(0,3).forEach(function(item){ assert.strictEqual(item.kind, "new"); });
  picked.slice(3).forEach(function(item){ assert.strictEqual(item.kind, "fresh"); });
  assert.ok(!picked.some(function(x){return x.product.id===3036;}));
});

check("expired recentlyVerified does not surface old listings", function(){
  var picked=context.pickRecentlyAdded(products, {now:new Date("2026-11-01T00:00:00Z"), hourKey:hourKey, seed:1});
  assert.ok(!picked.some(function(x){return x.product.id===3036;}));
  assert.strictEqual(picked[0].kind, "new");
});

check("verified cap keeps room for newest listings", function(){
  var extra=products.slice(0, 6).map(function(p, i){
    return Object.assign({}, p, {recentlyVerified:"2026-09-0"+(i+1)});
  });
  extra[0].recentlyVerified="2026-09-03";
  var picked=context.pickRecentlyAdded(extra.concat(products), {now:now, hourKey:hourKey, seed:1, verifiedCap:3});
  var verified=picked.filter(function(x){return x.kind==="verified";});
  var newestKinds=picked.filter(function(x){return x.kind==="new";});
  assert.ok(verified.length<=3);
  assert.ok(newestKinds.length>=3);
});

check("recentKindBadge markup", function(){
  assert.ok(context.recentKindBadge("verified").indexOf("home-card-verified")!==-1);
  assert.ok(context.recentKindBadge("new").indexOf("home-card-new")!==-1);
  assert.ok(context.recentKindBadge("fresh").indexOf("home-card-fresh")!==-1);
});

check("Just-added candidate remains the highest catalog id", function(){
  var byNew=products.slice().sort(function(a,b){return (b.id||0)-(a.id||0);});
  assert.notStrictEqual(byNew[0].id, 3036);
  assert.ok(byNew[0].id>3036);
});

if(failures){
  console.log("\n"+failures+" failed");
  process.exit(1);
}
console.log("\nAll recent-listing checks passed");
