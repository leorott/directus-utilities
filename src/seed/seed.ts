import { uploadAndReplaceImages } from './helper';
import {
  createItems,
  deleteItems,
  readItems,
  updateSingleton,
} from '@directus/sdk';
import { Level, log } from '../utils/logger';
import { DirectusUtilitiesClient } from '../utils/types';

interface SeedOptions {
  clearTableEntries?: boolean;
  fileRoot?: string;
}

interface SeedSingletonOptions {
  fileRoot?: string;
}

export const seedSingletonWithImages = async <T extends string>(
  directus: DirectusUtilitiesClient,
  collection: T,
  data: object,
  options: SeedSingletonOptions
) => {
  const [dataWithImages] = await uploadAndReplaceImages(
    directus,
    [data],
    options.fileRoot
  );
  log(`Updating singleton ${collection}.`, Level.INFO);
  await directus.request(updateSingleton(collection, dataWithImages));
  log(`Successfully updated singleton ${collection}.`, Level.SUCCESS);
};

export const seedWithImages = async <T extends string>(
  directus: DirectusUtilitiesClient,
  collection: T,
  items: object[],
  options: SeedOptions
) => {
  if (options.clearTableEntries) {
    directus.request(readItems(collection, { limit: -1 }));
    const existingItems = await directus.request(
      readItems(collection, { limit: -1 })
    );

    if (existingItems && existingItems.length) {
      log(
        `Removing ${existingItems.length} existing items from ${collection}.`,
        Level.INFO
      );
      await directus.request(
        deleteItems(
          collection,
          existingItems.map((item: any) => item.id)
        )
      );
    }
  }

  const itemsWithImages = await uploadAndReplaceImages(
    directus,
    items,
    options.fileRoot
  );
  log(
    `Creating items for ${collection} (count: ${itemsWithImages.length}).`,
    Level.INFO
  );
  await directus.request(createItems(collection, itemsWithImages));
  log(
    `Successfully created ${itemsWithImages.length} items for ${collection}.`,
    Level.SUCCESS
  );
};
