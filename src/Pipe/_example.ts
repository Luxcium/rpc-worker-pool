import { Stats } from 'fs';
import { stat } from 'fs/promises';

export const myFunct001 = (
  myPath: string
): {
  myPath: () => Promise<string>;
  myStats: () => Promise<Stats>;
} => {
  const myStats = async () => {
    return stat(myPath);
  };

  return { myPath: async () => myPath, myStats };
};

export const myFunct002 = (myPathAndStats: {
  myPath: () => Promise<string>;
  myStats: () => Promise<Stats>;
}) => {
  const { myStats } = myPathAndStats;
  const myInfos = async () => {
    // in fact in the real world implementation
    // the goal would be to only await the things
    // that are required in this specific operation
    // if everything is awaited in the real life it would defeat the purpose
    const theStats = await myStats();
    return [theStats.isDirectory(), theStats.isFile(), theStats.size];
  };

  return { ...myPathAndStats, myInfos };
};
