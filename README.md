# Manifeste(s)

a 💨 simple website to display contents within ◉ sections, and change the world

- ☀ as less code as possible
- ♥ easily read contents and collaborate
- 😃 minify time spent on your computer
- 🌀 can be consulted offline 
- ➡ ready to be put on a FTP server
- 💿 can be served through github gh-pages (like here)
- 💬 all contents are set in the `data` folder, using yaml documents containing markdown
    + meta (menu, tags, tooltips) in `data/meta.yml`
    + text sections in `data/sections.yml`
    + tagged links in `data/links.yml`
    + quotes in `data/quotes.yml`
    + map sources in `data/map.yml`
    + images in the `data/media` folder (prefixed by "-" if unused yet)
    + misc documents in the `data/files` folder

for more information (french), browse [http://utopies-concretes.org](http://utopies-concretes.org)

fork or download this project and start your own !

## Build locally

### Fetch and install dependencies
> git clone https://github.com/manifestes/manifestes.git
> 
> npm install
> 
> bower install

### build & minify
> grunt

### build catalog (in progress)
> node prepair_catalog.js

to merge all data (texts, links, etc..) into `catalog.yml` to spare time on load

### fetch map geojson
> grunt map

### build slug images
> node slug_build.js

will produce index.html and preview .png used to social-share text sections
warning: needs to have a running local web server

> node slug_build.js abcd

will only (re) produce the text sections whose slug starts with «abcd» (useful to avoid doing them all for each change)

### build ninja links
> node prepair_hyperlinks_counts.js

- aka will load `http://localhost/manifestes/data/network/network_links.csv` (make sure you have this repo available on a local webserver)
- will compute *Source, Target, HyperlinkCount* columns and produce, for each {{ID}} entity:
    - `data/network/links/{{ID}}_in.csv`
    - `data/network/links/{{ID}}_out.csv`
- ... containing list of *id,count* links


## How to DIY the .gexf network of websites
### with Hyphe
- select & crawl friendly WEs
- export (in) WEs list `new_network_in.csv` & network `new_network.gexf`

### with GoogleRefine `new_network_in.csv`
- **clean (sort, simplify) the ≠ WEs startpages**
    + facet only empty & manually set them: `cells['PREFIXES'].value.split(' ')[-1].replace("www.","")`
    + custom numeric facet by: `value.split(" ").length()` & only work on > 2
    + flatten: `value.replace("blogspot.fr","blogspot.com").replace("https://","http://").replace("//www.","//").replace(/\/$/,"").replace(/\/ /," ")`
    + deduplicate: (Jython expression)
        ```
        deduped_list = list(set(value.split(" ")))
        return ' '.join(map(str, deduped_list))
        ```
    + sort to put shorter url first (Jython expression)
        ```
        deduped_list = list(set(value.split(" ")))
        return ' '.join(sorted(deduped_list, key=len))
        ```
    + rename columns *StartPages > Urls, ID > Id*
    + delete column *NAME*

- **fetch previous WEs Tags**
    + open previous `data/network/network_in.csv` as other GoogleRefine project
    + on `new_network_in.csv` : add new column based on Id column (with no facet! GREL language) `cell.cross("network_in.csv", "Id")[0].cells["Tags"].value`
    + Verify tags column is well filled, eventually add new tags on WEs

- **Export as `temp/network_in.csv`**

### with Gephi = Produce final graph `network.gexf`
- open `new_network.gexf`
- spatialize with ForceAtlas2: scale 2.5, stronger gravity 0.3
- calculate modularity & degree
- in the data lab: 
    + import `temp/network_in.csv` to add *Tags,Urls* columns
    + export tables with columns:
        * nodes: `temp/network_in.csv` *Id,ModularityClass,Degree,OutDegree,InDegree,Tags,Urls*
        * edges: `temp/network_links.csv` *Source,Target,HyperlinkCount*
- scale size by *Hyphe Indegree*: 0.7 - 10

### with GoogleRefine `temp/network_in.csv`
- simplify & label *ModularityClass*:
    + facet by *ModularityClass*
    + rename as A-F (6 biggest communities) & NC (what's left)
    + sort rows (permanently!) by *Degree* (to have biggest WEs first)
- save again as `temp/network_in.csv`

### back to Gephi
- kill nodes column *Modularity* and import the new one from `network_in.csv`
- color by *Modularity*: Generate ColorPalette "pimp"
- remove unused columns to lower file size
    + nodes: only *Id, Label, Urls, Tags*
    + edges: remove all you can
- export graph as `temp/network.gexf`

### commit changes online
- replace `temp/` files you produced:
    + `data/network/network.gexf`
    + `data/network/network_in.csv`
    + `data/network/network_links.csv`
- update `data/meta_fr.yml` information keys:
    + network.loading (size)
    + network.credits (date updated)


## Licenses

- Please ask for anything
- Love
- Tranquilo
- GNU GENERAL PUBLIC LICENSE Version 2
- Creative Commons
- Move Commons

■ □ ▢ ▣ ▤ ▥ ▦ ▧ ▨ ▩ ▪ ▫ ▬ ▭ ▮ ▯ ▰ ▱ ▲ △ ▴ ▵ ▶ ▷ ▸ ▹ ► ▻ ▼ ▽ ▾ ▿ ◀ ◁ ◂ ◃ ◄ ◅ ◆ ◇ ◈ ◉ ◊ ○ ◌ ◍ ◎ ● ◐ ◑ ◒ ◓ ◔ ◕ ◖ ◗ ◘ ◙ ◚ ◛ ◜ ◝ ◞ ◟ ◠ ◡ ◢ ◣ ◤ ◥ ◦ ◧ ◨ ◩ ◪ ◫ ◬ ◭ ◮ ◯ ✁ ✂ ✃ ✄ ✆ ✇ ✈ ✉ ✌ ✍ ✎ ✏ ✐ ✑ ✒ ✓ ✔ ✕ ✖ ✗ ✘ ✙ ✚ ✛ ✜ ✝ ✞ ✟ ✠ ✡ ✢ ✣ ✤ ✥ ✦ ✧ ✩ ✪ ✫ ✬ ✭ ✮ ✯ ✰ ✱ ✲ ✳ ✴ ✵ ✶ ✷ ✸ ✹ ✺ ✻ ✼ ✽ ✾ ✿ ❀ ❁ ❂ ❃ ❄ ❅ ❆ ❇ ❈ ❉ ❊ ❋ ❍ ❏ ❐ ❑ ❒ ❖ ❘ ❙ ❚ ❛ ❜ ❝ ❞ ❡ ❢ ❣ ❤ ❥ ❦ ❧ ❶ ❷ ❸ ❹ ❺ ❻ ❼ ❽ ❾ ❿ ➀ ➁ ➂ ➃ ➄ ➅ ➆ ➇ ➈ ➉ ➊ ➋ ➌ ➍ ➎ ➏ ➐ ➑ ➒ ➓ ➘ ➙ ➚ ➛ ➜ ➝ ➞ ➟ ➠ ➡ ➢ ➣ ➤ ➥ ➦ ➧ ➨ ➩ ➪ ➫ ➬ ➭ ➮ ➯ ➲ ➳ ➴ ➵ ➶ ➷ ➸ ➹ ➺ ➻ ➼ ➽ ➾ ☀ ☁ ☂ ☃ ☄ ★ ☆ ☇ ☈ ☉ ☊ ☋ ☌ ☍ ☎ ☏ ☐ ☑ ☒ ☓ ☖ ☗ ☚ ☛ ☜ ☝ ☞ ☟ ☠ ☡ ☢ ☣ ☤ ☥ ☦ ☧ ☨ ☩ ☪ ☫ ☬ ☭ ☮ ☯ ☰ ☱ ☲ ☳ ☴ ☵ ☶ ☷ ☸ ☹ ☺ ☻ ☼ ☽ ☾ ☿ ♀ ♁ ♂ ♃ ♄ ♅ ♆ ♇ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ♔ ♕ ♖ ♗ ♘ ♙ ♚ ♛ ♜ ♝ ♞ ♟ ♠ ♡ ♢ ♣ ♤ ♥ ♦ ♧ ♨ ♩ ♪ ♫ ♬ ♭ ♮ ♯ ♰ ♱
☆*:｡゜ﾟ･*ヽ
(^ᴗ^)ﾉ*･゜ﾟ｡:*☆ ¯\_(ツ)_/¯
(ಠ益ಠ)(ಥ‿ಥ)(ʘ‿ʘ)ლ(ಠ_ಠლ)
( ͡° ͜ʖ ͡°)ヽ(ﾟДﾟ)ﾉʕ•̫͡•ʔᶘ ᵒᴥᵒᶅ(=^ ^=)oO

☀♥😃

chercher c'est ringard
l'internet c'est pour regarder des trucs
les gros médias nous emmerdent
3615 internet pour les ninjas
retour à la case cerveau
pour trouver de l'info d'la vraie
3615 gratuit à la minute
Google, Facebook, Twitter et les autres trucs, c'est pas bien
le hasard, c'est politique
plus c'est petit, plus c'est mieux
perdre du temps, c'est maintenant utile
ta nouvelle page d'accueil, c'est 3615 Ninja
pas besoin de chercher, 3615 Ninja trouve pour toi
l'internet c'est plus ce que c'était. retour au 3615 Ninja
3615 Ninja t'aide a trouver
sort des flux, tape toi un 3615 Ninja
marre de perde du temps inutile ?
seul le hasard fait bien les choses

