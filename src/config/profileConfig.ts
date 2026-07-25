import type { ProfileConfig } from "../types/profileConfig";
import profileConfigData from "./profileConfigData.json";

export const profileConfig: ProfileConfig = {
	avatar: profileConfigData.avatar,
	name: profileConfigData.name,
	bio: profileConfigData.bio,
	links: profileConfigData.links,
};