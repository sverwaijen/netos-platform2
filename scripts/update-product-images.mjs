// Script to update product images in the database
// Run via: curl -X POST http://localhost:3000/api/admin/update-product-images

// Product ID -> Compressed webp URL mapping
export const productImageMap = {
  // SOEPEN (cat 83)
  439: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/uiensoep-7L85Jy77iUkbadcjG86Rr3.webp",
  440: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/knolselderij-soep-ZdnfjPqXddDKEGi6SP7bzb.webp",
  441: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/bospaddenstoelensoep-iox2mKyfhyViixS3nELTrG.webp",
  442: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/pompoensoep-3ZTFNw7Pnqm6EbN9e83ZcZ.webp",
  443: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/linzensoep-AEctgavf5cnWZ6MXTCiVhu.webp",
  444: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/courgettesoep-WLVvjtjCZATiFNAKzrBX7B.webp",
  445: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/zoete-aardappelsoep-HRXa8wSMwNQDmk6nQsEGQE.webp",

  // BREAKFAST (cat 88)
  463: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/croissant-RqxHzbSLv5eEVbgpUB52Lw.webp",
  466: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/cinnamon-swirl-ESsymTeJixsV4j9aQTgVto.webp",
  467: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/hand-fruit-EETK5xqWxbmxDCAUcyW6wM.webp",

  // SWEETS (cat 89)
  468: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/plaatcake-9ic7ECsfFjNz6muUYbpaah.webp",
  469: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/koek-cAA3mpFCMHRk9fdaVGnZq5.webp",
  470: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/brownie-GEY7feSKLKHwTdsScNfTmz.webp",
  471: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/bananenbrood-YRGcshFo4JA4QWEDKhbfec.webp",
  472: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/muffin-hVAiKs4hFXSpHXuSWvAXZc.webp",
  473: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/muesli-date-bar-WaiNDSZm6PVXvMJwhH7ZMA.webp",
  474: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/bread-pudding-SSPjXkDoZ9hkALYdBLXKg5.webp",

  // SMOOTHIES (cat 90)
  475: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/green-machine-Z3LKyfHcz547Fouaskhy3W.webp",
  476: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/yellow-star-kKSexS28Bhd8APrMRqQUNF.webp",
  477: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/red-devil-NiG3gVgjSLs49di9HXy3YQ.webp",
  478: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/pearfect-fall-hRw7MtoGzZaWbBwJ6FNb8Z.webp",
  479: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/pumpkin-spice-UCabD3MT8kcPcywXkjfumi.webp",

  // WARME DRANKEN (cat 91)
  480: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/americano-GZzNjKr7speH2a2rrYBy3P.webp",
  481: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/espresso-M26JnrYamxRNGbLeJgfjet.webp",
  482: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/cappuccino-gCkxgZS4yUEGywMwhAHb89.webp",
  483: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/koffie-verkeerd-PcNm7KMsi8bKBpV5iRi9g2.webp",
  484: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/latte-macchiato-NhcUkD5qciyu2dniHaomRo.webp",
  485: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/thee-byyBAvJGkaKbVKafG7kDyD.webp",
  486: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/warme-chocolademelk-7NuZHh3TUJ4JTVDg9S5vGy.webp",

  // KOUDE DRANKEN (cat 92)
  487: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/fritz-cola-PkjQiEgBrzdhfgoGCHciVe.webp",
  488: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/bos-ice-tea-SoqtFQjEx8srTWWiyChzn5.webp",
  489: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/fever-tree-tonic-iMuZeYvzmZmQ2sYTHA8eo9.webp",
  490: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/sinaasappelsap-QhJJ3wB5nrRqBwo2EYpvWB.webp",
  491: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/bundaberg-gingerbeer-muBi7giUEapxZoQqhj8YbF.webp",
  492: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/soof-iX3ivbQgh2Jc3sbkXZ5tgy.webp",
  493: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/kombucha-aZubdDWuqGLVCZBnfj5Yi6.webp",
  494: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/earth-water-kEN7pzU8Whw7mfb3WMLcoU.webp",
  495: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/bier-36HKrxGu83FG9sXG3NoyjL.webp",
  496: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/wijn-glas-k345uYu4WPiKPaATcDnMRT.webp",
  497: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/wijn-fles-SgxFDgXjpgGp24oxG2spxp.webp",

  // ARRANGEMENTEN (cat 93)
  498: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/breakfast-deal-8aKaC4p5h9ighKbe3qTJGH.webp",
  499: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/breakfast-deal-8aKaC4p5h9ighKbe3qTJGH.webp",
  500: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/lunch-deal-JwHrYrezz9JBW7ngbdXBks.webp",
  501: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/koffie-thee-water-ec8oZoXvKqqRpy3oS6rfWo.webp",
  502: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/koffie-thee-water-ec8oZoXvKqqRpy3oS6rfWo.webp",
  503: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/afternoon-bites-brood-hRR7RZYHqK3pjZZpyh53yv.webp",
  504: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/afternoon-bites-crudite-EPteL2otN9QyLXVy8gUmv6.webp",
  505: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/borrel-bites-83kQWF2o78ZPRpxSKpiiwK.webp",
  506: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/dinner-deal-dniLa7sJXkS9A5xmdsqHSc.webp",
  507: "https://d2xsxph8kpxj0f.cloudfront.net/310519663495612718/EJqjprwuXREhoZEjTcNcr3/borrelplank-iTCDgxMYB6Y6igz5u4rq5F.webp",
};
