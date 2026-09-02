# ChooseCanuck 🇨🇦

> **Shop Canadian. Build Canada.**

A free, open-source web app that helps Canadians find Canadian-made products, discover local alternatives, and identify supply gaps where domestic production can reduce reliance on imports — especially from the United States.

## 🌐 Live Site

**https://choosecanuck.github.io**

## ✨ What It Does

| Feature | Description |
|---------|-------------|
| 🔍 **Search** | Type any product name to find its origin and Canadian alternatives |
| 📂 **Categories** | Browse 950+ Canadian products across 6 categories |
| 🗺️ **Regions** | Discover products made in your province or territory |
| ⚠️ **Supply Gaps** | See what Canada doesn't make yet — opportunities for entrepreneurs |
| 📝 **Submit** | Add products from your region to help the community |

## 🚀 Quick Start

This is a static HTML/CSS/JS app. No build step required.

```bash
# Clone the repo
git clone https://github.com/donnyjm/choosecanuck.git
cd choosecanuck

# Serve locally (any static server works)
python3 -m http.server 7100
# or
npx serve .
```

Then open http://localhost:7100

## 🤝 Contributing

### Submit a Product
Use the **Submit** tab on the live site to add products from your region. Submissions are saved locally and will be reviewed for inclusion in the main database.

### Developer Contributions
1. Fork the repository
2. Make your changes
3. Submit a pull request

### Product Database
Products are stored in `products.json`. To add products directly:

```json
{
  "id": 951,
  "name": "Product Name",
  "category": "Food",
  "origin": "Canada",
  "region": "Ontario",
  "score": 95,
  "description": "Short description of the product.",
  "tags": ["organic", "local"],
  "alts": []
}
```

**Categories:** Food, Beverages, Household, Personal Care, Home & Electronics, Clothing

**Regions:** British Columbia, Alberta, Saskatchewan, Manitoba, Ontario, Quebec, New Brunswick, Nova Scotia, Prince Edward Island, Newfoundland & Labrador, Yukon, Northwest Territories, Nunavut, National

## 📊 Stats

- **950+ Products** in the database
- **91 Clothing Items**
- **6 Categories**
- **14 Regions** across Canada

## 📄 License

MIT License — see [LICENSE](LICENSE)

## 🙏 Acknowledgments

This is a community project. Every product submission helps build economic resilience for Canada.

---

*Made with ❤️ in Canada*

## Listing rule

Only Canadian-origin products with an official `website` are listed. No website, no listing.
