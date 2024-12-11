import { uploadFiles } from '@directus/sdk';
import fs from 'fs';
import path from 'path';
import { Level, log } from '../utils/logger';
import { DirectusUtilitiesClient } from '../utils/types';
import mimeDb from 'mime-db';

export const FILE_PREFIX = 'file:';
export const isFile = (value: any) =>
  typeof value === 'string' && value.startsWith(FILE_PREFIX);

const getMimeType = (fileExtension: string | undefined): string | null => {
  if (!fileExtension) {
    return null;
  }

  const mimeDbEntry = Object.entries(mimeDb).find(([, data]) => {
    return data.extensions?.includes(fileExtension);
  });

  return mimeDbEntry?.[0] || null;
};

export async function uploadImage(
  directus: DirectusUtilitiesClient,
  imagePath: string
): Promise<string | undefined> {
  const fileName = imagePath.split('/').at(-1) || '';
  const fileExtension = imagePath.split('.').at(-1);
  const fileMimeType = getMimeType(fileExtension) || 'application/octet-stream';
  const fileBuffer = await fs.promises.readFile(imagePath);
  const blob = new Blob([fileBuffer], { type: fileMimeType });

  const form = new FormData();
  console.log(fileMimeType);
  form.append('title', fileName);
  form.append('file', blob);

  const response = await directus.request(uploadFiles(form));

  return response?.id;
}

export const uploadAndReplaceImages = async (
  directus: DirectusUtilitiesClient,
  items: object[],
  fileRoot = ''
) => {
  const replacedItems: object[] = [];
  for (const item of items) {
    try {
      let itemWithReplacedImage = { ...item };
      for (const entry of Object.entries(item)) {
        const key = entry[0];
        const value = entry[1];
        if (isFile(value) && directus) {
          // Upload image and replace path with id
          itemWithReplacedImage = {
            ...itemWithReplacedImage,
            [key]: await uploadImage(
              directus,
              path.join(
                fileRoot || process.cwd(),
                `/${value.slice(FILE_PREFIX.length)}`
              )
            ),
          };
        }
      }
      replacedItems.push(itemWithReplacedImage);
    } catch (e) {
      log(`Error during image upload: ${e}`, Level.ERROR);
    }
  }
  return replacedItems;
};
