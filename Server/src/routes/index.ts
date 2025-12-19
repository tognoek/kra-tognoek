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

export const router = Router();

router.use("/health", health);
router.use("/auth", auth);
router.use("/roles", roles);
router.use("/users", users);
router.use("/topics", topics);
router.use("/problems", problems);
router.use("/comments", comments);
router.use("/contests", contests);
router.use("/submissions", submissions);
router.use("/languages", languages);
router.use("/admin", admin);

