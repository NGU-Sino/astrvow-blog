import type { AnnouncementConfig } from "../types/announcementConfig";
import announcementConfigData from "./announcementConfigData.json";

export const announcementConfig: AnnouncementConfig = {
	title: announcementConfigData.title,
	content: announcementConfigData.content,
	closable: announcementConfigData.closable,
	link: announcementConfigData.link,
};
