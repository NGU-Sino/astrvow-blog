import { makeGenericAPIRouteHandler } from "@keystatic/core/api/generic";
import keystaticConfig from "../../../keystatic.config";

const handler = makeGenericAPIRouteHandler(
	{
		config: keystaticConfig,
		clientId: process.env.KEYSTATIC_GITHUB_CLIENT_ID,
		clientSecret: process.env.KEYSTATIC_GITHUB_CLIENT_SECRET,
		secret: process.env.KEYSTATIC_SECRET,
	},
	{ slugEnvName: "PUBLIC_KEYSTATIC_GITHUB_APP_SLUG" },
);

export const ALL = async (context: { request: Request }) => {
	return handler(context.request);
};

export const prerender = false;