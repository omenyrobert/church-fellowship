import { Router } from "express";
import { handleGetAllUsers, handleLogin, handleGetAuthUser } from "../Controllers/UsersController";
import { JWTAuthMiddleWare } from "../Middlewares/AuthMiddleware";
import multer from "multer";

const storage = multer.diskStorage({
  destination: "useruploads/",
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

const profilePictureUpload = upload.single("photo");

export default (router: Router) => {
  const usersPrefix = "/users";
  router.get(`${usersPrefix}`, handleGetAllUsers);
  router.post(`${usersPrefix}/login`, handleLogin)
  router.get(`${usersPrefix}/auth`, JWTAuthMiddleWare, handleGetAuthUser)
};
