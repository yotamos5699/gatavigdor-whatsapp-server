import { promises as fs } from "fs";
import { SendedMessage } from "../types";
const filePath = "./messages_log.json";

export async function updateJsonFile(newData: SendedMessage[]): Promise<void> {
  try {
    const jsonData = await fs.readFile(filePath, "utf-8");
    let parsedData: SendedMessage[] = [];

    try {
      parsedData = JSON.parse(jsonData);
    } catch (error) {
      throw new Error("Invalid JSON format in the file.");
    }

    // Merge new data with existing data
    parsedData = [...parsedData, ...newData];
    // Object.assign(parsedData, newData);

    const updatedJson = JSON.stringify(parsedData, null, 2);

    await fs.writeFile(filePath, updatedJson);
    console.log("JSON file updated successfully.");
  } catch (error) {
    console.error(`Error updating JSON file: ${error}`);
    throw error;
  }
}

export const getSendedByActionId = async (actionId: string) => {
  try {
    const jsonData = await fs.readFile(filePath, "utf-8");
    let parsedData: SendedMessage[] = [];

    parsedData = JSON.parse(jsonData);
    const requestedMessages = parsedData.filter((sm) => sm.actionId === actionId);

    if (requestedMessages[0]) return { data: requestedMessages, error: null } as const;

    return { data: null, error: "no messages in file data" } as const;
  } catch (error) {
    console.log("Invalid JSON format in the file.");
    return { data: null, error: `catch error while trying to get file data on path:${filePath}` } as const;
  }
};

// Example usage

// const newData = { name: 'John Doe', age: 30 };

// updateJsonFile(filePath, newData).catch(console.error);
