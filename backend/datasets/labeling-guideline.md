# Labeling Guideline

Use the original Kaggle class folders as the source of truth. Keep labels lowercase and kebab-case.

| Class | Meaning |
| --- | --- |
| `battery` | Batteries and small battery-like e-waste items. |
| `biological` | Organic or biodegradable waste such as food scraps and plant material. |
| `brown-glass` | Brown glass bottles, jars, and fragments. |
| `cardboard` | Cardboard boxes and carton-like board. |
| `clothes` | Fabric, garments, and textile items. |
| `green-glass` | Green glass bottles, jars, and fragments. |
| `metal` | Cans, foil, and other metal waste. |
| `paper` | Paper sheets, bags, receipts, and similar paper waste. |
| `plastic` | Plastic bottles, containers, wrappers, and similar plastic waste. |
| `shoes` | Shoes and footwear. |
| `trash` | Mixed residual waste that does not fit the other classes. |
| `white-glass` | Clear or white glass bottles, jars, and fragments. |

For model training and S3 upload, use only images accepted by `filter_clear_images.py`.
