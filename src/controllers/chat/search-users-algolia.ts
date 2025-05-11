import { Request, Response } from "express";
import algoliaService from "../../services/algolia";

export const searchUsersAlgolia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;
    const userId = (req as any).userId;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        code: "INVALID_QUERY",
        message: "Search query is required",
      });
      return;
    }

    // Search users in Algolia, excluding the current user
    const results = await algoliaService.searchUsers(query, userId);

    res.status(200).json({
      success: true,
      code: "USERS_FOUND",
      message: "Users found successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};