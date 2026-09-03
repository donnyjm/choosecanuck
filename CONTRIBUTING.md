# Contributing to ChooseCanuck

Thanks for helping build Canada's product database!

## Ways to Contribute

### 1. Submit a Product (Easiest)
Go to [choosecanuck.ca](https://choosecanuck.ca), click **Submit**, and fill out the form. **An official website is required.** Your submission saves locally and helps grow the database.

### 2. Add Products via GitHub
Edit `products.json` and add new items following this format:

```json
{
  "id": 951,
  "name": "Product Name",
  "category": "Food",
  "origin": "Canada",
  "region": "Ontario",
  "score": 95,
  "description": "Short description.",
  "website": "https://example.com",
  "tags": ["organic", "local"],
  "alts": []
}
```

**Rules:** `origin` must be `"Canada"`. `website` is required (http/https).

Optional: set `"recentlyVerified": "YYYY-MM-DD"` (or `featuredNew`) on an existing listing after its website is confirmed live. The homepage Recently added strip shows those first as **Verified** for 30 days, without changing the product id or adding a duplicate.

**Categories:** Food, Beverages, Household, Personal Care, Home & Electronics, Clothing, Other

**Regions:** British Columbia, Alberta, Saskatchewan, Manitoba, Ontario, Quebec, New Brunswick, Nova Scotia, Prince Edward Island, Newfoundland & Labrador, Yukon, Northwest Territories, Nunavut, National

### 3. Code Improvements
- Fork the repo
- Make your changes
- Submit a pull request

### 4. Spread the Word
Share [choosecanuck.ca](https://choosecanuck.ca) with friends, family, and communities.

---

*All contributions help build economic resilience for Canada.*
