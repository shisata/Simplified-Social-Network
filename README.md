## Implementation
Front-End Server: nginx
Back-End Server: NodeJS
Database: MongoDB
## What is this project about?
A simplified social network webapp. It lets users connect with each other, make new friends, share moments through posts, and chat.

## Features:

1.Registration
To use our website, you must first register an account. You will only need an email, password, first and last name to make the account.

2.Navagation:
At the top of each page is a navagation menu that allows you convinent access to everywhere on the site.

2.Home Page:
On the home page when you first log in, 'My Feed' is where you can see all the post shared publicly and by your friends.
Here, you can interact with posts by commenting or liking them. You can also see the number of likes and comments other people have left.
At the bottom of the page, there is a list of all users available to add friends

3.Profile Page:
Here you can create new posts and see all the posts that you have created. When creating a post, you can specify a title, body, and provide a privacy setting to allow only those you wish to see it.

4.Chat
On the right hand side is a chat menu. All your friends are listed on the chat and you can click anyone of them to begin chatting. A chat page will open showing your recent chat history with the friend and a textbox to send new messages. This will be updated in real time

5.Friends
This is the page where you can send friend requests. Friend requests are sent by inputting their email. Friends allow you access to chat with them and see their friend-only posts. The friend requested must accept the request before you can be friends with them. There is also a friend list below the page where you can remove any friend you want.


<more description>

## Sample user
You can use a preset user with:
email:diobrando@diobrando.wry
password:diobrando


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
  <!-- - Server files: `models/` -->
  - Database: MongoDB
  
## Citation
This project base is modified from an existing tutorial/template code
```
Tutorial: https://youtu.be/hP77Rua1E0c
Code: https://github.com/bradtraversy/docker-node-mongo
```

##
