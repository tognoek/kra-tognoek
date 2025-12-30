import { Router } from "express";
import roles from "./roles";
import users from "./users";
import topics from "./topics";
import problems from "./problems";
import comments from "./comments";
import contests from "./contests";
import submissions from "./submissions";
import languages from "./languages";
import health from "./health";
import auth from "./auth";
import admin from "./admin";
import upload from "./upload";
import rank from "./rank"
import posts from "./posts"
import creatorC from "./creatorContest";
import creatorP from "./creatorProblem";
import home from "./home";

export const router = Router();

router.get("/", (req, res) => {
  res.send("Hi! Kra-tognoek Server API is running.");
});

router.use("/health", health);
router.use("/auth", auth);
router.use("/roles", roles);
router.use("/users", users);
router.use("/topics", topics);
router.use("/problems", problems);
router.use("/comments", comments);
router.use("/contests", contests);
router.use("/ranks", rank);
router.use("/submissions", submissions);
router.use("/languages", languages);
router.use("/admin", admin);
router.use("/posts", posts);
router.use("/creator_contest", creatorC);
router.use("/creator_problem", creatorP);
router.use("/upload", upload);
router.use("/home", home);

