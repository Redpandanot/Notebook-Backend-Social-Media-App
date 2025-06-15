📡 API Documentation
Welcome to the API documentation for our platform. Below is a list of all available endpoints, grouped by router.



<details> <summary>🛡️ <strong>Auth Router</strong></summary>
POST /auth/signup – Register a new user

POST /auth/login – Log in a user

GET /auth/logout – Log out the current user

</details>
<details> <summary>👤 <strong>Profile Router</strong></summary>
GET /profile/view – View profile information

PATCH /profile/edit – Edit profile details

PATCH /profile/password – Change user password

</details>
<details> <summary>🔗 <strong>Connection Router</strong></summary>
POST /connections/friend-request/send/:status/:userId
Send a friend request (status must be requested)

POST /connections/friend-requests/review/:status/:requestId
Review a request (status can be accepted or rejected)

POST /connections/follow/:userId – Follow a user

POST /connections/unfollow/:userId – Unfollow a user

GET /connections/friend-requests/view – View incoming friend requests

GET /connections/friends-list – Get list of friends

GET /connections/new-friends – Discover new friends

POST /connections/unFriend/:friendId – Unfriend a user

</details>
<details> <summary>💬 <strong>Discussion Router</strong></summary>
GET /discussions/discussion/:postId – Get discussions on a post

</details>
<details> <summary>👥 <strong>Follow Router</strong></summary>
GET /follows/followers/:userId – Get list of followers

GET /follows/following/:userId – Get list of following users

</details>
<details> <summary>🏘️ <strong>Group Router</strong></summary>
POST /groups/group/create – Create a new group

POST /groups/group/joinRequest/:groupId – Request to join a group

POST /groups/group/addModerator/:groupId/:newMemberId – Promote a member to moderator

POST /groups/group/removeModerator/:groupId/:moderatorId – Remove a moderator

POST /groups/group/removeMember/:groupId/:memberId – Remove a group member

</details>
<details> <summary>📝 <strong>Posts Router</strong></summary>
POST /posts/post/create – Create a new post

POST /posts/posts/group/create/:groupId – Create a post in a group

GET /posts/posts/view – View all posts

GET /posts/posts/view/:userId – View posts by user

GET /posts/posts/feed – View personalized feed

GET /posts/post/view/:postId – View a single post

POST /posts/posts/like/:postId – Like a post

POST /posts/posts/comment/:postId – Comment on a post

</details>


📝 Note : 
Feel free to fork this project and open issues or pull requests with suggestions or improvements. I welcome contributions!
