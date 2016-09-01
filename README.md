# Manifeste(s)

a very simple github hosted page to display content within sections

all the code is ready to be put on a FTP server, or served through github gh-pages (like here)

you can consult it offline ☀♥😃


- all contents are set in the `data` folder, using yaml documents containing markdown
    + meta (menu, tags, tooltips) in `data/meta.yml`
    + text sections in `data/sections.yml`
    + tagged links in `data/links.yml`
    + quotes in `data/quotes.yml`
    + map sources in `data/map.yml`
    + images within the `data/media` folder

fork or download this project and start your own !

## Goals

- faciliter l'écriture et la lecture collective.
- minimiser le temps passé face à l'écran
- code minimal
- bonne humeur

## Build locally

### Fetch and install dependencies
> git clone https://github.com/manifestes/manifestes.git
> 
> npm install
> 
> bower install

### build & minify
> grunt

### fetch map geojson
> grunt map

### build slug images
> node slug_build.js

will produce index.html and preview .png used to share text sections
warning: needs to have a running local web server

## Licenses

- GNU GENERAL PUBLIC LICENSE Version 2
- Creative Commons
- Move Commons




