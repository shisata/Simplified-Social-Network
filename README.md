## What is this project about?
A simplified social network webapp
<more description>

## How to run
```
docker-compose build && docker-compose up
```

The web can be accessed through `localhost:8080`

## Clean containers
```
docker-compose down && docker system prune -f
```

## Folder Structure
  - Static files: `views/`
  - Server files: `models/`
  - Database: MongoDB
  
## Citation
```
This project base is modified from an existing tutorial/template code
Tutorial: https://youtu.be/hP77Rua1E0c
Code: https://github.com/bradtraversy/docker-node-mongo
```
