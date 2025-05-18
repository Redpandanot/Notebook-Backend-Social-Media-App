## authRouter

    - POST /signup
    - POST /login
    - POST /logout

## profileRouter

    - GET /profile/view
    - PATCH /profile/edit
    - PATCH /profile/password

## connectionRouter

    - POST /friend-request/send/:status/:userId    //either connect or follow
    - POST /friend-request/review/:status/:requestId //accept or reject
    - POST /follow/:userId //api to follow someone
    - POST /unfollow/:userId //api to unfollow someone
