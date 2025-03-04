import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = parseInt(req.params.id); // user ID from params

    if (isNaN(userId)) {
        // Sending response directly, no return needed
        res.status(400).json({
            success: false,
            code: "INVALID_USER_ID",
            message: "User ID must be a valid number.",
        });
        return;
    }

    const { image, about } = req.body;

    // Validate the presence of the profile image
    if (!image) {
        res.status(400).json({
            success: false,
            code: "VALIDATION_ERROR",
            message: "Profile image is required.",
        });
        return;
    }

    try {
        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            // If user not found, send error response
            res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
                message: "User not found.",
            });
            return;
        }

        // Create the new profile
        const newProfile = await prisma.profile.create({
            data: {
                image,
                about,
                userId,
            },
        });

        // Sending the successful response directly
        res.status(201).json({
            success: true,
            code: "PROFILE_CREATED_SUCCESSFULLY",
            message: "Profile created successfully.",
            data: newProfile,
        });

    } catch (error) {
        // Pass the error to the next middleware (error handler)
        next(error);
    }
};
