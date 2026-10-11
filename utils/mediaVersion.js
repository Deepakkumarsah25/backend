import MediaVersion from "../models/mediaversion/MediaVersion.js";

export const getMediaVersion = async (key) => {
  let media = await MediaVersion.findOne({ key });

  if (!media) {
    media = await MediaVersion.create({
      key,
      version: 1,
    });
  }

  return media.version;
};

export const bumpMediaVersion = async (key) => {
  const media = await MediaVersion.findOneAndUpdate(
    { key },
    {
      $inc: {
        version: 1,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return media.version;
};