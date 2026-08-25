import json
data = json.load(open('products.json'))

print('=== CATEGORIES ===')
cats = {}
for p in data:
    cats.setdefault(p.get('category',''), []).append(p)
for k,v in sorted(cats.items(), key=lambda x: -len(x[1])):
    print(f'{k}: {len(v)}')

print('\n=== CLOTHING SEARCH ===')
for p in data:
    if p.get('category') == 'Clothing':
        print(f"  {p['name']} | {p.get('category','')}")
    if any(w in p.get('name','').lower() for w in ['sock', 'underwear', 'pant', 'jean', 'shirt']):
        print(f"  MATCH: {p['name']} | {p.get('category','')} | {p.get('region','')}")

print('\n=== SEARCH TEST: socks, underwear, pants ===')
for q in ['sock', 'underwear', 'pant']:
    f = [p for p in data if q in p.get('name','').lower() or q in p.get('description','').lower() or any(q in t.lower() for t in p.get('tags',[]))]
    print(f'{q}: {len(f)} results')
    for p in f[:3]:
        print(f"  {p['name']}")
