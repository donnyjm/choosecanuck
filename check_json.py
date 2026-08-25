import json

with open('products.json', 'r') as f:
    data = json.load(f)

max_id = max(p['id'] for p in data)
print('Products:', len(data))
print('Max ID:', max_id)
print('Clothing products:', len([p for p in data if p['category']=='Clothing']))
