const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/requireAuth')
const { handleUploadPhoto } = require('../middleware/handleUpload')

const { 
    user_signin_post,
    user_signup_post,
    user_profile_get,
    user_match_get,
    update_all_users,
    user_upload_photo_patch
} = require('../controllers/userControllers')

router.get("/", requireAuth, user_profile_get)

router.patch("/match_popularity", update_all_users) // cron job

router.get("/match", requireAuth, user_match_get)

router.post("/upload_photo", requireAuth, handleUploadPhoto, user_upload_photo_patch)

router.post("/signin", user_signin_post)

router.post("/signup", user_signup_post)

module.exports = router