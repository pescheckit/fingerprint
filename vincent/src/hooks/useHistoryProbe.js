import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * History Probing Techniques
 *
 * These methods attempt to detect if certain sites have been visited
 * by exploiting browser caching and timing side-channels.
 *
 * Note: Modern browsers have mitigations against many of these techniques.
 * Results should be considered probabilistic, not definitive.
 */

// Comprehensive list of popular sites to probe organized by category
const PROBE_SITES = [
  // === SOCIAL MEDIA ===
  { name: 'Facebook', url: 'https://www.facebook.com', favicon: 'https://www.facebook.com/favicon.ico', category: 'social' },
  { name: 'Twitter/X', url: 'https://twitter.com', favicon: 'https://twitter.com/favicon.ico', category: 'social' },
  { name: 'Instagram', url: 'https://www.instagram.com', favicon: 'https://www.instagram.com/favicon.ico', category: 'social' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com', favicon: 'https://www.linkedin.com/favicon.ico', category: 'social' },
  { name: 'TikTok', url: 'https://www.tiktok.com', favicon: 'https://www.tiktok.com/favicon.ico', category: 'social' },
  { name: 'Reddit', url: 'https://www.reddit.com', favicon: 'https://www.reddit.com/favicon.ico', category: 'social' },
  { name: 'Pinterest', url: 'https://www.pinterest.com', favicon: 'https://www.pinterest.com/favicon.ico', category: 'social' },
  { name: 'Snapchat', url: 'https://www.snapchat.com', favicon: 'https://www.snapchat.com/favicon.ico', category: 'social' },
  { name: 'Tumblr', url: 'https://www.tumblr.com', favicon: 'https://www.tumblr.com/favicon.ico', category: 'social' },
  { name: 'Quora', url: 'https://www.quora.com', favicon: 'https://www.quora.com/favicon.ico', category: 'social' },
  { name: 'Threads', url: 'https://www.threads.net', favicon: 'https://www.threads.net/favicon.ico', category: 'social' },
  { name: 'Mastodon', url: 'https://mastodon.social', favicon: 'https://mastodon.social/favicon.ico', category: 'social' },
  { name: 'Bluesky', url: 'https://bsky.app', favicon: 'https://bsky.app/favicon.ico', category: 'social' },

  // === VIDEO & STREAMING ===
  { name: 'YouTube', url: 'https://www.youtube.com', favicon: 'https://www.youtube.com/favicon.ico', category: 'video' },
  { name: 'Netflix', url: 'https://www.netflix.com', favicon: 'https://www.netflix.com/favicon.ico', category: 'video' },
  { name: 'Twitch', url: 'https://www.twitch.tv', favicon: 'https://www.twitch.tv/favicon.ico', category: 'video' },
  { name: 'Disney+', url: 'https://www.disneyplus.com', favicon: 'https://www.disneyplus.com/favicon.ico', category: 'video' },
  { name: 'Hulu', url: 'https://www.hulu.com', favicon: 'https://www.hulu.com/favicon.ico', category: 'video' },
  { name: 'HBO Max', url: 'https://www.max.com', favicon: 'https://www.max.com/favicon.ico', category: 'video' },
  { name: 'Prime Video', url: 'https://www.primevideo.com', favicon: 'https://www.primevideo.com/favicon.ico', category: 'video' },
  { name: 'Spotify', url: 'https://www.spotify.com', favicon: 'https://www.spotify.com/favicon.ico', category: 'video' },
  { name: 'SoundCloud', url: 'https://soundcloud.com', favicon: 'https://soundcloud.com/favicon.ico', category: 'video' },
  { name: 'Vimeo', url: 'https://vimeo.com', favicon: 'https://vimeo.com/favicon.ico', category: 'video' },
  { name: 'Dailymotion', url: 'https://www.dailymotion.com', favicon: 'https://www.dailymotion.com/favicon.ico', category: 'video' },
  { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', favicon: 'https://www.crunchyroll.com/favicon.ico', category: 'video' },
  { name: 'Peacock', url: 'https://www.peacocktv.com', favicon: 'https://www.peacocktv.com/favicon.ico', category: 'video' },
  { name: 'Paramount+', url: 'https://www.paramountplus.com', favicon: 'https://www.paramountplus.com/favicon.ico', category: 'video' },

  // === SHOPPING & E-COMMERCE ===
  { name: 'Amazon', url: 'https://www.amazon.com', favicon: 'https://www.amazon.com/favicon.ico', category: 'shopping' },
  { name: 'eBay', url: 'https://www.ebay.com', favicon: 'https://www.ebay.com/favicon.ico', category: 'shopping' },
  { name: 'Walmart', url: 'https://www.walmart.com', favicon: 'https://www.walmart.com/favicon.ico', category: 'shopping' },
  { name: 'Target', url: 'https://www.target.com', favicon: 'https://www.target.com/favicon.ico', category: 'shopping' },
  { name: 'Etsy', url: 'https://www.etsy.com', favicon: 'https://www.etsy.com/favicon.ico', category: 'shopping' },
  { name: 'Best Buy', url: 'https://www.bestbuy.com', favicon: 'https://www.bestbuy.com/favicon.ico', category: 'shopping' },
  { name: 'AliExpress', url: 'https://www.aliexpress.com', favicon: 'https://www.aliexpress.com/favicon.ico', category: 'shopping' },
  { name: 'Shopify', url: 'https://www.shopify.com', favicon: 'https://www.shopify.com/favicon.ico', category: 'shopping' },
  { name: 'Wish', url: 'https://www.wish.com', favicon: 'https://www.wish.com/favicon.ico', category: 'shopping' },
  { name: 'Costco', url: 'https://www.costco.com', favicon: 'https://www.costco.com/favicon.ico', category: 'shopping' },
  { name: 'Home Depot', url: 'https://www.homedepot.com', favicon: 'https://www.homedepot.com/favicon.ico', category: 'shopping' },
  { name: 'IKEA', url: 'https://www.ikea.com', favicon: 'https://www.ikea.com/favicon.ico', category: 'shopping' },
  { name: 'Wayfair', url: 'https://www.wayfair.com', favicon: 'https://www.wayfair.com/favicon.ico', category: 'shopping' },
  { name: 'Nike', url: 'https://www.nike.com', favicon: 'https://www.nike.com/favicon.ico', category: 'shopping' },
  { name: 'Adidas', url: 'https://www.adidas.com', favicon: 'https://www.adidas.com/favicon.ico', category: 'shopping' },
  { name: 'Shein', url: 'https://www.shein.com', favicon: 'https://www.shein.com/favicon.ico', category: 'shopping' },
  { name: 'Temu', url: 'https://www.temu.com', favicon: 'https://www.temu.com/favicon.ico', category: 'shopping' },

  // === TECH & DEVELOPER ===
  { name: 'Google', url: 'https://www.google.com', favicon: 'https://www.google.com/favicon.ico', category: 'tech' },
  { name: 'GitHub', url: 'https://github.com', favicon: 'https://github.com/favicon.ico', category: 'tech' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', favicon: 'https://stackoverflow.com/favicon.ico', category: 'tech' },
  { name: 'GitLab', url: 'https://gitlab.com', favicon: 'https://gitlab.com/favicon.ico', category: 'tech' },
  { name: 'Bitbucket', url: 'https://bitbucket.org', favicon: 'https://bitbucket.org/favicon.ico', category: 'tech' },
  { name: 'npm', url: 'https://www.npmjs.com', favicon: 'https://www.npmjs.com/favicon.ico', category: 'tech' },
  { name: 'CodePen', url: 'https://codepen.io', favicon: 'https://codepen.io/favicon.ico', category: 'tech' },
  { name: 'JSFiddle', url: 'https://jsfiddle.net', favicon: 'https://jsfiddle.net/favicon.ico', category: 'tech' },
  { name: 'Replit', url: 'https://replit.com', favicon: 'https://replit.com/favicon.ico', category: 'tech' },
  { name: 'Vercel', url: 'https://vercel.com', favicon: 'https://vercel.com/favicon.ico', category: 'tech' },
  { name: 'Netlify', url: 'https://www.netlify.com', favicon: 'https://www.netlify.com/favicon.ico', category: 'tech' },
  { name: 'AWS', url: 'https://aws.amazon.com', favicon: 'https://aws.amazon.com/favicon.ico', category: 'tech' },
  { name: 'Azure', url: 'https://azure.microsoft.com', favicon: 'https://azure.microsoft.com/favicon.ico', category: 'tech' },
  { name: 'Google Cloud', url: 'https://cloud.google.com', favicon: 'https://cloud.google.com/favicon.ico', category: 'tech' },
  { name: 'DigitalOcean', url: 'https://www.digitalocean.com', favicon: 'https://www.digitalocean.com/favicon.ico', category: 'tech' },
  { name: 'Cloudflare', url: 'https://www.cloudflare.com', favicon: 'https://www.cloudflare.com/favicon.ico', category: 'tech' },
  { name: 'Docker Hub', url: 'https://hub.docker.com', favicon: 'https://hub.docker.com/favicon.ico', category: 'tech' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', favicon: 'https://news.ycombinator.com/favicon.ico', category: 'tech' },
  { name: 'Dev.to', url: 'https://dev.to', favicon: 'https://dev.to/favicon.ico', category: 'tech' },
  { name: 'Medium', url: 'https://medium.com', favicon: 'https://medium.com/favicon.ico', category: 'tech' },
  { name: 'Hashnode', url: 'https://hashnode.com', favicon: 'https://hashnode.com/favicon.ico', category: 'tech' },
  { name: 'Microsoft', url: 'https://www.microsoft.com', favicon: 'https://www.microsoft.com/favicon.ico', category: 'tech' },
  { name: 'Apple', url: 'https://www.apple.com', favicon: 'https://www.apple.com/favicon.ico', category: 'tech' },
  { name: 'Mozilla', url: 'https://www.mozilla.org', favicon: 'https://www.mozilla.org/favicon.ico', category: 'tech' },

  // === NEWS & MEDIA ===
  { name: 'CNN', url: 'https://www.cnn.com', favicon: 'https://www.cnn.com/favicon.ico', category: 'news' },
  { name: 'BBC', url: 'https://www.bbc.com', favicon: 'https://www.bbc.com/favicon.ico', category: 'news' },
  { name: 'New York Times', url: 'https://www.nytimes.com', favicon: 'https://www.nytimes.com/favicon.ico', category: 'news' },
  { name: 'The Guardian', url: 'https://www.theguardian.com', favicon: 'https://www.theguardian.com/favicon.ico', category: 'news' },
  { name: 'Washington Post', url: 'https://www.washingtonpost.com', favicon: 'https://www.washingtonpost.com/favicon.ico', category: 'news' },
  { name: 'Fox News', url: 'https://www.foxnews.com', favicon: 'https://www.foxnews.com/favicon.ico', category: 'news' },
  { name: 'NBC News', url: 'https://www.nbcnews.com', favicon: 'https://www.nbcnews.com/favicon.ico', category: 'news' },
  { name: 'ABC News', url: 'https://abcnews.go.com', favicon: 'https://abcnews.go.com/favicon.ico', category: 'news' },
  { name: 'Reuters', url: 'https://www.reuters.com', favicon: 'https://www.reuters.com/favicon.ico', category: 'news' },
  { name: 'AP News', url: 'https://apnews.com', favicon: 'https://apnews.com/favicon.ico', category: 'news' },
  { name: 'Bloomberg', url: 'https://www.bloomberg.com', favicon: 'https://www.bloomberg.com/favicon.ico', category: 'news' },
  { name: 'Forbes', url: 'https://www.forbes.com', favicon: 'https://www.forbes.com/favicon.ico', category: 'news' },
  { name: 'The Verge', url: 'https://www.theverge.com', favicon: 'https://www.theverge.com/favicon.ico', category: 'news' },
  { name: 'TechCrunch', url: 'https://techcrunch.com', favicon: 'https://techcrunch.com/favicon.ico', category: 'news' },
  { name: 'Wired', url: 'https://www.wired.com', favicon: 'https://www.wired.com/favicon.ico', category: 'news' },
  { name: 'Ars Technica', url: 'https://arstechnica.com', favicon: 'https://arstechnica.com/favicon.ico', category: 'news' },
  { name: 'Engadget', url: 'https://www.engadget.com', favicon: 'https://www.engadget.com/favicon.ico', category: 'news' },
  { name: 'CNET', url: 'https://www.cnet.com', favicon: 'https://www.cnet.com/favicon.ico', category: 'news' },
  { name: 'BuzzFeed', url: 'https://www.buzzfeed.com', favicon: 'https://www.buzzfeed.com/favicon.ico', category: 'news' },
  { name: 'Vice', url: 'https://www.vice.com', favicon: 'https://www.vice.com/favicon.ico', category: 'news' },

  // === FINANCE & BANKING ===
  { name: 'PayPal', url: 'https://www.paypal.com', favicon: 'https://www.paypal.com/favicon.ico', category: 'finance' },
  { name: 'Venmo', url: 'https://venmo.com', favicon: 'https://venmo.com/favicon.ico', category: 'finance' },
  { name: 'Chase', url: 'https://www.chase.com', favicon: 'https://www.chase.com/favicon.ico', category: 'finance' },
  { name: 'Bank of America', url: 'https://www.bankofamerica.com', favicon: 'https://www.bankofamerica.com/favicon.ico', category: 'finance' },
  { name: 'Wells Fargo', url: 'https://www.wellsfargo.com', favicon: 'https://www.wellsfargo.com/favicon.ico', category: 'finance' },
  { name: 'Capital One', url: 'https://www.capitalone.com', favicon: 'https://www.capitalone.com/favicon.ico', category: 'finance' },
  { name: 'Coinbase', url: 'https://www.coinbase.com', favicon: 'https://www.coinbase.com/favicon.ico', category: 'finance' },
  { name: 'Binance', url: 'https://www.binance.com', favicon: 'https://www.binance.com/favicon.ico', category: 'finance' },
  { name: 'Robinhood', url: 'https://robinhood.com', favicon: 'https://robinhood.com/favicon.ico', category: 'finance' },
  { name: 'Fidelity', url: 'https://www.fidelity.com', favicon: 'https://www.fidelity.com/favicon.ico', category: 'finance' },
  { name: 'Charles Schwab', url: 'https://www.schwab.com', favicon: 'https://www.schwab.com/favicon.ico', category: 'finance' },
  { name: 'E*TRADE', url: 'https://www.etrade.com', favicon: 'https://www.etrade.com/favicon.ico', category: 'finance' },
  { name: 'Stripe', url: 'https://stripe.com', favicon: 'https://stripe.com/favicon.ico', category: 'finance' },
  { name: 'Square', url: 'https://squareup.com', favicon: 'https://squareup.com/favicon.ico', category: 'finance' },
  { name: 'Mint', url: 'https://mint.intuit.com', favicon: 'https://mint.intuit.com/favicon.ico', category: 'finance' },
  { name: 'Credit Karma', url: 'https://www.creditkarma.com', favicon: 'https://www.creditkarma.com/favicon.ico', category: 'finance' },

  // === COMMUNICATION & PRODUCTIVITY ===
  { name: 'Discord', url: 'https://discord.com', favicon: 'https://discord.com/favicon.ico', category: 'communication' },
  { name: 'Slack', url: 'https://slack.com', favicon: 'https://slack.com/favicon.ico', category: 'communication' },
  { name: 'Zoom', url: 'https://zoom.us', favicon: 'https://zoom.us/favicon.ico', category: 'communication' },
  { name: 'Microsoft Teams', url: 'https://teams.microsoft.com', favicon: 'https://teams.microsoft.com/favicon.ico', category: 'communication' },
  { name: 'Skype', url: 'https://www.skype.com', favicon: 'https://www.skype.com/favicon.ico', category: 'communication' },
  { name: 'Telegram', url: 'https://telegram.org', favicon: 'https://telegram.org/favicon.ico', category: 'communication' },
  { name: 'WhatsApp', url: 'https://web.whatsapp.com', favicon: 'https://web.whatsapp.com/favicon.ico', category: 'communication' },
  { name: 'Gmail', url: 'https://mail.google.com', favicon: 'https://mail.google.com/favicon.ico', category: 'communication' },
  { name: 'Outlook', url: 'https://outlook.live.com', favicon: 'https://outlook.live.com/favicon.ico', category: 'communication' },
  { name: 'Yahoo Mail', url: 'https://mail.yahoo.com', favicon: 'https://mail.yahoo.com/favicon.ico', category: 'communication' },
  { name: 'ProtonMail', url: 'https://mail.proton.me', favicon: 'https://mail.proton.me/favicon.ico', category: 'communication' },
  { name: 'Notion', url: 'https://www.notion.so', favicon: 'https://www.notion.so/favicon.ico', category: 'communication' },
  { name: 'Trello', url: 'https://trello.com', favicon: 'https://trello.com/favicon.ico', category: 'communication' },
  { name: 'Asana', url: 'https://asana.com', favicon: 'https://asana.com/favicon.ico', category: 'communication' },
  { name: 'Monday.com', url: 'https://monday.com', favicon: 'https://monday.com/favicon.ico', category: 'communication' },
  { name: 'Airtable', url: 'https://airtable.com', favicon: 'https://airtable.com/favicon.ico', category: 'communication' },
  { name: 'Google Drive', url: 'https://drive.google.com', favicon: 'https://drive.google.com/favicon.ico', category: 'communication' },
  { name: 'Dropbox', url: 'https://www.dropbox.com', favicon: 'https://www.dropbox.com/favicon.ico', category: 'communication' },
  { name: 'OneDrive', url: 'https://onedrive.live.com', favicon: 'https://onedrive.live.com/favicon.ico', category: 'communication' },
  { name: 'Google Docs', url: 'https://docs.google.com', favicon: 'https://docs.google.com/favicon.ico', category: 'communication' },

  // === GAMING ===
  { name: 'Steam', url: 'https://store.steampowered.com', favicon: 'https://store.steampowered.com/favicon.ico', category: 'gaming' },
  { name: 'Epic Games', url: 'https://www.epicgames.com', favicon: 'https://www.epicgames.com/favicon.ico', category: 'gaming' },
  { name: 'Xbox', url: 'https://www.xbox.com', favicon: 'https://www.xbox.com/favicon.ico', category: 'gaming' },
  { name: 'PlayStation', url: 'https://www.playstation.com', favicon: 'https://www.playstation.com/favicon.ico', category: 'gaming' },
  { name: 'Nintendo', url: 'https://www.nintendo.com', favicon: 'https://www.nintendo.com/favicon.ico', category: 'gaming' },
  { name: 'Roblox', url: 'https://www.roblox.com', favicon: 'https://www.roblox.com/favicon.ico', category: 'gaming' },
  { name: 'EA', url: 'https://www.ea.com', favicon: 'https://www.ea.com/favicon.ico', category: 'gaming' },
  { name: 'Ubisoft', url: 'https://www.ubisoft.com', favicon: 'https://www.ubisoft.com/favicon.ico', category: 'gaming' },
  { name: 'Battle.net', url: 'https://www.battle.net', favicon: 'https://www.battle.net/favicon.ico', category: 'gaming' },
  { name: 'GOG', url: 'https://www.gog.com', favicon: 'https://www.gog.com/favicon.ico', category: 'gaming' },
  { name: 'IGN', url: 'https://www.ign.com', favicon: 'https://www.ign.com/favicon.ico', category: 'gaming' },
  { name: 'GameSpot', url: 'https://www.gamespot.com', favicon: 'https://www.gamespot.com/favicon.ico', category: 'gaming' },
  { name: 'Polygon', url: 'https://www.polygon.com', favicon: 'https://www.polygon.com/favicon.ico', category: 'gaming' },
  { name: 'Kotaku', url: 'https://kotaku.com', favicon: 'https://kotaku.com/favicon.ico', category: 'gaming' },

  // === REFERENCE & EDUCATION ===
  { name: 'Wikipedia', url: 'https://en.wikipedia.org', favicon: 'https://en.wikipedia.org/favicon.ico', category: 'reference' },
  { name: 'Khan Academy', url: 'https://www.khanacademy.org', favicon: 'https://www.khanacademy.org/favicon.ico', category: 'reference' },
  { name: 'Coursera', url: 'https://www.coursera.org', favicon: 'https://www.coursera.org/favicon.ico', category: 'reference' },
  { name: 'Udemy', url: 'https://www.udemy.com', favicon: 'https://www.udemy.com/favicon.ico', category: 'reference' },
  { name: 'edX', url: 'https://www.edx.org', favicon: 'https://www.edx.org/favicon.ico', category: 'reference' },
  { name: 'Duolingo', url: 'https://www.duolingo.com', favicon: 'https://www.duolingo.com/favicon.ico', category: 'reference' },
  { name: 'Quizlet', url: 'https://quizlet.com', favicon: 'https://quizlet.com/favicon.ico', category: 'reference' },
  { name: 'Chegg', url: 'https://www.chegg.com', favicon: 'https://www.chegg.com/favicon.ico', category: 'reference' },
  { name: 'W3Schools', url: 'https://www.w3schools.com', favicon: 'https://www.w3schools.com/favicon.ico', category: 'reference' },
  { name: 'MDN', url: 'https://developer.mozilla.org', favicon: 'https://developer.mozilla.org/favicon.ico', category: 'reference' },
  { name: 'FreeCodeCamp', url: 'https://www.freecodecamp.org', favicon: 'https://www.freecodecamp.org/favicon.ico', category: 'reference' },
  { name: 'Codecademy', url: 'https://www.codecademy.com', favicon: 'https://www.codecademy.com/favicon.ico', category: 'reference' },
  { name: 'LeetCode', url: 'https://leetcode.com', favicon: 'https://leetcode.com/favicon.ico', category: 'reference' },
  { name: 'HackerRank', url: 'https://www.hackerrank.com', favicon: 'https://www.hackerrank.com/favicon.ico', category: 'reference' },

  // === TRAVEL & FOOD ===
  { name: 'Airbnb', url: 'https://www.airbnb.com', favicon: 'https://www.airbnb.com/favicon.ico', category: 'travel' },
  { name: 'Booking.com', url: 'https://www.booking.com', favicon: 'https://www.booking.com/favicon.ico', category: 'travel' },
  { name: 'Expedia', url: 'https://www.expedia.com', favicon: 'https://www.expedia.com/favicon.ico', category: 'travel' },
  { name: 'TripAdvisor', url: 'https://www.tripadvisor.com', favicon: 'https://www.tripadvisor.com/favicon.ico', category: 'travel' },
  { name: 'Google Maps', url: 'https://maps.google.com', favicon: 'https://maps.google.com/favicon.ico', category: 'travel' },
  { name: 'Uber', url: 'https://www.uber.com', favicon: 'https://www.uber.com/favicon.ico', category: 'travel' },
  { name: 'Lyft', url: 'https://www.lyft.com', favicon: 'https://www.lyft.com/favicon.ico', category: 'travel' },
  { name: 'DoorDash', url: 'https://www.doordash.com', favicon: 'https://www.doordash.com/favicon.ico', category: 'travel' },
  { name: 'Uber Eats', url: 'https://www.ubereats.com', favicon: 'https://www.ubereats.com/favicon.ico', category: 'travel' },
  { name: 'Grubhub', url: 'https://www.grubhub.com', favicon: 'https://www.grubhub.com/favicon.ico', category: 'travel' },
  { name: 'Yelp', url: 'https://www.yelp.com', favicon: 'https://www.yelp.com/favicon.ico', category: 'travel' },

  // === ADULT CONTENT (18+) ===
  { name: 'Pornhub', url: 'https://www.pornhub.com', favicon: 'https://www.pornhub.com/favicon.ico', category: 'adult' },
  { name: 'XVideos', url: 'https://www.xvideos.com', favicon: 'https://www.xvideos.com/favicon.ico', category: 'adult' },
  { name: 'OnlyFans', url: 'https://onlyfans.com', favicon: 'https://onlyfans.com/favicon.ico', category: 'adult' },
  { name: 'Xhamster', url: 'https://xhamster.com', favicon: 'https://xhamster.com/favicon.ico', category: 'adult' },
  { name: 'RedTube', url: 'https://www.redtube.com', favicon: 'https://www.redtube.com/favicon.ico', category: 'adult' },

  // === OTHER POPULAR ===
  { name: 'ChatGPT', url: 'https://chat.openai.com', favicon: 'https://chat.openai.com/favicon.ico', category: 'ai' },
  { name: 'Claude', url: 'https://claude.ai', favicon: 'https://claude.ai/favicon.ico', category: 'ai' },
  { name: 'Bing', url: 'https://www.bing.com', favicon: 'https://www.bing.com/favicon.ico', category: 'search' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com', favicon: 'https://duckduckgo.com/favicon.ico', category: 'search' },
  { name: 'Yahoo', url: 'https://www.yahoo.com', favicon: 'https://www.yahoo.com/favicon.ico', category: 'search' },
  { name: 'Craigslist', url: 'https://www.craigslist.org', favicon: 'https://www.craigslist.org/favicon.ico', category: 'other' },
  { name: 'Weather.com', url: 'https://weather.com', favicon: 'https://weather.com/favicon.ico', category: 'other' },
  { name: 'IMDb', url: 'https://www.imdb.com', favicon: 'https://www.imdb.com/favicon.ico', category: 'other' },
  { name: 'Rotten Tomatoes', url: 'https://www.rottentomatoes.com', favicon: 'https://www.rottentomatoes.com/favicon.ico', category: 'other' },
  { name: 'Imgur', url: 'https://imgur.com', favicon: 'https://imgur.com/favicon.ico', category: 'other' },
  { name: 'Giphy', url: 'https://giphy.com', favicon: 'https://giphy.com/favicon.ico', category: 'other' },
  { name: 'Canva', url: 'https://www.canva.com', favicon: 'https://www.canva.com/favicon.ico', category: 'other' },
  { name: 'Figma', url: 'https://www.figma.com', favicon: 'https://www.figma.com/favicon.ico', category: 'other' },
  { name: 'Adobe', url: 'https://www.adobe.com', favicon: 'https://www.adobe.com/favicon.ico', category: 'other' },
  { name: 'Zoom', url: 'https://zoom.us', favicon: 'https://zoom.us/favicon.ico', category: 'other' },
]

// Threshold for considering a resource "cached" (milliseconds)
const CACHE_THRESHOLD = 50

/**
 * Technique 1: Favicon Cache Timing
 *
 * Measures how long it takes to load a favicon.
 * Cached favicons load significantly faster than uncached ones.
 */
async function probeFaviconCache(site) {
  return new Promise((resolve) => {
    const img = new Image()
    const startTime = performance.now()

    // Add cache-busting query param to force network check
    // but the browser's cache will still be consulted first
    const testUrl = `${site.favicon}?_t=${Date.now()}`

    const cleanup = () => {
      img.onload = null
      img.onerror = null
    }

    img.onload = () => {
      const loadTime = performance.now() - startTime
      cleanup()
      resolve({
        site: site.name,
        url: site.url,
        method: 'favicon_cache',
        loadTime,
        probablyVisited: loadTime < CACHE_THRESHOLD,
        confidence: loadTime < CACHE_THRESHOLD ? 'medium' : 'low',
      })
    }

    img.onerror = () => {
      const loadTime = performance.now() - startTime
      cleanup()
      resolve({
        site: site.name,
        url: site.url,
        method: 'favicon_cache',
        loadTime,
        probablyVisited: false,
        confidence: 'low',
        error: true,
      })
    }

    // Timeout after 5 seconds
    setTimeout(() => {
      cleanup()
      resolve({
        site: site.name,
        url: site.url,
        method: 'favicon_cache',
        loadTime: 5000,
        probablyVisited: false,
        confidence: 'low',
        timeout: true,
      })
    }, 5000)

    img.src = testUrl
  })
}

/**
 * Technique 2: CSS :visited Timing Attack
 *
 * Modern browsers prevent reading computed styles of :visited links,
 * but there can still be timing differences in how the browser
 * processes visited vs unvisited links.
 *
 * This technique creates hidden links and measures rendering time.
 */
async function probeVisitedLinks(sites) {
  return new Promise((resolve) => {
    // Create a hidden container
    const container = document.createElement('div')
    container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;'
    document.body.appendChild(container)

    // Create links for each site
    const links = sites.map(site => {
      const link = document.createElement('a')
      link.href = site.url
      link.textContent = site.name
      container.appendChild(link)
      return { link, site }
    })

    // Force a layout
    void container.offsetHeight

    // Measure time to compute styles
    const results = links.map(({ link, site }) => {
      const startTime = performance.now()
      // Force style computation
      void getComputedStyle(link).color
      const computeTime = performance.now() - startTime

      return {
        site: site.name,
        url: site.url,
        method: 'visited_timing',
        computeTime,
        // Very low confidence - this technique is heavily mitigated
        probablyVisited: false,
        confidence: 'very_low',
      }
    })

    // Cleanup
    document.body.removeChild(container)

    resolve(results)
  })
}

/**
 * Technique 3: HSTS Redirect Timing
 *
 * If a site uses HSTS and you've visited it, HTTP requests
 * get redirected to HTTPS internally (307 Internal Redirect).
 * This is slightly faster than a server redirect.
 *
 * Note: This can only detect HSTS for sites you've actually visited,
 * not sites in the preload list.
 */
async function probeHSTS(site) {
  // Only works for HTTPS sites, probe HTTP version
  const httpUrl = site.url.replace('https://', 'http://')

  return new Promise((resolve) => {
    const startTime = performance.now()

    // Use fetch with mode: 'no-cors' to avoid CORS issues
    // We only care about timing, not the response
    fetch(httpUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    })
      .then(() => {
        const loadTime = performance.now() - startTime
        resolve({
          site: site.name,
          url: site.url,
          method: 'hsts_timing',
          loadTime,
          // Internal redirects are typically < 10ms
          probablyVisited: loadTime < 20,
          confidence: 'low',
        })
      })
      .catch(() => {
        resolve({
          site: site.name,
          url: site.url,
          method: 'hsts_timing',
          loadTime: null,
          probablyVisited: false,
          confidence: 'low',
          error: true,
        })
      })

    // Timeout
    setTimeout(() => {
      resolve({
        site: site.name,
        url: site.url,
        method: 'hsts_timing',
        loadTime: null,
        probablyVisited: false,
        confidence: 'low',
        timeout: true,
      })
    }, 5000)
  })
}

/**
 * Main hook for history probing
 * Auto-runs on mount when autoRun is true (default)
 */
export function useHistoryProbe(autoRun = true) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [probeMethod, setProbeMethod] = useState('favicon')
  const hasRun = useRef(false)

  const runProbe = useCallback(async (method = 'favicon') => {
    setLoading(true)
    setProbeMethod(method)
    setProgress(0)

    try {
      let probeResults = []
      const totalSites = PROBE_SITES.length

      if (method === 'favicon' || method === 'all') {
        // Run favicon probes with progress tracking
        // Use batch processing for faster results
        const batchSize = 10
        for (let i = 0; i < PROBE_SITES.length; i += batchSize) {
          const batch = PROBE_SITES.slice(i, i + batchSize)
          const batchPromises = batch.map(site => probeFaviconCache(site))
          const batchResults = await Promise.all(batchPromises)
          probeResults = probeResults.concat(batchResults)
          setProgress(Math.round((probeResults.length / totalSites) * 100))
          // Small delay between batches
          await new Promise(r => setTimeout(r, 50))
        }
      }

      if (method === 'visited' || method === 'all') {
        const visitedResults = await probeVisitedLinks(PROBE_SITES)
        probeResults = probeResults.concat(visitedResults)
      }

      if (method === 'hsts' || method === 'all') {
        for (const site of PROBE_SITES.slice(0, 10)) {
          const result = await probeHSTS(site)
          probeResults.push(result)
          await new Promise(r => setTimeout(r, 100))
        }
      }

      // Sort results: detected first, then by load time
      probeResults.sort((a, b) => {
        if (a.probablyVisited && !b.probablyVisited) return -1
        if (!a.probablyVisited && b.probablyVisited) return 1
        return (a.loadTime || 9999) - (b.loadTime || 9999)
      })

      setResults(probeResults)
      setProgress(100)
    } catch (error) {
      console.error('History probe error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-run on mount
  useEffect(() => {
    if (autoRun && !hasRun.current) {
      hasRun.current = true
      runProbe('favicon')
    }
  }, [autoRun, runProbe])

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    const category = result.category || 'other'
    if (!acc[category]) {
      acc[category] = { total: 0, detected: 0, sites: [] }
    }
    acc[category].total++
    if (result.probablyVisited) {
      acc[category].detected++
    }
    acc[category].sites.push(result)
    return acc
  }, {})

  // Get summary of results
  const summary = {
    total: PROBE_SITES.length,
    tested: results.length,
    probablyVisited: results.filter(r => r.probablyVisited).length,
    sites: results
      .filter(r => r.probablyVisited)
      .map(r => r.site),
    byCategory: groupedResults,
  }

  return {
    results,
    summary,
    loading,
    progress,
    probeMethod,
    runProbe,
    probeSites: PROBE_SITES,
  }
}
