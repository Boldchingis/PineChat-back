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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.syncUsersToAlgolia = exports.removeUserFromIndex = exports.indexUser = exports.configureAlgoliaIndex = void 0;
const algoliasearch_1 = __importDefault(require("algoliasearch"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const algoliaClient = (0, algoliasearch_1.default)(process.env.ALGOLIA_APP_ID || '3VA6M0DV3V', process.env.ALGOLIA_API_KEY || 'b373ee421c8806d8189b05a6c0db21c6');
const usersIndex = algoliaClient.initIndex(process.env.ALGOLIA_INDEX_NAME || 'pinechat_users');
const configureAlgoliaIndex = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield usersIndex.setSettings({
            searchableAttributes: ['name', 'email'],
            attributesForFaceting: ['filterable(name)', 'filterable(email)'],
        });
        console.log('Algolia index configured successfully');
    }
    catch (error) {
        console.error('Error configuring Algolia index:', error);
    }
});
exports.configureAlgoliaIndex = configureAlgoliaIndex;
const formatUserForAlgolia = (user) => {
    var _a, _b;
    return {
        objectID: user.id.toString(),
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: ((_a = user.profile) === null || _a === void 0 ? void 0 : _a.image) || null,
        about: ((_b = user.profile) === null || _b === void 0 ? void 0 : _b.about) || null,
        createdAt: user.createdAt,
    };
};
const indexUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userRecord = formatUserForAlgolia(user);
        yield usersIndex.saveObject(userRecord);
        console.log(`User ${user.id} indexed in Algolia`);
    }
    catch (error) {
        console.error(`Error indexing user ${user.id} in Algolia:`, error);
    }
});
exports.indexUser = indexUser;
const removeUserFromIndex = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield usersIndex.deleteObject(userId.toString());
        console.log(`User ${userId} removed from Algolia index`);
    }
    catch (error) {
        console.error(`Error removing user ${userId} from Algolia index:`, error);
    }
});
exports.removeUserFromIndex = removeUserFromIndex;
const syncUsersToAlgolia = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany({
            include: { profile: true },
        });
        const algoliaRecords = users.map((user) => formatUserForAlgolia(user));
        yield usersIndex.saveObjects(algoliaRecords);
        console.log(`Synced ${users.length} users to Algolia`);
    }
    catch (error) {
        console.error('Error syncing users to Algolia:', error);
    }
});
exports.syncUsersToAlgolia = syncUsersToAlgolia;
const searchUsers = (query, excludeUserId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hits } = yield usersIndex.search(query, {
            filters: excludeUserId ? `id != ${excludeUserId}` : '',
        });
        return hits;
    }
    catch (error) {
        console.error('Error searching users in Algolia:', error);
        return [];
    }
});
exports.searchUsers = searchUsers;
exports.default = {
    configureAlgoliaIndex: exports.configureAlgoliaIndex,
    indexUser: exports.indexUser,
    removeUserFromIndex: exports.removeUserFromIndex,
    syncUsersToAlgolia: exports.syncUsersToAlgolia,
    searchUsers: exports.searchUsers,
};
