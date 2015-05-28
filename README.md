# Manifeste(s)
a very simple github hosted page to display content within sections

- contents & medias are set within the `data` folder
    - text sections are yaml documents containing markdown `contents.yml`
    - images are stored within the `media` folder

start building your own !

## Goals

- faciliter l'écriture et la lecture collective.
- minimiser le temps passé face à l'écran
- code minimal

## Build locally

> git clone https://github.com/manifestes/manifestes.git

> npm install

> bower install

> grunt

## License
GNU GENERAL PUBLIC LICENSE Version 2

## Changelog
- citations aussi visibles en version mobile
- intro page with simple text from meta
- ng-touch + fastclick
- date de la dernière modification avec lien github
- liens tout en bas de la page

## To do ?
- infinite digest loop (see html directive)
- bouton *en savoir plus* pour ne pas afficher tous les liens/références d'un coup ?
- améliorer expand/collapse des sections (icône plus explicite ?)
- ajuster la couleur des sections (à la main ou selon les images)

## Ideas ?
pour éviter la rigidité: section / liens associés, distinguer:

- sections (comme actuellemt), avec ≠ #tags: 'sections.yml'
- base en vrac des liens/références/phrases avec #tags: 'links.yml'

les parties pratiques s'afficheraientt ainsi dynamiquement à la fin de chaque section en fonction des #tags

