import algoliasearch from 'algoliasearch';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APP_ID || '3VA6M0DV3V',
  process.env.ALGOLIA_API_KEY || 'b373ee421c8806d8189b05a6c0db21c6'
);

const usersIndex = algoliaClient.initIndex(process.env.ALGOLIA_INDEX_NAME || 'pinechat_users');

export const configureAlgoliaIndex = async () => {
  try {
    await usersIndex.setSettings({
      searchableAttributes: ['name', 'email'],
      attributesForFaceting: ['filterable(name)', 'filterable(email)'],
    });
    console.log('Algolia index configured successfully');
  } catch (error) {
    console.error('Error configuring Algolia index:', error);
  }
};

const formatUserForAlgolia = (user: User & { profile?: { image?: string; about?: string }; createdAt: Date }) => {
  return {
    objectID: user.id.toString(),
    id: user.id,
    name: user.name,
    email: user.email,
    profileImage: user.profile?.image || null,
    about: user.profile?.about || null,
    createdAt: user.createdAt,
  };
};

export const indexUser = async (user: User & { profile?: { image?: string; about?: string }; createdAt: Date }) => {
  try {
    const userRecord = formatUserForAlgolia(user);
    await usersIndex.saveObject(userRecord);
    console.log(`User ${user.id} indexed in Algolia`);
  } catch (error) {
    console.error(`Error indexing user ${user.id} in Algolia:`, error);
  }
};

export const removeUserFromIndex = async (userId: number) => {
  try {
    await usersIndex.deleteObject(userId.toString());
    console.log(`User ${userId} removed from Algolia index`);
  } catch (error) {
    console.error(`Error removing user ${userId} from Algolia index:`, error);
  }
};

export const syncUsersToAlgolia = async () => {
  try {
    const users = await prisma.user.findMany({
      include: { profile: true },
    });

    const algoliaRecords = users.map((user) =>
      formatUserForAlgolia(user as User & { profile?: { image?: string; about?: string }; createdAt: Date })
    );

    await usersIndex.saveObjects(algoliaRecords);
    console.log(`Synced ${users.length} users to Algolia`);
  } catch (error) {
    console.error('Error syncing users to Algolia:', error);
  }
};

export const searchUsers = async (query: string, excludeUserId?: number) => {
  try {
    const { hits } = await usersIndex.search(query, {
      filters: excludeUserId ? `id != ${excludeUserId}` : '',
    });
    return hits;
  } catch (error) {
    console.error('Error searching users in Algolia:', error);
    return [];
  }
};

export default {
  configureAlgoliaIndex,
  indexUser,
  removeUserFromIndex,
  syncUsersToAlgolia,
  searchUsers,
};
