"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.createProfile = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            code: "UNAUTHORIZED",
            message: "Authentication required.",
        });
        return;
    }
    const { image, about } = req.body;
    if (!image) {
        res.status(400).json({
            success: false,
            code: "VALIDATION_ERROR",
            message: "Profile image is required.",
        });
        return;
    }
    try {
        const user = yield prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        if (!user) {
            res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
                message: "User not found.",
            });
            return;
        }
        let profile;
        if (user.profile) {
            profile = yield prisma.profile.update({
                where: { id: user.profile.id },
                data: { image, about },
            });
            res.status(200).json({
                success: true,
                code: "PROFILE_UPDATED",
                message: "Profile updated successfully.",
                data: profile,
            });
        }
        else {
            profile = yield prisma.profile.create({
                data: {
                    image,
                    about: about || "",
                    userId,
                },
            });
            res.status(201).json({
                success: true,
                code: "PROFILE_CREATED",
                message: "Profile created successfully.",
                data: profile,
            });
        }
    }
    catch (error) {
        console.error("Error creating/updating profile:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error",
        });
    }
});
exports.createProfile = createProfile;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({
            success: false,
            code: "UNAUTHORIZED",
            message: "Authentication required.",
        });
        return;
    }
    const { name, image, about } = req.body;
    try {
        const user = yield prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        if (!user) {
            res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
                message: "User not found.",
            });
            return;
        }
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            let updatedUser = user;
            if (name) {
                updatedUser = yield tx.user.update({
                    where: { id: userId },
                    data: { name },
                    include: { profile: true }, // ✅ ensure profile is included
                });
            }
            let profile = user.profile;
            if ((image || about !== undefined) && profile) {
                profile = yield tx.profile.update({
                    where: { id: profile.id },
                    data: Object.assign(Object.assign({}, (image && { image })), (about !== undefined && { about })),
                });
            }
            else if (image || about !== undefined) {
                profile = yield tx.profile.create({
                    data: {
                        image: image || "",
                        about: about || "",
                        userId,
                    },
                });
            }
            return { user: updatedUser, profile };
        }));
        const _a = result.user, { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
        res.status(200).json({
            success: true,
            code: "PROFILE_UPDATED",
            message: "Profile updated successfully.",
            data: Object.assign(Object.assign({}, userWithoutPassword), { profile: result.profile }),
        });
    }
    catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({
            success: false,
            code: "SERVER_ERROR",
            message: "Internal server error",
        });
    }
});
exports.updateProfile = updateProfile;
