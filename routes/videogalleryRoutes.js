import express from "express";

import {
getVideos,
getVideoById,
getRelatedVideos,
createVideo,
updateVideo,
deleteVideo,

} from "../controllers/videogalleryController.js";


const router = express.Router();


// get all videos
router.get("/videos", getVideos);


// IMPORTANT: related route upar rakho
router.get(
"/videos/related/:id",
getRelatedVideos
);


// single video
router.get(
"/videos/:id",
getVideoById
);


// create
router.post(
"/videos",
createVideo
);


// update
router.put(
"/videos/:id",
updateVideo
);


// delete
router.delete(
"/videos/:id",
deleteVideo
);



export default router;